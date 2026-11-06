"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import ImageUpload from "@/components/ImageUpload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface AdminProduct {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  isActive: boolean
  category: { id: string; name: string } | null
  categoryId: string | null
  imageUrl: string | null
  description: string | null
  relatedIds: string[]
}

interface Category {
  id: string
  name: string
}

export default function AdminProductEditPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""
  const router = useRouter()
  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState("none")
  const [imageUrl, setImageUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })

  useEffect(() => {
    ;(async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch("/api/admin/products", { cache: "no-store" }),
          fetch("/api/admin/categories", { cache: "no-store" }),
        ])
        if (cRes.ok) setCategories(await cRes.json())
        if (pRes.ok) {
          const data = await pRes.json()
          const p = data.find((x: AdminProduct) => x.id === id)
          if (p) {
            setProduct(p)
            setImageUrl(p.imageUrl ?? "")
            setCategoryId(p.categoryId ?? "none")
          }
        }
      } catch {
        setMessage({ text: "Failed to load product", type: "error" })
      }
      setLoading(false)
    })()
  }, [id])

  async function updateProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    fd.append("id", id)
    fd.set("imageUrl", imageUrl)
    fd.set("categoryId", categoryId === "none" ? "" : categoryId)
    const res = await fetch("/api/admin/products", {
      method: "POST",
      body: fd,
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setMessage({ text: "Product updated", type: "success" })
      setTimeout(() => router.push("/admin/products"), 800)
    } else {
      setMessage({ text: data.error || "Failed to update product", type: "error" })
    }
  }

  async function deleteProduct() {
    if (!confirm("Delete this product?")) return
    const fd = new FormData()
    fd.append("id", id)
    const res = await fetch("/api/admin/products", {
      method: "DELETE",
      body: fd,
    })
    if (res.ok) {
      router.push("/admin/products")
    } else {
      setMessage({ text: "Failed to delete product", type: "error" })
    }
  }

  if (loading) return <p>Loading...</p>
  if (!product) return <p>Product not found.</p>

  return (
    <div className="mx-auto max-w-[700px] py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Edit Product</h1>
        <div className="flex gap-2">
          <Button
            onClick={deleteProduct}
            variant="destructive"
          >
            Delete
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/products"><ArrowLeft className="h-4 w-4" />Products</Link>
          </Button>
        </div>
      </div>
      {message.text && (
        <p className={`mb-4 text-sm ${message.type === "error" ? "text-destructive" : "text-emerald-600"}`}>{message.text}</p>
      )}
      <Card>
        <form onSubmit={updateProduct} className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 p-6">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input name="name" required defaultValue={product.name} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input name="slug" required defaultValue={product.slug} />
          </div>
          <div className="space-y-2">
            <Label>Price (ETB)</Label>
            <Input name="price" type="number" step="0.01" required defaultValue={Number(product.price)} />
          </div>
          <div className="space-y-2">
            <Label>Stock</Label>
            <Input name="stock" type="number" required defaultValue={product.stock} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Image URL</Label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea name="description" rows={2} className="h-16" defaultValue={product.description ?? ""} />
          </div>
          <div className="space-y-2">
            <Label>Related IDs (comma-separated)</Label>
            <Input name="relatedIds" defaultValue={(product.relatedIds ?? []).join(", ")} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Input id="edit-isActive" name="isActive" type="checkbox" defaultChecked={product.isActive} className="h-4 w-4" />
            <Label htmlFor="edit-isActive" className="mb-0">Active</Label>
          </div>
          <div className="col-span-full">
            <Button type="submit">Update Product</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

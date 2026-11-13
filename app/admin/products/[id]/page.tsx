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
import { CardContent } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
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

interface ProductVariant {
  id: string
  color: string
  size: string
  imageUrl: string | null
  price: number | null
  stock: number
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
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [newVariant, setNewVariant] = useState<{
    color: string
    size: string
    imageUrl: string
    price: string
    stock: string
  }>({ color: "", size: "", imageUrl: "", price: "", stock: "" })
  const [showAddVariantForm, setShowAddVariantForm] = useState(false)
  const [variantImageUrl, setVariantImageUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })

  useEffect(() => {
    ;(async () => {
      try {
        const [pRes, cRes, vRes] = await Promise.all([
          fetch("/api/admin/products", { cache: "no-store" }),
          fetch("/api/admin/categories", { cache: "no-store" }),
          fetch(`/api/products/${id}/variants`, { cache: "no-store" }),
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
        if (vRes.ok) setVariants(await vRes.json())
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

  async function addVariant() {
    if (!newVariant.color || !newVariant.size) {
      setMessage({ text: "Color and size are required", type: "error" })
      return
    }
    const fd = new FormData()
    fd.append("productId", id)
    fd.append("color", newVariant.color)
    fd.append("size", newVariant.size)
    fd.append("imageUrl", variantImageUrl)
    fd.append("price", newVariant.price)
    fd.append("stock", newVariant.stock)
    const res = await fetch("/api/admin/variants", {
      method: "POST",
      body: fd,
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setMessage({ text: "Variant added", type: "success" })
      setShowAddVariantForm(false)
      setNewVariant({ color: "", size: "", imageUrl: "", price: "", stock: "" })
      setVariantImageUrl("")
      const vRes = await fetch(`/api/products/${id}/variants`, { cache: "no-store" })
      if (vRes.ok) setVariants(await vRes.json())
    } else {
      setMessage({ text: data.error || "Failed to add variant", type: "error" })
    }
  }

  async function updateVariant(variant: ProductVariant, field: keyof ProductVariant, value: string) {
    const fd = new FormData()
    fd.append(field, value)
    const res = await fetch(`/api/admin/variants/${variant.id}`, {
      method: "PUT",
      body: fd,
    })
    if (res.ok) {
      const vRes = await fetch(`/api/products/${id}/variants`, { cache: "no-store" })
      if (vRes.ok) setVariants(await vRes.json())
      setMessage({ text: "Variant updated", type: "success" })
    } else {
      setMessage({ text: "Failed to update variant", type: "error" })
    }
  }

  async function deleteVariant(variantId: string) {
    if (!confirm("Delete this variant?")) return
    const res = await fetch(`/api/admin/variants/${variantId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setVariants((prev) => prev.filter((v) => v.id !== variantId))
      setMessage({ text: "Variant deleted", type: "success" })
    } else {
      setMessage({ text: "Failed to delete variant", type: "error" })
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
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Variants</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowAddVariantForm((v) => !v)}>
            {showAddVariantForm ? "Cancel" : "Add Variant"}
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          {showAddVariantForm ? (
            <form onSubmit={(e) => { e.preventDefault(); addVariant() }} className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 mb-4">
              <div className="space-y-1">
                <Label className="text-xs">Color</Label>
                <Input
                  value={newVariant.color}
                  onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                  placeholder="e.g. Red"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Size</Label>
                <Input
                  value={newVariant.size}
                  onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                  placeholder="e.g. Large"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Image</Label>
                <ImageUpload value={variantImageUrl} onChange={setVariantImageUrl} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price (ETB)</Label>
                <Input
                  value={newVariant.price}
                  type="number"
                  step="0.01"
                  onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stock</Label>
                <Input
                  value={newVariant.stock}
                  type="number"
                  onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="col-span-full flex gap-2">
                <Button type="submit" size="sm">Save Variant</Button>
                <Button variant="outline" size="sm" onClick={() => {
                  setShowAddVariantForm(false)
                  setNewVariant({ color: "", size: "", imageUrl: "", price: "", stock: "" })
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-2">Color</th>
                  <th className="text-left pb-2">Size</th>
                  <th className="text-left pb-2">Image</th>
                  <th className="text-right pb-2">Price</th>
                  <th className="text-center pb-2">Stock</th>
                  <th className="text-right pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id} className="border-b border-border">
                    <td className="py-2">
                      <Input
                        value={v.color}
                        onChange={(e) => updateVariant(v, "color", e.target.value)}
                        className="w-full bg-transparent border-none p-0 focus:ring-0"
                      />
                    </td>
                    <td className="py-2">
                      <Input
                        value={v.size}
                        onChange={(e) => updateVariant(v, "size", e.target.value)}
                        className="w-full bg-transparent border-none p-0 focus:ring-0"
                      />
                    </td>
                    <td className="py-2">
                      <Input
                        value={v.imageUrl ?? ""}
                        onChange={(e) => updateVariant(v, "imageUrl", e.target.value)}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs"
                      />
                    </td>
                    <td className="py-2 text-right">
                      <Input
                        value={v.price?.toString() ?? ""}
                        onChange={(e) => updateVariant(v, "price", e.target.value)}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs text-right"
                        type="number"
                        step="0.01"
                      />
                    </td>
                    <td className="py-2 text-center">
                      <Input
                        value={v.stock.toString()}
                        onChange={(e) => updateVariant(v, "stock", e.target.value)}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs text-center"
                        type="number"
                      />
                    </td>
                    <td className="py-2 text-right">
                      <Button variant="destructive" size="sm" onClick={() => deleteVariant(v.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {variants.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No variants yet. Add variants above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

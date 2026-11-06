"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
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
import { Table } from "@/components/ui/table"
import { TableBody } from "@/components/ui/table"
import { TableCell } from "@/components/ui/table"
import { TableHead } from "@/components/ui/table"
import { TableHeader } from "@/components/ui/table"
import { TableRow } from "@/components/ui/table"
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

interface Category {
  id: string
  name: string
  slug: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })
  const [loading, setLoading] = useState(true)
  const [imageUrl, setImageUrl] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [categoryId, setCategoryId] = useState("none")
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    load()

    const es = new EventSource("/api/events")
    eventSourceRef.current = es

    es.addEventListener("product_updated", async () => { await load() })
    es.addEventListener("stock_updated", async () => { await load() })

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [])

  async function load() {
    const [pRes, cRes] = await Promise.all([
      fetch("/api/admin/products", { cache: "no-store" }),
      fetch("/api/admin/categories", { cache: "no-store" }),
    ])
    if (pRes.ok) setProducts(await pRes.json())
    if (cRes.ok) setCategories(await cRes.json())
    setLoading(false)
  }

  async function addProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set("imageUrl", imageUrl)
    fd.set("categoryId", categoryId === "none" ? "" : categoryId)
    const res = await fetch("/api/admin/products", { method: "POST", body: fd })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setMessage({ text: "Product created", type: "success" })
      form.reset()
      setImageUrl("")
      setCategoryId("none")
      setShowAddForm(false)
      await load()
    } else {
      setMessage({ text: data.error || "Failed", type: "error" })
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return
    const fd = new FormData()
    fd.append("id", id)
    const res = await fetch("/api/admin/products", {
      method: "DELETE",
      body: fd,
    })
    if (res.ok) await load()
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="mx-auto max-w-[1100px] py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddForm((v) => !v)}>
            {showAddForm ? "Cancel" : "Add Product"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
          </Button>
        </div>
      </div>
      {message.text && (
        <p className={`mb-4 text-sm ${message.type === "error" ? "text-destructive" : "text-emerald-600"}`}>{message.text}</p>
      )}
      {showAddForm ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addProduct} className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input name="name" required />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input name="slug" required />
              </div>
              <div className="space-y-2">
                <Label>Price (ETB)</Label>
                <Input name="price" type="number" step="0.01" required />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input name="stock" type="number" required />
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
                <Textarea name="description" rows={2} className="h-16" />
              </div>
              <div className="space-y-2">
                <Label>Related IDs (comma-separated)</Label>
                <Input name="relatedIds" placeholder="id1, id2" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Input id="add-isActive" name="isActive" type="checkbox" defaultChecked className="h-4 w-4" />
                <Label htmlFor="add-isActive" className="mb-0">Active</Label>
              </div>
              <div className="col-span-full">
                <Button type="submit">Save Product</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            <TableHead className="text-center">Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.category?.name ?? "—"}</TableCell>
              <TableCell className="text-right">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(p.price)}
              </TableCell>
              <TableCell className="text-center">{p.stock}</TableCell>
              <TableCell className="text-center">{p.isActive ? "Yes" : "No"}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/products/${p.id}`} className="mr-2">Edit</Link>
                </Button>
                <Button
                  onClick={() => deleteProduct(p.id)}
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

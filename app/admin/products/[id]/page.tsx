"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import ImageUpload from "@/components/ImageUpload"

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

export default function AdminProductEditPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""
  const router = useRouter()
  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })

  async function updateProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    fd.append("imageUrl", imageUrl)
    const res = await fetch("/api/admin/products", {
      method: "POST",
      body: fd,
    })
    if (res.ok) {
      setMessage({ text: "Product updated", type: "success" })
      setTimeout(() => router.push("/admin/products"), 800)
    } else {
      setMessage({ text: "Failed to update product", type: "error" })
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

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      if (!id) return
      try {
        const res = await fetch(`/api/admin/products`, { cache: "no-store" })
        const data = await res.json()
        const p = data.find((x: AdminProduct) => x.id === id)
        if (!cancelled) setProduct(p ?? null)
        if (!cancelled) setImageUrl(p?.imageUrl ?? "")
      } catch {
        if (!cancelled) setMessage({ text: "Failed to load product", type: "error" })
      }
      if (!cancelled) setLoading(false)
    }
    fetchData()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <p>Loading...</p>
  if (!product) return <p>Product not found.</p>

  return (
    <div className="section" style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 1.5 }}>
        <h1 style={{ fontSize: 1.75, fontWeight: 700, margin: 0 }}>Edit Product</h1>
        <Link href="/admin/products" className="btn btn-outline">
          Back
        </Link>
      </div>
      {message.text && <p className={message.type === "error" ? "error" : "success"}>{message.text}</p>}
      <form onSubmit={updateProduct} className="card" style={{ marginBottom: 1.5, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1 }}>
        <input type="hidden" name="id" value={product.id} />
        <div>
          <div className="label">Name</div>
          <input name="name" required className="input" defaultValue={product.name} />
        </div>
        <div>
          <div className="label">Slug</div>
          <input name="slug" required className="input" defaultValue={product.slug} />
        </div>
        <div>
          <div className="label">Price (ETB)</div>
          <input name="price" type="number" step="0.01" required className="input" defaultValue={Number(product.price)} />
        </div>
        <div>
          <div className="label">Stock</div>
          <input name="stock" type="number" required className="input" defaultValue={product.stock} />
        </div>
        <div>
          <div className="label">Category</div>
          <select name="categoryId" className="input">
            <option value="">None</option>
            {product.category ? (
              <option value={product.category.id}>{product.category.name}</option>
            ) : null}
          </select>
        </div>
        <div>
          <div className="label">Image URL</div>
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </div>
        <div>
          <div className="label">Description</div>
          <textarea name="description" className="input" rows={2} style={{ height: 64 }}>
            {product.description ?? ""}
          </textarea>
        </div>
        <div>
          <div className="label">Related IDs (comma-separated)</div>
          <input name="relatedIds" className="input" defaultValue={(product.relatedIds ?? []).join(", ")} />
        </div>
        <div style={{ display: "flex", alignItems: "end", gap: 0.5 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 0.4, fontSize: "0.9rem", marginBottom: 0 }}>
            <input name="isActive" type="checkbox" defaultChecked={product.isActive} />
            Active
          </label>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <button type="submit" className="btn btn-primary">Update Product</button>
        </div>
      </form>
      <button
        type="button"
        className="btn btn-danger"
        style={{ color: "#fff" }}
        onClick={deleteProduct}
      >
        Delete Product
      </button>
    </div>
  )
}

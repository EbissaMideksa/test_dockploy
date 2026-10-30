"use client"

import { useEffect, useState } from "react"

interface Product {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  isActive: boolean
  category: { name: string } | null
  categoryId: string | null
  imageUrl: string | null
  description: string | null
  relatedIds: string[]
}

interface Category {
  id: string
  name: string
  slug: string
  _count: { products: number }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
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
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    const res = await fetch("/api/admin/products", { method: "POST", body: fd })
    const data = await res.json()
    if (res.ok) {
      setMessage({ text: "Product created", type: "success" })
      ;(e.currentTarget as HTMLFormElement).reset()
      load()
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
    if (res.ok) load()
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="section" style={{ maxWidth: 1100 }}>
      <h1 style={{ fontSize: 1.75, fontWeight: 700, marginBottom: 1.5 }}>Products</h1>
      {message.text && (
        <p className={message.type === "error" ? "error" : "success"}>{message.text}</p>
      )}
      <form onSubmit={addProduct} className="card" style={{ marginBottom: 1.5, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1 }}>
        <div>
          <div className="label">Name</div>
          <input name="name" required className="input" />
        </div>
        <div>
          <div className="label">Slug</div>
          <input name="slug" required className="input" />
        </div>
        <div>
          <div className="label">Price (ETB)</div>
          <input name="price" type="number" step="0.01" required className="input" />
        </div>
        <div>
          <div className="label">Stock</div>
          <input name="stock" type="number" required className="input" />
        </div>
        <div>
          <div className="label">Category</div>
          <select name="categoryId" className="input">
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="label">Image URL</div>
          <input name="imageUrl" className="input" />
        </div>
        <div>
          <div className="label">Description</div>
          <textarea name="description" className="input" rows={2} style={{ height: 64 }} />
        </div>
        <div>
          <div className="label">Related IDs (comma-separated)</div>
          <input name="relatedIds" className="input" placeholder="id1, id2" />
        </div>
        <div style={{ display: "flex", alignItems: "end", gap: 0.5 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 0.4, fontSize: 0.9, marginBottom: 0 }}>
            <input name="isActive" type="checkbox" defaultChecked />
            Active
          </label>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <button type="submit" className="btn btn-primary">Save Product</button>
        </div>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th style={{ textAlign: "right" }}>Price</th>
            <th style={{ textAlign: "center" }}>Stock</th>
            <th style={{ textAlign: "center" }}>Active</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.category?.name ?? "—"}</td>
              <td style={{ textAlign: "right" }}>
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(p.price)}
              </td>
              <td style={{ textAlign: "center" }}>{p.stock}</td>
              <td style={{ textAlign: "center" }}>{p.isActive ? "Yes" : "No"}</td>
              <td style={{ textAlign: "right" }}>
                <button
                  onClick={() => deleteProduct(p.id)}
                  className="btn btn-danger"
                  style={{ padding: "0.35rem 0.8rem", fontSize: 0.85 }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

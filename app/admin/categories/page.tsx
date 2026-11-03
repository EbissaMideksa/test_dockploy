"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

interface Category {
  id: string
  name: string
  slug: string
  _count: { products: number }
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => { setCategories(data); setLoading(false) })
  }, [])

  async function addCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    const res = await fetch("/api/admin/categories", { method: "POST", body: fd })
    if (res.ok) {
      setMessage({ text: "Category created", type: "success" })
      ;(e.currentTarget as HTMLFormElement).reset()
      fetch("/api/admin/categories", { cache: "no-store" }).then((r) => r.json()).then(setCategories)
    } else {
      setMessage({ text: "Failed", type: "error" })
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete category?")) return
    const fd = new FormData()
    fd.append("id", id)
    await fetch("/api/admin/categories", { method: "DELETE", body: fd })
    fetch("/api/admin/categories", { cache: "no-store" }).then((r) => r.json()).then(setCategories)
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="section" style={{ maxWidth: 700 }}>
      <h1 style={{ fontSize: 1.75, fontWeight: 700, marginBottom: 1.5 }}>Categories</h1>
      {message.text && <p className={message.type === "error" ? "error" : "success"}>{message.text}</p>}
      <form onSubmit={addCategory} className="card" style={{ display: "flex", gap: 0.75, marginBottom: 1.5 }}>
        <input name="name" required className="input" placeholder="Category name" style={{width: 100 }} />
        <input name="slug" className="input" placeholder="slug" style={{ width: 180 }} />
        <input name="imageUrl" className="input" placeholder="image URL" style={{ width: 220 }} />
        <button type="submit" className="btn btn-primary">Add Category</button>
      </form>
      <table className="table">
        <thead>
          <tr><th>Name</th><th>Slug</th><th style={{ textAlign: "center" }}>Products</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.slug}</td>
              <td style={{ textAlign: "center" }}>{c._count.products}</td>
              <td style={{ textAlign: "right" }}>
                <Link
                  href={`/admin/categories/${c.id}`}
                  className="btn btn-outline"
                  style={{ padding: "0.35rem 0.8rem", fontSize: "0.85rem", marginRight: "0.4rem", color: "#2563eb" }}
                >
                  Edit
                </Link>
                <button
                  onClick={() => deleteCategory(c.id)}
                  className="btn btn-danger"
                  style={{ padding: "0.35rem 0.8rem", fontSize: "0.85rem", color: "#fff" }}
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

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface Category {
  id: string
  name: string
  slug: string
  imageUrl: string | null
}

export default function AdminCategoryEditPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })

  async function updateCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    fd.append("id", id)
    const res = await fetch("/api/admin/categories", {
      method: "PATCH",
      body: fd,
    })
    if (res.ok) {
      setMessage({ text: "Category updated", type: "success" })
      setTimeout(() => {
        window.location.href = "/admin/categories"
      }, 800)
    } else {
      setMessage({ text: "Failed to update category", type: "error" })
    }
  }

  async function deleteCategory() {
    if (!confirm("Delete this category?")) return
    const fd = new FormData()
    fd.append("id", id)
    const res = await fetch("/api/admin/categories", {
      method: "DELETE",
      body: fd,
    })
    if (res.ok) {
      window.location.href = "/admin/categories"
    } else {
      setMessage({ text: "Failed to delete category", type: "error" })
    }
  }

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      if (!id) return
      try {
        const res = await fetch(`/api/admin/categories`, { cache: "no-store" })
        const data = await res.json()
        const cat = data.find((c: Category) => c.id === id)
        if (!cancelled) setCategory(cat ?? null)
      } catch {
        if (!cancelled) setMessage({ text: "Failed to load category", type: "error" })
      }
      if (!cancelled) setLoading(false)
    }
    fetchData()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <p>Loading...</p>
  if (!category) return <p>Category not found.</p>

  return (
    <div className="section" style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 1.5 }}>
        <h1 style={{ fontSize: 1.75, fontWeight: 700, margin: 0 }}>Edit Category</h1>
        <Link href="/admin/categories" className="btn btn-outline">
          Back
        </Link>
      </div>
      {message.text && <p className={message.type === "error" ? "error" : "success"}>{message.text}</p>}
      <form onSubmit={updateCategory} className="card" style={{ marginBottom: 1.5, display: "flex", gap: 0.75 }}>
        <input
          name="name"
          required
          className="input"
          placeholder="Category name"
          defaultValue={category.name}
          style={{ width: 100 }}
        />
        <input
          name="slug"
          className="input"
          placeholder="slug"
          defaultValue={category.slug}
          style={{ width: 180 }}
        />
        <input
          name="imageUrl"
          className="input"
          placeholder="image URL"
          defaultValue={category.imageUrl ?? ""}
          style={{ width: 220 }}
        />
        <button type="submit" className="btn btn-primary">
          Update Category
        </button>
      </form>
      <form onSubmit={(e) => { e.preventDefault(); deleteCategory() }} style={{ display: "inline" }}>
        <button type="submit" className="btn btn-danger" style={{ color: "#fff" }}>
          Delete Category
        </button>
      </form>
    </div>
  )
}

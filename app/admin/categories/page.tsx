"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table } from "@/components/ui/table"
import { TableBody } from "@/components/ui/table"
import { TableCell } from "@/components/ui/table"
import { TableHead } from "@/components/ui/table"
import { TableHeader } from "@/components/ui/table"
import { TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"

interface Category {
  id: string
  name: string
  slug: string
  imageUrl: string | null
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const res = await fetch("/api/admin/categories", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch {
      setMessage({ text: "Failed to load categories", type: "error" })
    }
    setLoading(false)
  }

  async function addCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      body: fd,
    })
    if (res.ok) {
      setMessage({ text: "Category created", type: "success" })
      ;(e.currentTarget as HTMLFormElement).reset()
      loadCategories()
    } else {
      setMessage({ text: "Failed to create category", type: "error" })
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete category?")) return
    const fd = new FormData()
    fd.append("id", id)
    const res = await fetch("/api/admin/categories", {
      method: "DELETE",
      body: fd,
    })
    if (res.ok) loadCategories()
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="mx-auto max-w-[700px] py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
        <Button variant="outline" asChild>
          <Link href="/admin"> &rarr Dashboard</Link>
        </Button>
      </div>
      {message.text && <p className={`mb-4 text-sm ${message.type === "error" ? "text-destructive" : "text-emerald-600"}`}>{message.text}</p>}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={addCategory} className="flex gap-3">
            <Input name="name" required className="w-full flex-1" placeholder="Category name" />
            <Input name="slug" className="w-[180px]" placeholder="slug" />
            <Input name="imageUrl" className="w-[220px]" placeholder="image URL" />
            <Button type="submit">Add Category</Button>
          </form>
        </CardContent>
      </Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead className="text-center">Products</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.name}</TableCell>
              <TableCell>{c.slug}</TableCell>
              <td className="p-4 text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/admin/categories/${c.id}`}>Edit</Link>
                  </Button>
                  <Button
                    onClick={() => deleteCategory(c.id)}
                    variant="destructive"
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-0 ${className ?? ""}`}>{children}</div>
}

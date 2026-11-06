"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"

interface Category {
  id: string
  name: string
  slug: string
  imageUrl: string | null
}

export default function AdminCategoryEditPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""
  const router = useRouter()
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/categories`, { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          const cat = data.find((c: Category) => c.id === id)
          setCategory(cat ?? null)
        }
      } catch {
        setMessage({ text: "Failed to load category", type: "error" })
      }
      setLoading(false)
    })()
  }, [id])

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
        router.push("/admin/categories")
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
      router.push("/admin/categories")
    } else {
      setMessage({ text: "Failed to delete category", type: "error" })
    }
  }

  if (loading) return <p>Loading...</p>
  if (!category) return <p>Category not found.</p>

  return (
    <div className="mx-auto max-w-[700px] py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Edit Category</h1>
        <Button variant="outline" asChild>
          <Link href="/admin"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
        </Button>
      </div>
      {message.text && (
        <p className={`mb-4 text-sm ${message.type === "error" ? "text-destructive" : "text-emerald-600"}`}>{message.text}</p>
      )}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={updateCategory} className="flex gap-3">
            <Input name="name" required className="w-full flex-1" placeholder="Category name" defaultValue={category.name} />
            <Input name="slug" className="w-[180px]" placeholder="slug" defaultValue={category.slug} />
            <Input name="imageUrl" className="w-[220px]" placeholder="image URL" defaultValue={category.imageUrl ?? ""} />
            <Button type="submit">Update Category</Button>
          </form>
        </CardContent>
      </Card>
      <form onSubmit={(e) => { e.preventDefault(); deleteCategory() }} className="mt-4 inline">
        <Button variant="destructive" type="submit">Delete Category</Button>
      </form>
    </div>
  )
}

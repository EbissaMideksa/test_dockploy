import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  getAdminProducts,
  updateProduct as updateProductAction,
  deleteProduct as deleteProductAction,
} from "@/app/_actions/products"

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

export const dynamic = "force-dynamic"

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let products: AdminProduct[] = []
  try {
    products = (await getAdminProducts()) as unknown as AdminProduct[]
  } catch {
    redirect("/login")
  }
  const product = products.find((p: AdminProduct) => p.id === id)
  if (!product) {
    notFound()
  }

  return (
    <div className="section" style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 1.5 }}>
        <h1 style={{ fontSize: 1.75, fontWeight: 700, margin: 0 }}>Edit Product</h1>
        <Link href="/admin/products" className="btn btn-outline">Back</Link>
      </div>

      <form action={updateProductAction} method="POST" className="card" style={{ marginBottom: 1.5, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1 }}>
        <input type="hidden" name="id" value={product.id} />
        <div>
          <div className="label">Name</div>
          <input name="name" defaultValue={product.name} className="input" />
        </div>
        <div>
          <div className="label">Slug</div>
          <input name="slug" defaultValue={product.slug} className="input" />
        </div>
        <div>
          <div className="label">Price (ETB)</div>
          <input name="price" type="number" step="0.01" defaultValue={Number(product.price)} className="input" />
        </div>
        <div>
          <div className="label">Stock</div>
          <input name="stock" type="number" defaultValue={product.stock} className="input" />
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
          <input name="imageUrl" defaultValue={product.imageUrl ?? ""} className="input" />
        </div>
        <div>
          <div className="label">Description</div>
          <textarea name="description" className="input" rows={2} style={{ height: 64 }}>
            {product.description ?? ""}
          </textarea>
        </div>
        <div>
          <div className="label">Related IDs (comma-separated)</div>
          <input name="relatedIds" defaultValue={(product.relatedIds ?? []).join(", ")} className="input" />
        </div>
        <div style={{ display: "flex", alignItems: "end", gap: 0.5 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 0.4, fontSize: 0.9, marginBottom: 0 }}>
            <input name="isActive" type="checkbox" defaultChecked={product.isActive} />
            Active
          </label>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <button type="submit" className="btn btn-primary">Update Product</button>
        </div>
      </form>

      <form action={deleteProductAction} method="POST" style={{ display: "inline" }}>
        <input type="hidden" name="id" value={product.id} />
        <button type="submit" className="btn btn-danger" onClick={(e) => { if (!confirm("Delete this product?")) e.preventDefault() }}>
          Delete Product
        </button>
      </form>
    </div>
  )
}

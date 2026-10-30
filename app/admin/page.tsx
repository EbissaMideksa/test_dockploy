import Link from "next/link"
import { redirect } from "next/navigation"
import { getAdminProducts, getAdminCategories, getAdminOrders } from "@/app/_actions/products"

interface AdminProduct {
  id: string
  name: string
  price: number
  stock: number
  category: { name: string } | null
}

interface AdminCategory {
  id: string
  name: string
  slug: string
  _count: { products: number }
}

interface AdminOrder {
  id: string
  orderNumber: string
  total: number
  status: string
}

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  let products: AdminProduct[] = []
  let categories: AdminCategory[] = []
  let orders: AdminOrder[] = []
  try {
    products = (await getAdminProducts()) as unknown as AdminProduct[]
    categories = (await getAdminCategories()) as unknown as AdminCategory[]
    orders = (await getAdminOrders()) as unknown as AdminOrder[]
  } catch {
    redirect("/login")
  }

  const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0)
  const pending = orders.filter((o) => o.status === "PENDING").length

  return (
    <div className="section" style={{ maxWidth: 1100 }}>
      <h1 style={{ fontSize: 1.75, fontWeight: 700, marginBottom: 1.5 }}>Admin Dashboard</h1>

      <div style={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 2 }}>
        <div className="card" style={{ padding: 1.25 }}>
          <p style={{ margin: 0, fontSize: 0.85, color: "#64748b" }}>Products</p>
          <p style={{ margin: 0.25, fontSize: 1.5, fontWeight: 700 }}>{products.length}</p>
        </div>
        <div className="card" style={{ padding: 1.25 }}>
          <p style={{ margin: 0, fontSize: 0.85, color: "#64748b" }}>Categories</p>
          <p style={{ margin: 0.25, fontSize: 1.5, fontWeight: 700 }}>{categories.length}</p>
        </div>
        <div className="card" style={{ padding: 1.25 }}>
          <p style={{ margin: 0, fontSize: 0.85, color: "#64748b" }}>Orders</p>
          <p style={{ margin: 0.25, fontSize: 1.5, fontWeight: 700 }}>{orders.length}</p>
        </div>
        <div className="card" style={{ padding: 1.25 }}>
          <p style={{ margin: 0, fontSize: 0.85, color: "#64748b" }}>Pending Orders</p>
          <p style={{ margin: 0.25, fontSize: 1.5, fontWeight: 700 }}>{pending}</p>
        </div>
        <div className="card" style={{ padding: 1.25 }}>
          <p style={{ margin: 0, fontSize: 0.85, color: "#64748b" }}>Total Sales</p>
          <p style={{ margin: 0.25, fontSize: 1.5, fontWeight: 700 }}>
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(totalSales)}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(3, 1fr)" }}>
        <Link href="/admin/products" className="btn btn-primary" style={{ width: "100%" }}>
          Manage Products
        </Link>
        <Link href="/admin/categories" className="btn btn-outline" style={{ width: "100%" }}>
          Manage Categories
        </Link>
        <Link href="/admin/orders" className="btn btn-outline" style={{ width: "100%" }}>
          Manage Orders
        </Link>
      </div>
    </div>
  )
}

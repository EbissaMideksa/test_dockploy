export const dynamic = "force-dynamic"

import Link from "next/link"
import { getAdminProducts, getAdminCategories, getAdminOrders } from "@/app/_actions/products"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AdminProduct {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  isActive: boolean
  category: { id: string; name: string } | null
}

interface AdminCategory {
  id: string
  name: string
  slug: string
}

interface AdminOrder {
  id: string
  total: number
  status: string
}

export default async function AdminPage() {
  let products: AdminProduct[] = []
  let categories: AdminCategory[] = []
  let orders: AdminOrder[] = []

  try {
    const [pRes, cRes, oRes] = await Promise.all([
      getAdminProducts(),
      getAdminCategories(),
      getAdminOrders(),
    ])
    products = pRes as unknown as AdminProduct[]
    categories = cRes as unknown as AdminCategory[]
    orders = oRes as unknown as AdminOrder[]
  } catch {
    products = []
    categories = []
    orders = []
  }

  const totalSales = orders.reduce((sum: number, o: AdminOrder) => sum + Number(o.total), 0)
  const pending = orders.filter((o: AdminOrder) => o.status === "PENDING").length

  const cardClasses = "card p-5"

  return (
    <div className="mx-auto max-w-[1100px] py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Admin Dashboard</h1>

      <div className="grid gap-4 grid-cols-4 mb-8">
        <div className={cardClasses}>
          <p className="text-sm text-muted-foreground mb-1">Products</p>
          <p className="text-2xl font-bold text-foreground">{products.length}</p>
        </div>
        <div className={cardClasses}>
          <p className="text-sm text-muted-foreground mb-1">Categories</p>
          <p className="text-2xl font-bold text-foreground">{categories.length}</p>
        </div>
        <div className={cardClasses}>
          <p className="text-sm text-muted-foreground mb-1">Orders</p>
          <p className="text-2xl font-bold text-foreground">{orders.length}</p>
        </div>
        <div className={cardClasses}>
          <p className="text-sm text-muted-foreground mb-1">Pending Orders</p>
          <p className="text-2xl font-bold text-foreground">{pending}</p>
        </div>
        <div className={cardClasses}>
          <p className="text-sm text-muted-foreground mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-foreground">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(totalSales)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-4">
        <Link href="/admin/products" className={`${cardClasses} bg-primary text-white text-center hover:bg-primary/700`}>
          Manage Products
        </Link>
        <Link href="/admin/categories" className={`${cardClasses} border border-input text-muted-foreground text-center hover:bg-secondary`}>
          Manage Categories
        </Link>
        <Link href="/admin/orders" className={`${cardClasses} border border-input text-muted-foreground text-center hover:bg-secondary`}>
          Manage Orders
        </Link>
        <Link href="/admin/settings" className={`${cardClasses} border border-input text-muted-foreground text-center hover:bg-secondary`}>
          Settings
        </Link>
      </div>
    </div>
  )
}

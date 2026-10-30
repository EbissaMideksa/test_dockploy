import Link from "next/link"
import { redirect } from "next/navigation"
import { getAdminOrders } from "@/app/_actions/products"

interface AdminOrder {
  id: string
  orderNumber: string
  user: string
  status: string
  paymentStatus: string | null
  total: number
  createdAt: string
}

export const dynamic = "force-dynamic"

export default async function AdminOrdersPage() {
  let orders: AdminOrder[] = []
  try {
    orders = (await getAdminOrders()) as unknown as AdminOrder[]
  } catch {
    redirect("/login")
  }

  return (
    <div className="section" style={{ maxWidth: 1100 }}>
      <h1 style={{ fontSize: 1.75, fontWeight: 700, marginBottom: 1.5 }}>Manage Orders</h1>
      {orders.length === 0 ? (
        <p>No orders.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Payment</th>
              <th style={{ textAlign: "right" }}>Total</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.orderNumber}</td>
                  <td>{o.user}</td>
                  <td>
                    <form action={`/api/admin/orders/${o.id}`} method="POST" style={{ display: "inline" }}>
                      <select name="status" defaultValue={o.status} className="input" style={{ width: 130, padding: 0.3, fontSize: 0.85 }}>
                        <option value="PENDING">Pending</option>
                        <option value="PAID">Paid</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      <button type="submit" className="btn btn-outline btn-sm" style={{ padding: "0.2rem 0.6rem", fontSize: 0.8, marginLeft: 0.4 }}>
                        Update
                      </button>
                    </form>
                  </td>
                  <td>
                    <span className={`badge badge-${o.paymentStatus?.toLowerCase() ?? "pending"}`}>
                      {o.paymentStatus ?? "—"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(o.total)}
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/orders/${o.id}`} className="btn btn-outline btn-sm" style={{ padding: "0.35rem 0.8rem" }}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      )}
    </div>
  )
}

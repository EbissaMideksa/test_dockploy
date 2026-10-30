import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: { include: { product: true } }, payment: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="section">
      <h1 style={{ fontSize: 1.75, fontWeight: 700, marginBottom: 1 }}>My Orders</h1>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Order #</th>
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
                <td>
                  <Link href={`/orders/${o.id}`} style={{ fontWeight: 600, color: "#0f172a" }}>
                    {o.orderNumber}
                  </Link>
                </td>
                <td>
                  <span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span>
                </td>
                <td>
                  <span className={`badge badge-${o.payment?.status?.toLowerCase() ?? "pending"}`}>
                    {o.payment?.status ?? "—"}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(o.total))}
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

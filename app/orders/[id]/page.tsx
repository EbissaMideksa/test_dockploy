import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, payment: true },
  })
  if (!order) {
    notFound()
  }
  if (order.userId !== user.id) {
    notFound()
  }

  return (
    <div className="section" style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 1.5 }}>
        <h1 style={{ fontSize: 1.75, fontWeight: 700, margin: 0 }}>Order {order.orderNumber}</h1>
        <span className={`badge badge-${order.status.toLowerCase()}`} style={{ fontSize: 1 }}>
          Status: {order.status}
        </span>
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 1.1, fontWeight: 700, marginBottom: 1 }}>Items</h2>
          <table className="table" style={{ marginBottom: 1.5 }}>
            <thead>
              <tr>
                <th>Product</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th style={{ textAlign: "center" }}>Qty</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product.name}</td>
                  <td style={{ textAlign: "right" }}>
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(item.price))}
                  </td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(item.price) * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontWeight: 700, textAlign: "right" }}>
            Total: {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(order.total))}
          </p>
        </div>
        <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 8, padding: 1.25 }}>
          <h2 style={{ fontSize: 1.1, fontWeight: 700, marginBottom: 1 }}>Payment (Telebirr)</h2>
          <p style={{ fontSize: 0.9, color: "#334155", marginBottom: 0.5 }}>
            Method: <strong>Telebirr Mobile Money</strong>
          </p>
          <p style={{ fontSize: 0.9, color: "#334155", marginBottom: 0.5 }}>
            Amount:{" "}
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(order.payment?.amount ?? order.total))}
          </p>
          <p style={{ fontSize: 0.9, color: "#334155", marginBottom: 1 }}>
            Reference:{" "}
            <strong>{order.payment?.reference ?? "—"}</strong>
          </p>
          <span className={`badge badge-${order.payment?.status?.toLowerCase() ?? "pending"}`}>
            Payment: {order.payment?.status ?? "PENDING"}
          </span>
          <p style={{ marginTop: 1, fontSize: 0.85, color: "#64748b" }}>
            To simulate payment completion, use the Telebirr callback with this order&apos;s
            reference.
          </p>
        </div>
      </div>

      <Link href="/orders" className="btn btn-outline">
        &larr; Back to orders
      </Link>
    </div>
  )
}

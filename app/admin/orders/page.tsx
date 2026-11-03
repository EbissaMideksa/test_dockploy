"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"

interface AdminOrder {
  id: string
  orderNumber: string
  user: string
  status: string
  paymentStatus: string | null
  shippingStatus: string
  shippingMethod: string
  shippingAddress: string | null
  total: number
  createdAt: string
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })
  const eventSourceRef = useRef<EventSource | null>(null)

  async function loadOrders() {
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" })
      if (res.ok) {
        setOrders(await res.json())
      }
    } catch {
      setMessage({ text: "Failed to load orders", type: "error" })
    }
  }

  useEffect(() => {
    ;(async () => {
      await loadOrders()
    })()

    const es = new EventSource("/api/events")
    eventSourceRef.current = es

    es.addEventListener("order_updated", (event) => {
      try {
        const data = JSON.parse(event.data)
        loadOrders()
      } catch {
        loadOrders()
      }
    })

    es.addEventListener("shipping_updated", (event) => {
      try {
        const data = JSON.parse(event.data)
        loadOrders()
      } catch {
        loadOrders()
      }
    })

    es.addEventListener("payment_completed", (event) => {
      try {
        const data = JSON.parse(event.data)
        loadOrders()
      } catch {
        loadOrders()
      }
    })

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [])

  async function updateOrder(orderId: string, field: "status" | "shippingStatus", value: string) {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    })
    if (res.ok) {
      setMessage({ text: "Order updated", type: "success" })
      loadOrders()
    } else {
      setMessage({ text: "Failed to update order", type: "error" })
    }
  }

  return (
    <div className="section" style={{ maxWidth: 1200 }}>
      <h1 style={{ fontSize: 1.75, fontWeight: 700, marginBottom: 1.5 }}>Manage Orders</h1>
      {message.text && <p className={message.type === "error" ? "error" : "success"}>{message.text}</p>}
      {orders.length === 0 ? (
        <p>No orders.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Order Status</th>
              <th>Shipping Status</th>
              <th>Shipping Method</th>
              <th>Shipping Address</th>
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
                  <select
                    defaultValue={o.status}
                    onChange={(e) => updateOrder(o.id, "status", e.target.value)}
                    className="input"
                    style={{ width: 130, padding: "0.3rem", fontSize: "0.85rem" }}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </td>
                <td>
                  <select
                    defaultValue={o.shippingStatus}
                    onChange={(e) => updateOrder(o.id, "shippingStatus", e.target.value)}
                    className="input"
                    style={{ width: 130, padding: "0.3rem", fontSize: "0.85rem" }}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </td>
                <td>{o.shippingMethod}</td>
                <td>{o.shippingAddress || "—"}</td>
                <td style={{ textAlign: "right" }}>
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(o.total)}
                </td>
                <td>{formatDateTime(o.createdAt)}</td>
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
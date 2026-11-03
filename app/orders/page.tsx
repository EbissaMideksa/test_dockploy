"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  payment: { status: string } | null
  items: Array<{ id: string; product: { name: string }; quantity: number; price: number }>
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const eventSourceRef = useRef<EventSource | null>(null)

  async function loadOrders() {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }

  useEffect(() => {
    ;(async () => {
      await loadOrders()
    })()

    const es = new EventSource("/api/events")
    eventSourceRef.current = es

    es.addEventListener("order_created", (event) => {
      try {
        const data = JSON.parse(event.data)
        loadOrders()
      } catch {
        loadOrders()
      }
    })

    es.addEventListener("order_updated", (event) => {
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

    es.addEventListener("shipping_updated", (event) => {
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

  if (loading) {
    return (
      <div className="section">
        <h1 style={{ fontSize: 1.75, fontWeight: 700, marginBottom: 1 }}>My Orders</h1>
        <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
          <div className="skeleton skeleton-text" style={{ width: "60%" }}></div>
          <div className="skeleton skeleton-text" style={{ width: "40%" }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="section">
      <h1 style={{ fontSize: 1.75, fontWeight: 700, marginBottom: 1 }}>My Orders</h1>
      {orders.length === 0 ? (
        <div className="empty-state fade-in">
          <h3>No orders yet.</h3>
          <p>Start shopping to see your orders here.</p>
          <Link href="/" className="btn btn-primary">Browse Products</Link>
        </div>
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
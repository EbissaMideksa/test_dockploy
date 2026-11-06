"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table } from "@/components/ui/table"
import { TableBody } from "@/components/ui/table"
import { TableCell } from "@/components/ui/table"
import { TableHead } from "@/components/ui/table"
import { TableHeader } from "@/components/ui/table"
import { TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

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

function badgeVariant(status: string) {
  switch (status.toLowerCase()) {
    case "pending": return "secondary"
    case "paid": return "default"
    case "shipped": return "default"
    case "delivered": return "default"
    case "cancelled": return "destructive"
    default: return "outline"
  }
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

    es.addEventListener("order_updated", () => { loadOrders() })
    es.addEventListener("shipping_updated", () => { loadOrders() })
    es.addEventListener("payment_completed", () => { loadOrders() })

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
    <div className="mx-auto max-w-[1100px] py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-foreground">Manage Orders</h1>
        <Button variant="outline" asChild>
          <Link href="/admin"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
        </Button>
      </div>
      {message.text && <p className={`mb-4 text-sm ${message.type === "error" ? "text-destructive" : "text-emerald-600"}`}>{message.text}</p>}
      {orders.length === 0 ? (
        <p>No orders.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Order Status</TableHead>
              <TableHead>Shipping Status</TableHead>
              <TableHead>Shipping Method</TableHead>
              <TableHead>Shipping Address</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>{o.orderNumber}</TableCell>
                <TableCell>{o.user}</TableCell>
                <TableCell>
                  <select
                    defaultValue={o.status}
                    onChange={(e) => updateOrder(o.id, "status", e.target.value)}
                    className="border border-input rounded-md p-1 text-xs w-[130px] focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </TableCell>
                <TableCell>
                  <select
                    defaultValue={o.shippingStatus}
                    onChange={(e) => updateOrder(o.id, "shippingStatus", e.target.value)}
                    className="border border-input rounded-md p-1 text-xs w-[130px] focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </TableCell>
                <TableCell>{o.shippingMethod}</TableCell>
                <TableCell>{o.shippingAddress || "—"}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(o.total)}
                </TableCell>
                <TableCell>{formatDateTime(o.createdAt)}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/orders/${o.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

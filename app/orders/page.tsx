"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEventSubscription } from "@/components/EventsProvider"
import { Button } from "@/components/ui/button"
import { Table } from "@/components/ui/table"
import { TableBody } from "@/components/ui/table"
import { TableCell } from "@/components/ui/table"
import { TableHead } from "@/components/ui/table"
import { TableHeader } from "@/components/ui/table"
import { TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  payment: { status: string } | null
  items: Array<{ id: string; product: { name: string }; quantity: number; price: number }>
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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

  useEventSubscription({
    order_created: () => {
      void loadOrders()
    },
    order_updated: () => {
      void loadOrders()
    },
    payment_completed: () => {
      void loadOrders()
    },
    shipping_updated: () => {
      void loadOrders()
    },
    auth_logout: () => {
      router.replace("/login")
      router.refresh()
    },
  })

  useEffect(() => {
    queueMicrotask(() => {
      void loadOrders()
    })
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">My Orders</h1>
        <div className="bg-secondary rounded-lg p-8 text-center">
          <div className="animate-pulse bg-muted rounded h-6 w-[60%] mx-auto mb-2"></div>
          <div className="animate-pulse bg-muted rounded h-6 w-[40%] mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No orders yet.</h3>
          <p className="text-muted-foreground">Start shopping to see your orders here.</p>
          <Button asChild>
            <Link href="/" className="block">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <Link href={`/orders/${o.id}`} className="font-medium text-foreground hover:text-primary">
                    {o.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={badgeVariant(o.status)}>{o.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={badgeVariant(o.payment?.status?.toLowerCase() ?? "pending")}>
                    {o.payment?.status ?? "—"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(o.total))}
                </TableCell>
                <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
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

"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { Table } from "@/components/ui/table"
import { TableBody } from "@/components/ui/table"
import { TableCell } from "@/components/ui/table"
import { TableHead } from "@/components/ui/table"
import { TableHeader } from "@/components/ui/table"
import { TableRow } from "@/components/ui/table"

interface Order {
  id: string
  orderNumber: string
  status: string
  shippingStatus: string
  shippingMethod: string
  shippingAddress: string | null
  total: number
  createdAt: string
  payment: {
    id: string
    status: string
    amount: number
    reference: string | null
    transactionNumber: string | null
    phoneNumber: string | null
  } | null
  items: Array<{
    id: string
    product: string
    quantity: number
    price: number
  }>
}

interface TelebirrDeepLink {
  url: string
  scheme: string
}

function buildTelebirrDeepLink(orderNumber: string, amount: number, phone?: string): TelebirrDeepLink {
  const params = new URLSearchParams({
    amount: amount.toString(),
    order_number: orderNumber,
    ...(phone ? { phone_number: phone } : {}),
  })
  return {
    scheme: `telebirr://pay?${params.toString()}`,
    url: `https://telebirr.com/pay?${params.toString()}`,
  }
}

function generateReference() {
  return `TB-${Date.now().toString(36)}`
}

function badgeVariant(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return "secondary"
    case "paid":
      return "default"
    case "shipped":
      return "default"
    case "delivered":
      return "default"
    case "cancelled":
      return "destructive"
    default:
      return "outline"
  }
}

export default function PaymentPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [payingOrder, setPayingOrder] = useState<string | null>(null)
  const [phone, setPhone] = useState("")
  const [transactionNumber, setTransactionNumber] = useState("")
  const [shippingAddress, setShippingAddress] = useState("")
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })

  async function loadOrders() {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch {
      setMessage({ text: "Failed to load orders", type: "error" })
    }
  }

  async function completePayment(orderNumber: string, phoneNumber: string, txnNumber: string) {
    setMessage({ text: "", type: "success" })
    const reference = generateReference()
    const res = await fetch("/api/payment/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber,
        reference,
        status: "completed",
        phoneNumber,
        transactionNumber: txnNumber,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessage({ text: `Payment completed for order ${orderNumber}. Transaction: ${txnNumber}`, type: "success" })
      setPayingOrder(null)
      setPhone("")
      setTransactionNumber("")
      loadOrders()
    } else {
      setMessage({ text: data.error || "Payment failed", type: "error" })
    }
  }

  useEffect(() => {
    let cancelled = false
    async function init() {
      await loadOrders()
      if (!cancelled) setLoading(false)
    }
    init()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-[900px] py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-pulse bg-secondary rounded h-24 w-24 mx-auto mb-4"></div>
            <div className="animate-pulse bg-secondary rounded h-4 w-[30%] mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pendingOrders = orders.filter((o) => o.status === "PENDING")
  const paidOrders = orders.filter((o) => o.status !== "PENDING" && o.shippingStatus !== "DELIVERED")
  const deliveredOrders = orders.filter((o) => o.shippingStatus === "DELIVERED")

  return (
    <div className="mx-auto max-w-[1000px] py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Payment &amp; Shipping</h1>
          <p className="text-muted-foreground">Manage your orders, payments, and deliveries.</p>
        </div>
      </div>

      {message.text && (
        <p className={`mb-4 text-sm ${message.type === "error" ? "text-destructive" : "text-emerald-600"}`}>{message.text}</p>
      )}

      <div className="grid grid-cols-[1fr_380px] gap-8">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Pending Orders</h2>
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium">No pending orders</h3>
              <p className="text-muted-foreground">All caught up — no payments waiting.</p>
            </div>
          ) : (
            pendingOrders.map((order) => {
              const deepLink = buildTelebirrDeepLink(order.orderNumber, order.total, phone)
              return (
                <Card key={order.id} className="mb-6">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{order.orderNumber}</h3>
                        <p className="text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={badgeVariant(order.status)}>{order.status}</Badge>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product}</TableCell>
                            <TableCell className="text-right">
                              {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(item.price)}
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(item.price * item.quantity)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-lg text-foreground">
                        Total: {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(order.total)}
                      </span>
                    </div>

                    <div className="mb-3">
                      <Label>Step 1: Open Telebirr App</Label>
                      <div className="flex gap-3 mb-3">
                        <a
                          href={deepLink.scheme}
                          className="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary/700 flex-1 text-center"
                          rel="noopener noreferrer"
                        >
                          Open Telebirr App
                        </a>
                        <a
                          href={deepLink.url}
                          className="border border-input text-muted-foreground px-4 py-2 rounded-md text-sm hover:bg-secondary flex-1 text-center"
                          rel="noopener noreferrer"
                        >
                          Open in Browser
                        </a>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Pay {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(order.total)} via Telebirr mobile money.
                      </p>

                      <Label>Step 2: Enter Payment Details</Label>
                      <div className="flex gap-3 mb-3">
                        <Input
                          name="phoneNumber"
                          type="tel"
                          required
                          placeholder="Telebirr phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          name="transactionNumber"
                          type="text"
                          required
                          placeholder="Transaction number"
                          value={transactionNumber}
                          onChange={(e) => setTransactionNumber(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <Button
                        onClick={() => completePayment(order.orderNumber, phone, transactionNumber)}
                        disabled={payingOrder === order.id || !phone || !transactionNumber}
                      >
                        {payingOrder === order.id ? "Processing…" : "Confirm Payment"}
                      </Button>
                      <p className={`mt-2 text-sm text-muted-foreground`}>
                        Enter your Telebirr phone number and the transaction number received after paying.
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>

        <div className="bg-card border border-input rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold text-foreground mb-4">Paid Orders - Shipping</h2>
          {paidOrders.length === 0 ? (
            <p className="text-muted-foreground">No paid orders awaiting shipping.</p>
          ) : (
            paidOrders.map((order) => (
              <Card key={order.id} className="mb-6">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{order.orderNumber}</h3>
                      <p className="text-muted-foreground">
                        Paid: {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(order.total)}
                      </p>
                    </div>
                    <Badge variant={badgeVariant(order.shippingStatus)}>{order.shippingStatus}</Badge>
                  </div>

                  {order.shippingStatus === "PENDING" && (
                    <div className="mb-3">
                      <Label>Shipping Address</Label>
                      <Input
                        name="shippingAddress"
                        type="text"
                        required
                        placeholder="e.g. Addis Ababa, Bole Sub-city, Kebele 01, House 123"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Provide your delivery address so we can ship your items.
                      </p>
                    </div>
                  )}

                  {order.shippingMethod === "REMOTE" && order.shippingStatus !== "DELIVERED" && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          if (!shippingAddress) {
                            setMessage({ text: "Please enter a shipping address", type: "error" })
                            return
                          }
                          setMessage({ text: "", type: "success" })
                        }}
                        disabled={!shippingAddress}
                      >
                        Mark as Shipped
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Shipping address required for remote delivery.
                      </p>
                    </div>
                  )}

                  {order.shippingStatus === "SHIPPED" && (
                    <p className="text-blue-700 font-semibold mb-0">
                      Your order has been shipped and is on the way.
                    </p>
                  )}
                  {order.shippingStatus === "DELIVERED" && (
                    <p className="text-green-700 font-semibold mb-0">
                      Your order has been delivered. Thank you!
                    </p>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {deliveredOrders.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Delivered Orders</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-3/10">Order #</TableHead>
                <TableHead className="w-1/5 text-right">Total</TableHead>
                <TableHead className="w-1/4">Payment</TableHead>
                <TableHead>Shipping</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveredOrders.map((o) => (
                <TableRow key={o.id} className="text-sm">
                  <TableCell className="font-medium">{o.orderNumber}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(o.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(o.payment?.status?.toLowerCase() ?? "pending")}>
                      {o.payment?.status ?? "&mdash;"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(o.shippingStatus)}>{o.shippingStatus}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

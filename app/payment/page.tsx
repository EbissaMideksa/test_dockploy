"use client"

import { useEffect, useState, useRef } from "react"

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

export default function PaymentPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [payingOrder, setPayingOrder] = useState<string | null>(null)
  const [phone, setPhone] = useState("")
  const [transactionNumber, setTransactionNumber] = useState("")
  const [shippingAddress, setShippingAddress] = useState("")
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })
  const eventSourceRef = useRef<EventSource | null>(null)

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

    const es = new EventSource("/api/events")
    eventSourceRef.current = es

    es.addEventListener("payment_completed", (event) => {
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

    es.addEventListener("shipping_updated", (event) => {
      try {
        const data = JSON.parse(event.data)
        loadOrders()
      } catch {
        loadOrders()
      }
    })

    return () => {
      cancelled = true
      es.close()
      eventSourceRef.current = null
    }
  }, [])

  if (loading) {
    return (
      <div className="section" style={{ maxWidth: 900 }}>
        <div className="card" style={{ padding: "3rem 1rem", textAlign: "center" }}>
          <div className="skeleton skeleton-image" style={{ margin: "0 auto" }}></div>
          <div className="skeleton skeleton-title" style={{ width: "30%" }}></div>
        </div>
      </div>
    )
  }

  const pendingOrders = orders.filter((o) => o.status === "PENDING")
  const paidOrders = orders.filter((o) => o.status !== "PENDING" && o.shippingStatus !== "DELIVERED")
  const deliveredOrders = orders.filter((o) => o.shippingStatus === "DELIVERED")

  return (
    <div className="section" style={{ maxWidth: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 1.5 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Payment &amp; Shipping</h1>
          <p className="muted" style={{ marginBottom: 0 }}>Manage your orders, payments, and deliveries.</p>
        </div>
      </div>

      {message.text && (
        <p className={message.type === "error" ? "error" : "success"}>{message.text}</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "2rem" }}>
        <div>
          <h2 style={{ fontSize: 1.1, fontWeight: 700, marginBottom: 1 }}>Pending Orders</h2>
          {pendingOrders.length === 0 ? (
            <div className="empty-state fade-in">
              <h3>No pending orders</h3>
              <p>All caught up — no payments waiting.</p>
            </div>
          ) : (
            pendingOrders.map((order) => {
              const deepLink = buildTelebirrDeepLink(order.orderNumber, order.total, phone)
              return (
                <div key={order.id} className="card slide-in" style={{ marginBottom: 1.5 }}>
                  <div style={{ padding: "1.25rem 1.25rem 1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 0.75 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 1.1, fontWeight: 700 }}>{order.orderNumber}</h3>
                        <p style={{ margin: 0.25, fontSize: "0.9rem", color: "#64748b" }}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="badge badge-pending">PENDING</span>
                    </div>
                    <table className="table" style={{ marginBottom: 1, fontSize: "0.9rem" }}>
                      <thead>
                        <tr>
                          <th style={{ width: "50%" }}>Product</th>
                          <th style={{ width: "20%", textAlign: "right" }}>Price</th>
                          <th style={{ width: "15%", textAlign: "center" }}>Qty</th>
                          <th style={{ width: "15%", textAlign: "right" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.product}</td>
                            <td style={{ textAlign: "right" }}>
                              {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(item.price)}
                            </td>
                            <td style={{ textAlign: "center" }}>{item.quantity}</td>
                            <td style={{ textAlign: "right" }}>
                              {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(item.price * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: 1.1, color: "#1e293b" }}>
                        Total: {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(order.total)}
                      </span>
                    </div>

                    <div style={{ marginBottom: 0.75 }}>
                      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 0.4 }}>
                        Step 1: Open Telebirr App
                      </label>
                      <div style={{ display: "flex", gap: 0.75, marginBottom: 0.75 }}>
                        <a
                          href={deepLink.scheme}
                          className="btn btn-primary"
                          style={{ flex: 1, padding: "0.6rem 1rem", textAlign: "center" }}
                          rel="noopener noreferrer"
                        >
                          Open Telebirr App
                        </a>
                        <a
                          href={deepLink.url}
                          className="btn btn-outline"
                          style={{ flex: 1, padding: "0.6rem 1rem", textAlign: "center" }}
                          rel="noopener noreferrer"
                        >
                          Open in Browser
                        </a>
                      </div>
                      <p className="muted" style={{ fontSize: "0.85rem", marginBottom: 0.75 }}>
                        Pay {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(order.total)} via
                        Telebirr mobile money.
                      </p>

                      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 0.4 }}>
                        Step 2: Enter Payment Details
                      </label>
                      <div style={{ display: "flex", gap: 0.75, marginBottom: 0.75 }}>
                        <input
                          name="phoneNumber"
                          type="tel"
                          required
                          className="input"
                          placeholder="Telebirr phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <input
                          name="transactionNumber"
                          type="text"
                          required
                          className="input"
                          placeholder="Transaction number"
                          value={transactionNumber}
                          onChange={(e) => setTransactionNumber(e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>
                      <button
                        onClick={() => completePayment(order.orderNumber, phone, transactionNumber)}
                        disabled={payingOrder === order.id || !phone || !transactionNumber}
                        className="btn btn-primary"
                        style={{ width: "100%" }}
                      >
                        {payingOrder === order.id ? "Processing…" : "Confirm Payment"}
                      </button>
                      <p className="muted" style={{ fontSize: "0.85rem", marginTop: 0.5 }}>
                        Enter your Telebirr phone number and the transaction number received after paying.
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="summary-card">
          <h2 style={{ fontSize: 1.1, fontWeight: 700, marginBottom: 1 }}>Paid Orders - Shipping</h2>
          {paidOrders.length === 0 ? (
            <p className="muted">No paid orders awaiting shipping.</p>
          ) : (
            paidOrders.map((order) => (
              <div key={order.id} className="card slide-in" style={{ marginBottom: 1.5 }}>
                <div style={{ padding: "1.25rem 1.25rem 1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 0.75 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 1.1, fontWeight: 700 }}>{order.orderNumber}</h3>
                      <p style={{ margin: 0.25, fontSize: "0.9rem", color: "#64748b" }}>
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(order.total)}
                      </p>
                    </div>
                    <span className={`badge badge-${order.shippingStatus.toLowerCase()}`}>
                      {order.shippingStatus}
                    </span>
                  </div>

                  {order.shippingStatus === "PENDING" && (
                    <div style={{ marginBottom: 0.75 }}>
                      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 0.4 }}>
                        Shipping Address
                      </label>
                      <input
                        name="shippingAddress"
                        type="text"
                        required
                        className="input"
                        placeholder="e.g. Addis Ababa, Bole Sub-city, Kebele 01, House 123"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                      />
                      <p className="muted" style={{ fontSize: "0.85rem", marginBottom: 0.75 }}>
                        Provide your delivery address so we can ship your items.
                      </p>
                    </div>
                  )}

                  {order.shippingMethod === "REMOTE" && order.shippingStatus !== "DELIVERED" && (
                    <div style={{ display: "flex", gap: 0.75 }}>
                      <button
                        onClick={() => {
                          if (!shippingAddress) {
                            setMessage({ text: "Please enter a shipping address", type: "error" })
                            return
                          }
                          setMessage({ text: "", type: "success" })
                        }}
                        className="btn btn-primary"
                        disabled={!shippingAddress}
                      >
                        Mark as Shipped
                      </button>
                      <p className="muted" style={{ fontSize: "0.85rem", marginTop: 0.5 }}>
                        Shipping address required for remote delivery.
                      </p>
                    </div>
                  )}

                  {order.shippingStatus === "SHIPPED" && (
                    <p style={{ fontSize: "0.9rem", color: "#1e3a8a", fontWeight: 600, marginBottom: 0 }}>
                      Your order has been shipped and is on the way.
                    </p>
                  )}
                  {order.shippingStatus === "DELIVERED" && (
                    <p style={{ fontSize: "0.9rem", color: "#15803d", fontWeight: 600, marginBottom: 0 }}>
                      Your order has been delivered. Thank you!
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {deliveredOrders.length > 0 && (
        <div style={{ marginTop: 2 }}>
          <h2 style={{ fontSize: 1.1, fontWeight: 700, marginBottom: 1 }}>Delivered Orders</h2>
          <table className="table" style={{ marginBottom: 1.5 }}>
            <thead>
              <tr>
                <th style={{ width: "30%" }}>Order #</th>
                <th style={{ width: "20%", textAlign: "right" }}>Total</th>
                <th style={{ width: "25%" }}>Payment</th>
                <th>Shipping</th>
              </tr>
            </thead>
            <tbody>
              {deliveredOrders.map((o) => (
                <tr key={o.id} style={{ fontSize: "0.9rem" }}>
                  <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                  <td style={{ textAlign: "right" }}>
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(o.total)}
                  </td>
                  <td>
                    <span className={`badge badge-${o.payment?.status?.toLowerCase() ?? "pending"}`}>
                      {o.payment?.status ?? "—"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${o.shippingStatus.toLowerCase()}`}>
                      {o.shippingStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

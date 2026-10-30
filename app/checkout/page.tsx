"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function CheckoutPage() {
  const [cart, setCart] = useState({ items: [] as Array<{ id: string; product: { name: string; price: number }; quantity: number }>, total: 0 })
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })

  useEffect(() => {
    fetch("/api/cart", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setCart(data)
        setLoading(false)
      })
  }, [])

  async function handleCheckout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: phone }),
    })
    if (res.ok) {
      const data = await res.json()
      setMessage({
        text: `Order ${data.order.orderNumber} created. Pay via Telebirr to complete.`,
        type: "success",
      })
      setTimeout(() => {
        window.location.href = `/orders/${data.order.id}`
      }, 1200)
    } else {
      const err = await res.json()
      setMessage({ text: err.error || "Checkout failed", type: "error" })
    }
  }

  if (loading) return <p>Loading cart...</p>
  if (cart.items.length === 0) {
    return (
      <div className="section">
        <p>Your cart is empty. <Link href="/">Browse products</Link>.</p>
      </div>
    )
  }

  return (
    <div className="section" style={{ maxWidth: 700 }}>
      <h1 style={{ fontSize: 1.75, fontWeight: 700, marginBottom: 1 }}>Checkout</h1>
      {message.text && (
        <p className={message.type === "error" ? "error" : "success"}>{message.text}</p>
      )}
      <form onSubmit={handleCheckout} className="card" style={{ marginBottom: 1.5 }}>
        <div className="label">Telebirr phone number</div>
        <input
          name="phoneNumber"
          type="tel"
          required
          className="input"
          placeholder="e.g. 0912345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <p className="muted" style={{ fontSize: 0.85, marginTop: 0.5 }}>
          You will pay through Telebirr mobile money. After checkout, simulate the
          payment callback to mark the order as paid.
        </p>
        <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.75rem" }}>
          Place Order &rarr;
        </button>
      </form>

      <h2 style={{ fontSize: 1.25, fontWeight: 700, marginBottom: 1 }}>Order Summary</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th style={{ textAlign: "right" }}>Price</th>
            <th style={{ textAlign: "center" }}>Qty</th>
            <th style={{ textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {cart.items.map((item) => (
            <tr key={item.id}>
              <td>{item.product.name}</td>
              <td style={{ textAlign: "right" }}>
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(item.product.price)}
              </td>
              <td style={{ textAlign: "center" }}>{item.quantity}</td>
              <td style={{ textAlign: "right" }}>
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(item.product.price * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 1, fontWeight: 700, textAlign: "right" }}>
        Total: {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(cart.total)}
      </p>
    </div>
  )
}

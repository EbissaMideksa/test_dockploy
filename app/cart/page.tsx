"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface CartItem {
  id: string
  product: { id: string; slug: string; name: string; price: number; imageUrl: string | null; stock: number }
  quantity: number
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })

  useEffect(() => {
    loadCart()
  }, [])

  async function loadCart() {
    const res = await fetch("/api/cart", { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      setItems(data.items || [])
      setTotal(data.total || 0)
    }
    setLoading(false)
  }

  async function updateItem(id: string, qty: number) {
    await fetch("/api/cart/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId: id, quantity: qty }),
    })
    loadCart()
  }

  async function removeItem(id: string) {
    await fetch("/api/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId: id }),
    })
    loadCart()
  }

  async function checkout() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    if (res.ok) {
      setMessage({ text: "Order created! Proceed to Telebirr payment.", type: "success" })
      setItems([])
      setTotal(0)
    } else {
      const err = await res.json()
      setMessage({ text: err.error || "Checkout failed", type: "error" })
    }
  }

  if (loading) return <p>Loading cart...</p>

  return (
    <div className="section" style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 1.75, fontWeight: 700, marginBottom: 1 }}>Shopping Cart</h1>
      {message.text && (
        <p className={message.type === "error" ? "error" : "success"}>{message.text}</p>
      )}
      {items.length === 0 ? (
        <p>Your cart is empty. <Link href="/">Browse products</Link>.</p>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th style={{ textAlign: "center" }}>Qty</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`/products/${item.product.slug}`}>{item.product.name}</Link>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(item.product.price)}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="number"
                      min="1"
                      max={item.product.stock}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, Math.max(1, Number(e.target.value) || 1))}
                      style={{ width: 60, padding: "0.4rem" }}
                    />
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(item.product.price * item.quantity)}
                  </td>
                  <td>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="btn btn-danger"
                      style={{ padding: "0.35rem 0.8rem", fontSize: 0.85 }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 1, marginTop: 1.5 }}>
            <Link href="/" className="btn btn-outline">Continue shopping</Link>
            <button
              onClick={checkout}
              className="btn btn-primary"
              style={{ padding: "0.7rem 1.7rem", fontSize: 1.05 }}
            >
              Checkout &rarr;
            </button>
          </div>
          <p style={{ marginTop: 1, fontWeight: 700, textAlign: "right" }}>
            Total: {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(total)}
          </p>
        </>
      )}
    </div>
  )
}

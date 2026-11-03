"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"

export default function CheckoutPage() {
  const [cart, setCart] = useState({ items: [] as Array<{ id: string; product: { name: string; price: number }; quantity: number }>, total: 0 })
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState("")
  const [shippingAddress, setShippingAddress] = useState("")
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })
  const autocompleteRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/cart", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setCart(data)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchSuggestions() {
      if (!shippingAddress || shippingAddress.length < 3) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      const controller = new AbortController()
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(shippingAddress)}&countrycodes=et&limit=5`, {
          signal: controller.signal,
          headers: { "Accept-Language": "en" },
        })
        const data = await res.json()
        if (!cancelled) {
          setSuggestions(data as Array<{ display_name: string; lat: string; lon: string }>)
          setShowSuggestions(data.length > 0)
        }
      } catch {
        if (!cancelled) {
          setSuggestions([])
          setShowSuggestions(false)
        }
      }
    }

    fetchSuggestions()

    return () => {
      cancelled = true
    }
  }, [shippingAddress])

  function selectSuggestion(address: string) {
    setShippingAddress(address)
    setSuggestions([])
    setShowSuggestions(false)
  }

  async function handleCheckout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!phone.trim()) {
      setMessage({ text: "Phone number is required", type: "error" })
      return
    }
    if (!shippingAddress.trim()) {
      setMessage({ text: "Shipping address is required", type: "error" })
      return
    }
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: phone, shippingAddress }),
    })
    if (res.ok) {
      const data = await res.json()
      setMessage({
        text: `Order ${data.order.orderNumber} created. Complete payment via Telebirr.`,
        type: "success",
      })
      setTimeout(() => {
        window.location.href = `/payment`
      }, 1200)
    } else {
      const err = await res.json()
      setMessage({ text: err.error || "Checkout failed", type: "error" })
    }
  }

  if (loading) {
    return (
      <div className="section" style={{ maxWidth: 700 }}>
        <div className="card" style={{ padding: "3rem 1rem", textAlign: "center" }}>
          <div className="skeleton skeleton-image"></div>
          <div className="skeleton skeleton-title" style={{ width: "40%" }}></div>
          <div className="skeleton skeleton-text" style={{ width: "60%" }}></div>
        </div>
      </div>
    )
  }
  if (cart.items.length === 0) {
    return (
      <div className="section" style={{ maxWidth: 700 }}>
        <div className="card" style={{ padding: "3rem 1rem", textAlign: "center" }}>
          <h3 className="empty-title" style={{ color: "#0f172a" }}>Your cart is empty</h3>
          <p className="muted" style={{ marginBottom: 1.5, color: "#64748b" }}>Looks like you have not added anything yet.</p>
          <Link href="/" className="btn btn-primary">Browse Products</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="section" style={{ maxWidth: 1000 }}>
      <div className="stepper fade-in">
        <div className="step active">
          <div className="step-circle">1</div>
          <div className="step-label" style={{ color: "#374151" }}>Checkout</div>
        </div>
        <div className="step-line"></div>
        <div className="step">
          <div className="step-circle">2</div>
          <div className="step-label" style={{ color: "#374151" }}>Payment</div>
        </div>
        <div className="step-line"></div>
        <div className="step">
          <div className="step-circle">3</div>
          <div className="step-label" style={{ color: "#374151" }}>Complete</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "2rem" }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 1, color: "#0f172a" }}>Checkout</h1>
          <p className="muted" style={{ marginBottom: 1.5, color: "#64748b" }}>Review your order and shipping details before payment.</p>

          {message.text && (
            <p className={message.type === "error" ? "error" : "success"}>{message.text}</p>
          )}

          <form onSubmit={handleCheckout} className="card fade-in">
            <div className="label" style={{ color: "#374151" }}>Telebirr Phone Number</div>
            <input
              name="phoneNumber"
              type="tel"
              required
              className="input"
              placeholder="e.g. 0912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="label" style={{ marginTop: 1, color: "#374151" }}>
              Shipping Address (Remote Delivery)
            </div>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                ref={autocompleteRef}
                name="shippingAddress"
                type="text"
                required
                className="input"
                placeholder="Start typing an address…"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="card" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 4, maxHeight: 240, overflowY: "auto" }}>
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => selectSuggestion(s.display_name)}
                      style={{
                        padding: "0.6rem 0.8rem",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        borderBottom: "1px solid #e2e8f0",
                        background: i % 2 === 0 ? "#ffffff" : "#f8fafc",
                        color: "#0f172a",
                      }}
                    >
                      {s.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="muted" style={{ fontSize: "0.85rem", marginTop: 0.5, color: "#64748b" }}>
              Start typing your address — suggestions from OpenStreetMap.
            </p>
            <p className="muted" style={{ fontSize: "0.85rem", marginTop: 0.5, color: "#64748b" }}>
              Pay via Telebirr mobile money. We ship to the address above.
            </p>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 0.5 }}>
              Place Order
            </button>
          </form>
        </div>

        <div className="summary-card slide-in">
          <h2 className="slide-in" style={{ fontSize: 1.1, fontWeight: 700, marginBottom: 1, color: "#0f172a" }}>Order Summary</h2>
          <table className="table" style={{ marginBottom: 1.5 }}>
            <thead>
              <tr>
                <th style={{ width: "50%", fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>Product</th>
                <th style={{ width: "20%", textAlign: "center", fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>Qty</th>
                <th style={{ width: "30%", textAlign: "right", fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={item.id} style={{ fontSize: "0.9rem" }}>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{item.product.name}</td>
                  <td style={{ textAlign: "center", color: "#0f172a" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right", color: "#0f172a" }}>
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(item.product.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="summary-total">
            <span style={{ color: "#0f172a" }}>Total</span>
            <span style={{ color: "#0f172a" }}>
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(cart.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useState } from "react"

interface AddToCartButtonProps {
  productId: string
  stock: number
  defaultQuantity?: number
}

export default function AddToCartButton({
  productId,
  stock,
  defaultQuantity = 1,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(defaultQuantity)
  const [message, setMessage] = useState({ text: "", type: "" as "success" | "error" })
  const [loading, setLoading] = useState(false)

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: "", type: "success" })
    const fd = new FormData()
    fd.append("productId", productId)
    fd.append("quantity", String(quantity))
    const res = await fetch("/api/cart/add", {
      method: "POST",
      body: fd,
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (res.ok) {
      setMessage({ text: "Added to cart", type: "success" })
      setTimeout(() => setMessage({ text: "", type: "success" }), 2000)
    } else {
      setMessage({ text: data.error || "Failed to add to cart", type: "error" })
    }
  }

  return (
    <form onSubmit={handleAdd} style={{ display: "flex", gap: 0.75, alignItems: "center", flexWrap: "wrap" }}>
      <input
        name="quantity"
        type="number"
        min="1"
        max={stock}
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, Math.min(stock, Number(e.target.value) || 1)))}
        style={{ width: 80, padding: "0.5rem", border: "1px solid #cbd5e1", borderRadius: 6 }}
      />
      <button
        type="submit"
        disabled={loading || stock === 0}
        className="btn btn-primary"
        style={{ padding: "0.6rem 1.4rem", fontSize: 0.9 }}
      >
        {stock === 0 ? "Out of stock" : loading ? "Adding…" : "Add to Cart"}
      </button>
      {message.text && (
        <span
          style={{
            marginLeft: 0.75,
            fontSize: 0.85,
            fontWeight: 600,
            color: message.type === "error" ? "#dc2626" : "#059669",
            whiteSpace: "nowrap",
          }}
        >
          {message.text}
        </span>
      )}
    </form>
  )
}

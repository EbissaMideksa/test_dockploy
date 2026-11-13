"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AddToCartButtonProps {
  productId: string
  variantId?: string
  stock: number
  defaultQuantity?: number
}

export default function AddToCartButton({
  productId,
  variantId,
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
    if (variantId) fd.append("variantId", variantId)
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
    } else if (res.status === 401) {
      window.location.href = "/login"
    } else {
      setMessage({ text: data.error || "Failed to add to cart", type: "error" })
    }
  }

  return (
    <form onSubmit={handleAdd} className="flex gap-3 items-center flex-wrap">
      <Input
        name="quantity"
        type="number"
        min="1"
        max={stock}
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, Math.min(stock, Number(e.target.value) || 1)))}
        className="w-20 p-1 text-center"
      />
      <Button
        type="submit"
        disabled={loading || stock === 0}
      >
        {stock === 0 ? "Sold Out" : loading ? "Adding…" : "Add to Cart"}
      </Button>
      {stock === 0 && (
        <span className="ml-3 text-xs font-semibold text-destructive whitespace-nowrap">
          Sold out — no more available
        </span>
      )}
      {message.text && (
        <span className={`ml-3 text-xs font-semibold whitespace-nowrap ${message.type === "error" ? "text-destructive" : "text-emerald-600"}`}>
          {message.text}
        </span>
      )}
    </form>
  )
}

"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Table } from "@/components/ui/table"
import { TableBody } from "@/components/ui/table"
import { TableCell } from "@/components/ui/table"
import { TableHead } from "@/components/ui/table"
import { TableHeader } from "@/components/ui/table"
import { TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

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
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    loadCart()

    const es = new EventSource("/api/events")
    eventSourceRef.current = es

    es.addEventListener("cart_updated", () => {
      loadCart()
    })

    es.addEventListener("order_created", (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.userId) {
          loadCart()
        }
      } catch {
        loadCart()
      }
    })

    return () => {
      es.close()
      eventSourceRef.current = null
    }
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

  if (loading) return <p className="text-center py-10">Loading cart...</p>

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Shopping Cart</h1>
      {message.text && (
        <p className={`mb-4 text-sm ${message.type === "error" ? "text-destructive" : "text-emerald-600"}`}>{message.text}</p>
      )}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">Your cart is empty</h3>
          <p className="text-muted-foreground">Looks like you have not added anything yet.</p>
          <Link href="/" className="Button mt-4 inline-block">
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-left">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link href={`/products/${item.product.slug}`}>{item.product.name}</Link>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(item.product.price)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      min="1"
                      max={item.product.stock}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, Math.max(1, Number(e.target.value) || 1))}
                      className="w-[60px] p-1 text-center"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(item.product.price * item.quantity)}
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => removeItem(item.id)}
                      variant="destructive"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end gap-3 mt-6">
            <Link href="/" className="Button variant-outline">Continue shopping</Link>
            <Button onClick={checkout} className="w-auto">
              Checkout &rarr;
            </Button>
          </div>
          <p className="mt-4 font-bold text-right">
            Total: {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(total)}
          </p>
        </>
      )}
    </div>
  )
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`border border-input rounded-md p-1 text-center focus-visible:ring-2 focus-visible:ring-ring ${className}`} />
}

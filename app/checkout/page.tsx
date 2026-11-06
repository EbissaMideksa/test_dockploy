"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { Table } from "@/components/ui/table"
import { TableBody } from "@/components/ui/table"
import { TableCell } from "@/components/ui/table"
import { TableHead } from "@/components/ui/table"
import { TableHeader } from "@/components/ui/table"
import { TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"

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
      <div className="mx-auto max-w-[700px] py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-pulse bg-secondary rounded h-24 w-24 mx-auto mb-4"></div>
            <div className="animate-pulse bg-secondary rounded h-4 w-[40%] mx-auto mb-2"></div>
            <div className="animate-pulse bg-secondary rounded h-6 w-[60%] mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    )
  }
  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-[700px] py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <CardTitle>Your cart is empty</CardTitle>
            <p className="text-muted-foreground">Looks like you have not added anything yet.</p>
            <Button asChild>
              <Link href="/" className="block">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1000px] py-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">1</div>
          <div className="text-sm font-medium text-primary">Checkout</div>
        </div>
        <div className="h-px w-8 bg-muted"></div>
        <div className="flex items-center gap-2 opacity-50">
          <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center">2</div>
          <div className="text-sm font-medium text-muted-foreground">Payment</div>
        </div>
        <div className="h-px w-8 bg-muted"></div>
        <div className="flex items-center gap-2 opacity-50">
          <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center">3</div>
          <div className="text-sm font-medium text-muted-foreground">Complete</div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-6">Checkout</h1>
          <p className="text-muted-foreground mb-6">Review your order and shipping details before payment.</p>

          {message.text && (
            <p className={`mb-4 text-sm ${message.type === "error" ? "text-destructive" : "text-emerald-600"}`}>{message.text}</p>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Shipping Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="space-y-2">
                  <Label>Telebirr Phone Number</Label>
                  <Input
                    name="phoneNumber"
                    type="tel"
                    required
                    placeholder="e.g. 0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shipping Address</Label>
                  <div className="relative w-full">
                    <Input
                      ref={autocompleteRef}
                      name="shippingAddress"
                      type="text"
                      required
                      placeholder="Start typing an address…"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      onFocus={() => setShowSuggestions(suggestions.length > 0)}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-background border border-input rounded-lg shadow-lg">
                        {suggestions.map((s, i) => (
                          <div
                            key={i}
                            onClick={() => selectSuggestion(s.display_name)}
                            className={`p-2 text-sm cursor-pointer border-b border-input last:border-0 ${i % 2 === 0 ? "bg-background" : "bg-muted/50"}`}
                          >
                            {s.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start typing your address — suggestions from OpenStreetMap.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pay via Telebirr mobile money. We ship to the address above.
                </p>
                <Button type="submit" className="w-full">Place Order</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableBody>
                {cart.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product.name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(item.product.price * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-between text-sm font-medium">
              <span>Total</span>
              <span>
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(cart.total)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PayButtonProps {
  orderNumber: string
}

export default function PayButton({ orderNumber }: PayButtonProps) {
  const [paying, setPaying] = useState(false)
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })

  async function completePayment() {
    setMessage({ text: "", type: "success" })
    setPaying(true)
    const res = await fetch("/api/payment/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber,
        reference: `TB-${Date.now().toString(36)}`,
        status: "completed",
        phoneNumber: phone || undefined,
        transactionNumber: `TB-${Date.now().toString(36)}`,
      }),
    })
    const data = await res.json()
    setPaying(false)
    if (res.ok) {
      setMessage({ text: `Payment completed for order ${orderNumber}.`, type: "success" })
      setTimeout(() => window.location.reload(), 800)
    } else {
      setMessage({ text: data.error || "Payment failed", type: "error" })
    }
  }

  return (
    <div className="mt-4">
      <Label>Telebirr phone number</Label>
      <Input
        type="tel"
        required
        placeholder="e.g. 0912345678"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Button onClick={completePayment} disabled={paying || !phone} className="w-full">
        {paying ? "Paying…" : "Pay via Telebirr"}
      </Button>
      {message.text && (
        <p className={`mt-3 text-sm ${message.type === "error" ? "text-destructive" : "text-emerald-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}

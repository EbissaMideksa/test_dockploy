"use client"

import { useState } from "react"

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
      }),
    })
    const data = await res.json()
    setPaying(false)
    if (res.ok) {
      setMessage({ text: "Payment completed successfully!", type: "success" })
      setTimeout(() => window.location.reload(), 800)
    } else {
      setMessage({ text: data.error || "Payment failed", type: "error" })
    }
  }

  return (
    <div style={{ marginTop: 1 }}>
      <label style={{ display: "block", fontSize: "0.85rem", color: "#334155", marginBottom: 0.4 }}>
        Telebirr phone number
      </label>
      <input
        type="tel"
        required
        className="input"
        placeholder="e.g. 0912345678"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={{ marginBottom: 0.5 }}
      />
      <button
        onClick={completePayment}
        disabled={paying || !phone}
        className="btn btn-primary"
        style={{ width: "100%", padding: "0.6rem" }}
      >
        {paying ? "Paying…" : "Pay via Telebirr"}
      </button>
      {message.text && (
        <p className={message.type === "error" ? "error" : "success"} style={{ marginTop: 0.75 }}>
          {message.text}
        </p>
      )}
    </div>
  )
}

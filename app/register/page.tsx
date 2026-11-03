"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    const password = fd.get("password")
    const confirm = fd.get("confirmPassword")
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    setError("")
    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: fd,
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      router.push("/")
    } else {
      setError(data.error || "Registration failed")
    }
  }

  return (
    <div className="section" style={{ maxWidth: 420 }}>
      <h1 style={{ fontSize: 1.5, fontWeight: 700, marginBottom: 1.5 }}>Register</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="card">
        <div className="label">Full name</div>
        <input name="name" type="text" className="input" placeholder="Your name" />
        <div className="label">Email</div>
        <input name="email" type="email" required className="input" placeholder="you@example.com" />
        <div className="label">Password</div>
        <input name="password" type="password" required className="input" placeholder="••••••••" />
        <div className="label">Confirm password</div>
        <input name="confirmPassword" type="password" required className="input" placeholder="••••••••" />
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", padding: "0.75rem" }}>
          {loading ? "Creating account..." : "Create account"}
        </button>
        <p style={{ marginTop: 1, fontSize: "0.9rem", color: "#64748b" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ fontWeight: 600 }}>Log in</Link>
        </p>
      </form>
    </div>
  )
}

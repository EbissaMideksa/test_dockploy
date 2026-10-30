"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    setLoading(true)
    setError("")
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: fd,
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      router.push("/")
    } else {
      setError(data.error || "Login failed")
    }
  }

  return (
    <div className="section" style={{ maxWidth: 420 }}>
      <h1 style={{ fontSize: 1.5, fontWeight: 700, marginBottom: 1.5 }}>Login</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="card">
        <div className="label">Email</div>
        <input name="email" type="email" required className="input" placeholder="you@example.com" />
        <div className="label">Password</div>
        <input name="password" type="password" required className="input" placeholder="••••••••" />
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", padding: "0.75rem" }}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p style={{ marginTop: 1, fontSize: 0.9, color: "#64748b" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ fontWeight: 600 }}>Register</Link>
        </p>
      </form>
    </div>
  )
}

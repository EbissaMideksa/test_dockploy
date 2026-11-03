"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"

interface NavbarProps {
  user: { id: string; email: string; role: string } | null
}

export default function Navbar({ user }: NavbarProps) {
  const [cartCount, setCartCount] = useState(0)
  const [sseConnected, setSseConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function fetchCartCount() {
    try {
      const res = await fetch("/api/cart/count", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setCartCount(data.count ?? 0)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    ;(async () => {
      await fetchCartCount()
    })()

    const es = new EventSource("/api/events")
    eventSourceRef.current = es

    es.onopen = () => {
      setSseConnected(true)
    }

    es.onerror = () => {
      setSseConnected(false)
      // Don't close - EventSource auto-reconnects
    }

    es.addEventListener("cart_updated", async () => {
      await fetchCartCount()
    })

    es.addEventListener("order_created", async () => {
      await fetchCartCount()
    })

    es.addEventListener("auth_login", () => {
      window.location.href = "/"
    })

    es.addEventListener("auth_logout", () => {
      window.location.href = "/login"
    })

    // Fallback: poll every 1 second if SSE is not connected
    pollRef.current = setInterval(async () => {
      if (!sseConnected) {
        await fetchCartCount()
      }
    }, 1000)

    return () => {
      es.close()
      eventSourceRef.current = null
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const authLinks = user ? (
    <>
      <form action="/api/auth/logout" method="POST" style={{ display: "inline" }}>
        <button type="submit" className="btn btn-outline btn-sm" style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}>
          Logout ({user.email})
        </button>
      </form>
      {user.role === "ADMIN" && (
        <Link href="/admin" className="btn btn-primary btn-sm" style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}>
          Admin
        </Link>
      )}
    </>
  ) : (
    <>
      <Link href="/login" className="btn btn-outline btn-sm" style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}>
        Login
      </Link>
      <Link href="/register" className="btn btn-primary btn-sm" style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}>
        Register
      </Link>
    </>
  )

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand">Dokploy Shop</Link>
      <ul className="navbar-links">
        <li><Link href="/">Home</Link></li>
        <li><Link href="/cart">Cart ({cartCount})</Link></li>
        <li><Link href="/orders">My Orders</Link></li>
        <li>{authLinks}</li>
        <li>
          <span
            style={{
              fontSize: "0.75rem",
              padding: "0.2rem 0.5rem",
              borderRadius: "4px",
              background: sseConnected ? "#d1fae5" : "#fef2f2",
              color: sseConnected ? "#065f46" : "#991b1b",
              marginLeft: "0.5rem",
            }}
          >
            {sseConnected ? "● Live" : "● Polling"}
          </span>
        </li>
      </ul>
    </nav>
  )
}

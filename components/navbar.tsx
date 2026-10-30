"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

interface NavbarProps {
  user: { id: string; email: string; role: string } | null
}

export default function Navbar({ user }: NavbarProps) {
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch("/api/cart/count", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCartCount(data.count ?? 0)
      })
      .catch(() => {})
    return () => {
      cancelled = true
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
      </ul>
    </nav>
  )
}

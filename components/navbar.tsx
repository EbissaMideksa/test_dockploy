"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useCallback, useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useEventSubscription } from "@/components/EventsProvider"
import NotificationBell from "@/components/NotificationBell"
import type { AuthUser } from "@/lib/auth-types"

interface NavbarProps {
  user: AuthUser | null
}

export default function Navbar({ user }: NavbarProps) {
  const [cartCount, setCartCount] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const loadCartCount = useCallback(async () => {
    try {
      const res = await fetch("/api/cart/count", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setCartCount(data.count ?? 0)
      } else {
        setCartCount(0)
      }
    } catch {
      setCartCount(0)
    }
  }, [])

  async function handleLogout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loggingOut) return
    setLoggingOut(true)
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" })
      if (!res.ok) throw new Error("logout failed")
      window.dispatchEvent(new Event("auth-changed"))
      router.push("/login")
      router.refresh()
    } catch {
      setLoggingOut(false)
      toast({ title: "Logout failed", variant: "destructive" })
    }
  }

  useEventSubscription({
    cart_updated: () => {
      void loadCartCount()
    },
    order_created: () => {
      void loadCartCount()
    },
    auth_logout: () => {
      window.dispatchEvent(new Event("auth-changed"))
      router.push("/login")
      router.refresh()
    },
  })

  useEffect(() => {
    if (!user) return
    queueMicrotask(() => {
      void loadCartCount()
    })
  }, [user, loadCartCount])

  const adminLink = user?.role === "ADMIN" ? (
    <Link href="/admin" className="bg-primary text-white px-3 py-1 text-sm rounded-md hover:bg-primary/700">
      Admin
    </Link>
  ) : null

  const visibleCartCount = user ? cartCount : 0

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap justify-between items-center gap-3">
        <Link href="/" className="text-xl font-bold text-foreground flex items-center gap-2">
          <span className="text-primary">D</span>okploy Shop
        </Link>
        <ul className="hidden md:flex gap-3 items-center">
          {user ? (
            <>
              <li><Link href="/" className="text-muted-foreground hover:text-primary hover:underline transition-colors">Home</Link></li>
              <li><Link href="/cart" className="text-muted-foreground hover:text-primary hover:underline transition-colors">Cart ({visibleCartCount})</Link></li>
              <li><Link href="/orders" className="text-muted-foreground hover:text-primary hover:underline transition-colors">My Orders</Link></li>
            </>
          ) : null}
          <li>
            {user ? (
              <>
                <span className="text-sm text-muted-foreground mr-3">
                  {user.name}
                </span>
                <div className="inline-flex items-center gap-2">
                  <NotificationBell userId={user.id} isAdmin={user.role === "ADMIN"} />
                  <form action="/api/auth/logout" method="POST" onSubmit={handleLogout} className="inline">
                    <Button variant="outline" size="sm" type="submit" disabled={loggingOut}>
                      {loggingOut ? "Logging out…" : "Logout"}
                    </Button>
                  </form>
                  {adminLink}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="border border-input text-muted-foreground px-3 py-1 text-sm rounded-md hover:bg-secondary"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-primary text-white px-3 py-1 text-sm rounded-md hover:bg-primary/700"
                >
                  Register
                </Link>
              </>
            )}
          </li>
        </ul>
      </div>
    </nav>
  )
}

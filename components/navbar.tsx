"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"

interface NavbarProps {
  user: { id: string; name: string; email: string; role: string } | null
}

export default function Navbar({ user }: NavbarProps) {
  const [cartCount, setCartCount] = useState(0)
  const [sseConnected, setSseConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  async function handleLogout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" })
      if (res.ok) {
        toast("Logged out successfully")
        window.dispatchEvent(new Event("auth-changed"))
        router.push("/login")
        router.refresh()
      } else {
        toast({ title: "Logout failed", variant: "destructive" })
      }
    } catch {
      toast({ title: "Logout failed", variant: "destructive" })
    }
  }

  useEffect(() => {
    if (!user) return

    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch("/api/cart/count", { cache: "no-store" })
        if (!cancelled && res.ok) {
          const data = await res.json()
          setCartCount(data.count ?? 0)
        }
      } catch {
        // ignore
      }
    }
    void load()

    const es = new EventSource("/api/events")
    eventSourceRef.current = es

    es.onopen = () => {
      if (!cancelled) setSseConnected(true)
    }

    es.onerror = () => {
      if (!cancelled) setSseConnected(false)
    }

    es.addEventListener("cart_updated", () => {
      void load()
    })

    es.addEventListener("order_created", () => {
      void load()
    })

    es.addEventListener("auth_logout", () => {
      window.dispatchEvent(new Event("auth-changed"))
      router.push("/login")
      router.refresh()
    })

    pollRef.current = setInterval(() => {
      if (es.readyState !== EventSource.OPEN) {
        void load()
      }
    }, 5000)

    return () => {
      cancelled = true
      es.close()
      if (eventSourceRef.current === es) eventSourceRef.current = null
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
      setSseConnected(false)
    }
  }, [user, router])

  const adminLink = user?.role === "ADMIN" ? (
    <Link href="/admin" className="bg-primary text-white px-3 py-1 text-sm rounded-md hover:bg-primary/700">
      Admin
    </Link>
  ) : null

  const liveStatus = sseConnected ? "● Live" : "● Polling"
  const liveClass = sseConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
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
                  <form action="/api/auth/logout" method="POST" onSubmit={handleLogout} className="inline">
                    <Button variant="outline" size="sm" type="submit">
                      Logout
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
          {user ? (
            <li>
              <span className={`text-xs px-2 py-0.5 rounded-md ml-2 ${liveClass}`}>
                {liveStatus}
              </span>
            </li>
          ) : null}
        </ul>
      </div>
    </nav>
  )
}

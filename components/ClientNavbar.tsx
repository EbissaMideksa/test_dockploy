"use client"

import Navbar from "@/components/navbar"
import { useCallback, useEffect, useState } from "react"

export default function ClientNavbar() {
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null)

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user ?? null)
      } else {
        setUser(null)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const onAuthChanged = () => {
      void refreshUser()
    }
    window.addEventListener("auth-changed", onAuthChanged)
    queueMicrotask(() => {
      void refreshUser()
    })
    return () => window.removeEventListener("auth-changed", onAuthChanged)
  }, [refreshUser])

  return <Navbar user={user} />
}

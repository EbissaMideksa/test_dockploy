"use client"

import Navbar from "@/components/navbar"
import { useCallback, useEffect, useState } from "react"
import type { AuthUser } from "@/lib/auth-types"

export function broadcastAuthChange(user: AuthUser | null) {
  window.dispatchEvent(new CustomEvent<AuthUser | null>("auth-changed", { detail: user }))
}

export default function ClientNavbar({ initialUser }: { initialUser: AuthUser | null }) {
  const [user, setUser] = useState<AuthUser | null>(initialUser)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" })
      const data = res.ok ? await res.json() : { user: null }
      setUser(data?.user ?? null)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const sync = (e: Event) => {
      const detail = (e as CustomEvent<AuthUser | null | undefined>).detail
      if (detail !== undefined) {
        setUser(detail)
        return
      }
      void refresh()
    }
    window.addEventListener("auth-changed", sync)
    return () => window.removeEventListener("auth-changed", sync)
  }, [refresh])

  return <Navbar user={user} />
}

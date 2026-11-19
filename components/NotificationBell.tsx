"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Bell, Check, Package, Truck, CreditCard, X } from "lucide-react"
import { useEventSubscription, type AppEventMessage } from "@/components/EventsProvider"

export interface Notification {
  id: string
  type: string
  title: string
  detail: string
  at: string
  read: boolean
}

const STORAGE_KEY = "dokploy.notifications.v1"
const MAX_ITEMS = 30

const NOTIFY_EVENTS = [
  "order_created",
  "order_updated",
  "shipping_updated",
  "payment_completed",
  "payment_failed",
  "product_updated",
  "stock_updated",
] as const

function iconFor(type: string) {
  switch (type) {
    case "shipping_updated":
      return Truck
    case "payment_completed":
    case "payment_failed":
      return CreditCard
    case "product_updated":
    case "stock_updated":
      return Package
    default:
      return Package
  }
}

function describe(
  type: string,
  data: unknown
): { title: string; detail: string } | null {
  const payload = (data ?? {}) as Record<string, unknown>
  const orderNumber = typeof payload.orderNumber === "string" ? payload.orderNumber : ""

  switch (type) {
    case "order_created":
      return { title: "Order placed", detail: orderNumber }
    case "order_updated":
      return {
        title: "Order status updated",
        detail: `${orderNumber} → ${String(payload.status ?? "")}`,
      }
    case "shipping_updated":
      return {
        title: "Shipping updated",
        detail: `${orderNumber} → ${String(payload.shippingStatus ?? "")}`,
      }
    case "payment_completed":
      return { title: "Payment received", detail: orderNumber }
    case "payment_failed":
      return { title: "Payment failed", detail: orderNumber }
    case "product_updated": {
      const action = String(payload.action ?? "updated")
      const name = typeof payload.name === "string" ? payload.name : ""
      if (action === "created") return { title: "New product", detail: name }
      if (action === "deleted") return { title: "Product removed", detail: name }
      return { title: "Product updated", detail: name }
    }
    case "stock_updated":
      return {
        title: "Stock updated",
        detail: typeof payload.name === "string" ? payload.name : "",
      }
    default:
      return null
  }
}

function loadStored(): Notification[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Notification[]) : []
  } catch {
    return []
  }
}

function save(items: Notification[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
  } catch {
    // ignore quota / privacy-mode failures
  }
}

function relativeTime(iso: string) {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function NotificationBell({
  userId,
  isAdmin,
}: {
  userId: string
  isAdmin: boolean
}) {
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hydrated = useRef(false)

  useEffect(() => {
    queueMicrotask(() => {
      setItems(loadStored())
      hydrated.current = true
    })
  }, [])

  useEffect(() => {
    if (!hydrated.current) return
    save(items)
  }, [items])

  const receive = useCallback(
    (type: string, event: AppEventMessage) => {
      const data = (event.data ?? {}) as Record<string, unknown>
      const owner = typeof data.userId === "string" ? data.userId : null
      if (owner && !isAdmin && owner !== userId) return

      const copy = describe(type, data)
      if (!copy) return

      const id = event.lastEventId || `${type}-${Date.now()}`
      const at = event.timestamp ?? new Date().toISOString()

      setItems((prev) => {
        if (prev.some((n) => n.id === id)) return prev
        return [{ id, type, title: copy.title, detail: copy.detail, at, read: false }, ...prev].slice(
          0,
          MAX_ITEMS
        )
      })
    },
    [userId, isAdmin]
  )

  useEventSubscription(
    NOTIFY_EVENTS.reduce<Record<string, (e: AppEventMessage) => void>>((acc, type) => {
      acc[type] = (e) => receive(type, e)
      return acc
    }, {})
  )

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const unread = items.filter((n) => !n.read).length

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setItems([])
  }, [])

  function toggle() {
    setOpen((v) => {
      const next = !v
      if (next) markAllRead()
      return next
    })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative inline-flex items-center justify-center h-9 w-9 rounded-md border border-input text-muted-foreground hover:bg-secondary transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[10px] font-semibold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <div className="flex items-center gap-1">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-secondary"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => {
                  const Icon = iconFor(n.type)
                  const href = n.detail.startsWith("ORD-") ? `/orders` : "/"
                  return (
                    <li key={n.id}>
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        className={`flex gap-3 px-3 py-2.5 hover:bg-secondary transition-colors ${
                          n.read ? "" : "bg-primary/5"
                        }`}
                      >
                        <span className="mt-0.5 text-muted-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-foreground truncate">
                            {n.title}
                          </span>
                          {n.detail && (
                            <span className="block text-xs text-muted-foreground truncate">
                              {n.detail}
                            </span>
                          )}
                          <span className="block text-[10px] text-muted-foreground mt-0.5">
                            {relativeTime(n.at)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="px-3 py-2 border-t border-border bg-muted/40">
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Check className="h-3 w-3" /> Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

export interface AppEventMessage {
  type: string
  data: unknown
  timestamp: string
  lastEventId: string
}

export type EventHandler = (event: AppEventMessage) => void

interface EventsContextValue {
  subscribe: (type: string, handler: EventHandler) => () => void
  connected: boolean
}

const EventsContext = createContext<EventsContextValue | null>(null)

const NAMED_EVENT_TYPES = [
  "order_created",
  "order_updated",
  "payment_completed",
  "payment_failed",
  "shipping_updated",
  "cart_updated",
  "product_updated",
  "stock_updated",
  "auth_login",
  "auth_logout",
] as const

/**
 * Opens a single EventSource for the whole app and fans events out to
 * subscribers. Components register handlers instead of opening their own
 * stream, so the browser only ever holds one long-lived connection per origin
 * (important behind HTTP/1.1 nginx, which caps connections per origin).
 */
export function EventsProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: ReactNode
}) {
  const [connected, setConnected] = useState(false)
  const handlersRef = useRef<Map<string, Set<EventHandler>>>(new Map())

  const subscribe = useCallback((type: string, handler: EventHandler) => {
    let set = handlersRef.current.get(type)
    if (!set) {
      set = new Set()
      handlersRef.current.set(type, set)
    }
    set.add(handler)

    return () => {
      const current = handlersRef.current.get(type)
      if (!current) return
      current.delete(handler)
      if (current.size === 0) handlersRef.current.delete(type)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const es = new EventSource("/api/events")

    const dispatch = (type: string, raw: unknown, lastEventId: string) => {
      let data: unknown = null
      if (typeof raw === "string" && raw.length > 0) {
        try {
          data = JSON.parse(raw)
        } catch {
          data = raw
        }
      }

      const set = handlersRef.current.get(type)
      if (!set || set.size === 0) return

      const message: AppEventMessage = {
        type,
        data,
        timestamp: new Date().toISOString(),
        lastEventId,
      }
      for (const handler of set) handler(message)
    }

    es.onopen = () => setConnected(true)
    es.onerror = () => setConnected(false)

    // Named events (cart_updated, order_created, …) don't fire onmessage,
    // so each name gets an explicit listener.
    const listeners = NAMED_EVENT_TYPES.map((type) => {
      const listener = (e: MessageEvent) => dispatch(type, e.data, e.lastEventId)
      es.addEventListener(type, listener)
      return { type, listener }
    })

    return () => {
      for (const { type, listener } of listeners) {
        es.removeEventListener(type, listener)
      }
      es.close()
    }
  }, [enabled])

  const value = useMemo<EventsContextValue>(
    () => ({ subscribe, connected: enabled && connected }),
    [subscribe, connected, enabled]
  )

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}

export function useEvents() {
  const ctx = useContext(EventsContext)
  if (!ctx) {
    throw new Error("useEvents must be used within an EventsProvider")
  }
  return ctx
}

/**
 * Subscribe to one or more SSE event types for the lifetime of the component.
 *
 * `handlers` maps event type -> callback. A new object identity each render is
 * fine: the latest handlers are read through a ref, so no resubscribe happens.
 */
export function useEventSubscription(handlers: Record<string, EventHandler>) {
  const { subscribe } = useEvents()
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    const unsubscribers = Object.keys(handlersRef.current).map((type) =>
      subscribe(type, (event) => {
        const handler = handlersRef.current[type]
        if (handler) handler(event)
      })
    )

    return () => {
      for (const unsubscribe of unsubscribers) unsubscribe()
    }
  }, [subscribe])
}
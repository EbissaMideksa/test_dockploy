export type EventType =
  | "order_created"
  | "order_updated"
  | "payment_completed"
  | "payment_failed"
  | "shipping_updated"
  | "cart_updated"
  | "product_updated"
  | "stock_updated"
  | "auth_login"
  | "auth_logout"

export interface AppEvent {
  type: EventType
  data: unknown
  timestamp: string
  orderId?: string
}

interface ClientConnection {
  write: (data: string) => void
  close: () => void
}

let eventIdCounter = 0
const clients: Set<ClientConnection> = new Set()

export function broadcastEvent(event: AppEvent) {
  const payload = `id: ${++eventIdCounter}\n` +
    `event: ${event.type}\n` +
    `data: ${JSON.stringify(event.data)}\n\n`

  for (const client of clients) {
    try {
      client.write(payload)
    } catch {
      clients.delete(client)
    }
  }
}

export function registerClient(write: (data: string) => void, close: () => void) {
  const client: ClientConnection = { write, close }
  clients.add(client)

  return () => {
    clients.delete(client)
    close()
  }
}

export function getClientCount() {
  return clients.size
}

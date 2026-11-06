import { NextResponse } from "next/server"
import { registerClient } from "@/lib/events"
import { getApiUser } from "@/lib/api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const user = await getApiUser()
  if (!user) {
    return new NextResponse("Unauthenticated", { status: 401 })
  }

  return new NextResponse(new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      let closed = false

      function send(data: string) {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(data))
        } catch {
          closed = true
        }
      }

      const unregister = registerClient(send, () => {
        closed = true
      })

      // Send heartbeat every 25 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        send(": heartbeat\n\n")
      }, 25000)

      return () => {
        closed = true
        clearInterval(heartbeat)
        unregister()
      }
    },
  }), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}

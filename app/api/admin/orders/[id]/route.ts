import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { readBody } from "@/lib/api"
import { broadcastEvent } from "@/lib/events"
import type { OrderStatus, ShippingStatus } from "@prisma/client"

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me"

async function requireAdmin() {
  try {
    const token = (await cookies()).get("token")?.value
    if (!token) return null
    const payload = jwt.verify(token, JWT_SECRET) as { role: string }
    return payload.role === "ADMIN" ? payload : null
  } catch {
    return null
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })
  }
  const { id } = await params
  const body = await readBody(_req)
  const { status, shippingStatus } = body

  const data: { status?: OrderStatus; shippingStatus?: ShippingStatus } = {}
  if (status) data.status = status as OrderStatus
  if (shippingStatus) data.shippingStatus = shippingStatus as ShippingStatus

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) {
    return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 })
  }

  await prisma.order.update({ where: { id }, data })

  if (status) {
    broadcastEvent({
      type: "order_updated",
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        status,
        previousStatus: order.status,
      },
      timestamp: new Date().toISOString(),
      orderId: order.id,
    })
  }

  if (shippingStatus) {
    broadcastEvent({
      type: "shipping_updated",
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        shippingStatus,
        previousShippingStatus: order.shippingStatus,
      },
      timestamp: new Date().toISOString(),
      orderId: order.id,
    })
  }

  return NextResponse.json({ success: true })
}

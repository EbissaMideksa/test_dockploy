import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

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

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })
  }
  const orders = await prisma.order.findMany({
    include: { user: true, items: { include: { product: true } }, payment: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(
    orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      user: o.user.email,
      status: o.status,
      total: Number(o.total),
      paymentStatus: o.payment?.status,
      createdAt: o.createdAt,
      items: o.items.map((i) => ({ product: i.product.name, quantity: i.quantity })),
    }))
  )
}

import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { readBody } from "@/lib/api"
import type { OrderStatus } from "@prisma/client"

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
  const { status } = await readBody(_req)
  await prisma.order.update({ where: { id }, data: { status: status as OrderStatus } })
  return NextResponse.json({ success: true })
}

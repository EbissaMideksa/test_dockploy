import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me"

async function requireAdmin() {
  try {
    const token = (await cookies()).get("token")?.value
    if (!token) return null
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; role: string }
    if (payload.role !== "ADMIN") return null
    return payload
  } catch {
    return null
  }
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })
  }
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(products)
}

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })
  }
  const fd = await req.formData()
  const name = String(fd.get("name") ?? "")
  const slug = String(fd.get("slug") ?? "")
  const price = String(fd.get("price") ?? "")
  const stock = String(fd.get("stock") ?? "")
  const imageUrl = String(fd.get("imageUrl") ?? "") || undefined
  const categoryId = String(fd.get("categoryId") ?? "") || undefined
  const description = String(fd.get("description") ?? "") || undefined
  const isActive = fd.get("isActive") === "on"
  const relatedIds = String(fd.get("relatedIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  await prisma.product.create({
    data: { name, slug, description, price, stock: parseInt(stock, 10), imageUrl, categoryId, isActive, relatedIds },
  })
  return new Response(JSON.stringify({ success: true }), { status: 201 })
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin()
  if (!admin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })
  }
  const fd = await req.formData()
  const id = String(fd.get("id") ?? "")
  await prisma.product.delete({ where: { id } })
  return new Response(JSON.stringify({ success: true }), { status: 200 })
}

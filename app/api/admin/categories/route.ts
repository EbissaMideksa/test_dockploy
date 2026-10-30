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
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(categories)
}

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })
  }
  const fd = await req.formData()
  const name = String(fd.get("name") ?? "")
  const slug = String(fd.get("slug") ?? "") || name.toLowerCase().replace(/\s+/g, "-")
  const imageUrl = String(fd.get("imageUrl") ?? "") || undefined
  await prisma.category.create({ data: { name, slug, imageUrl } })
  return new Response(JSON.stringify({ success: true }), { status: 201 })
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin()
  if (!admin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })
  }
  const fd = await req.formData()
  const id = String(fd.get("id") ?? "")
  await prisma.category.delete({ where: { id } })
  return new Response(JSON.stringify({ success: true }), { status: 200 })
}

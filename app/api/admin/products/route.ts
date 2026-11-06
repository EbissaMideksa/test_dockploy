import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { Prisma } from "@prisma/client"
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

function parseProduct(fd: FormData) {
  const name = String(fd.get("name") ?? "").trim()
  const slug = String(fd.get("slug") ?? "").trim()
  const price = String(fd.get("price") ?? "").trim()
  const stock = String(fd.get("stock") ?? "").trim()
  const imageUrl = String(fd.get("imageUrl") ?? "").trim() || undefined
  const rawCategoryId = String(fd.get("categoryId") ?? "").trim()
  const categoryId = rawCategoryId && rawCategoryId !== "none" ? rawCategoryId : undefined
  const description = String(fd.get("description") ?? "").trim() || undefined
  const isActive = fd.get("isActive") === "on" || fd.get("isActive") === "true"
  const relatedIds = String(fd.get("relatedIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  return { name, slug, description, price, stock: parseInt(stock, 10) || 0, imageUrl, categoryId, isActive, relatedIds }
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const fd = await req.formData()
    const id = String(fd.get("id") ?? "").trim()
    const data = parseProduct(fd)

    if (!data.name || !data.slug || !data.price) {
      return NextResponse.json({ error: "Name, slug, and price are required" }, { status: 400 })
    }

    if (id) {
      await prisma.product.update({ where: { id }, data })
      return NextResponse.json({ success: true })
    }

    await prisma.product.create({ data })
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json({ error: "A product with this slug already exists" }, { status: 409 })
      }
      if (e.code === "P2025") {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
    }
    return NextResponse.json({ error: "Failed to save product" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const fd = await req.formData()
    const id = String(fd.get("id") ?? "").trim()
    if (!id) return NextResponse.json({ error: "Product id is required" }, { status: 400 })
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}

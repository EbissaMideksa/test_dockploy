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

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const fd = await req.formData()
    const productId = String(fd.get("productId") ?? "")
    const color = String(fd.get("color") ?? "Default")
    const size = String(fd.get("size") ?? "Default")
    const imageUrl = String(fd.get("imageUrl") ?? "") || undefined
    const price = String(fd.get("price") ?? "")
    const stock = String(fd.get("stock") ?? "")

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 })
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        color,
        size,
        imageUrl,
        price: price ? parseFloat(price) : null,
        stock: parseInt(stock, 10) || 0,
      },
    })

    return NextResponse.json({ success: true, variant })
  } catch {
    return NextResponse.json({ error: "Failed to create variant" }, { status: 500 })
  }
}

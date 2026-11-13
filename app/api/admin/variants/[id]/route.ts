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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { id } = await params
    const fd = await req.formData()
    const color = String(fd.get("color") ?? "Default")
    const size = String(fd.get("size") ?? "Default")
    const imageUrl = String(fd.get("imageUrl") ?? "") || undefined
    const price = String(fd.get("price") ?? "")
    const stock = String(fd.get("stock") ?? "")

    const variant = await prisma.productVariant.update({
      where: { id },
      data: {
        color,
        size,
        imageUrl,
        price: price ? parseFloat(price) : null,
        stock: parseInt(stock, 10) || 0,
      },
    })

    return NextResponse.json({ success: true, variant })
  } catch {
    return NextResponse.json({ error: "Failed to update variant" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { id } = await params
    await prisma.productVariant.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete variant" }, { status: 500 })
  }
}

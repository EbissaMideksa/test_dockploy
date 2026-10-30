import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ count: 0 }, { status: 401 })
  }
  const cart = await prisma.cart.findUnique({ where: { userId: user.id } })
  if (!cart) {
    return NextResponse.json({ count: 0 })
  }
  const items = await prisma.cartItem.findMany({ where: { cartId: cart.id } })
  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  return NextResponse.json({ count })
}

import { getApiUser, readBody, apiError, apiJson } from "@/lib/api"
import { prisma } from "@/lib/prisma"
import { broadcastEvent } from "@/lib/events"

export async function POST(req: Request) {
  const user = await getApiUser()
  if (!user) {
    return apiError("Unauthenticated", 401)
  }

  const { productId, quantity } = await readBody(req)
  if (!productId) {
    return apiError("productId is required")
  }
  const qty = Math.max(1, Number(quantity) || 1)

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || !product.isActive) {
    return apiError("Product not found", 404)
  }
  if (product.stock < qty) {
    return apiError("Not enough stock", 400)
  }

  let cart = await prisma.cart.findUnique({ where: { userId: user.id } })
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: user.id } })
  }

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  })
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + qty },
    })
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity: qty },
    })
  }

  broadcastEvent({
    type: "cart_updated",
    data: {
      userId: user.id,
      productId,
      action: "added",
      quantity: qty,
    },
    timestamp: new Date().toISOString(),
  })

  return apiJson({ success: true })
}

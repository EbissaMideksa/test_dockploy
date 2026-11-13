import { getApiUser, readBody, apiError, apiJson } from "@/lib/api"
import { prisma } from "@/lib/prisma"
import { broadcastEvent } from "@/lib/events"

export async function POST(req: Request) {
  const user = await getApiUser()
  if (!user) {
    return apiError("Unauthenticated", 401)
  }

  const { productId, variantId, quantity } = await readBody(req)
  if (!productId) {
    return apiError("productId is required")
  }
  const qty = Math.max(1, Number(quantity) || 1)

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || !product.isActive) {
    return apiError("Product not found", 404)
  }

  let stock = product.stock
  if (variantId) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
    if (!variant || variant.productId !== productId) {
      return apiError("Variant not found", 404)
    }
    stock = variant.stock
  }
  if (stock < qty) {
    return apiError(`Only ${stock} item(s) left in stock`, 400)
  }

  let cart = await prisma.cart.findUnique({ where: { userId: user.id } })
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: user.id } })
  }

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId },
  })
  if (existing) {
    const newQty = existing.quantity + qty
    if (stock < newQty) {
      return apiError(`Only ${stock} item(s) left in stock`, 400)
    }
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty },
    })
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, variantId, quantity: qty },
    })
  }

  broadcastEvent({
    type: "cart_updated",
    data: {
      userId: user.id,
      productId,
      variantId,
      action: "added",
      quantity: qty,
    },
    timestamp: new Date().toISOString(),
  })

  return apiJson({ success: true })
}

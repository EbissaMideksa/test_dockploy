import { getApiUser, readBody, apiError, apiJson } from "@/lib/api"
import { prisma } from "@/lib/prisma"
import { broadcastEvent } from "@/lib/events"

export async function POST(req: Request) {
  const user = await getApiUser()
  if (!user) {
    return apiError("Unauthenticated", 401)
  }

  const { cartItemId } = await readBody(req)
  if (!cartItemId) {
    return apiError("cartItemId is required")
  }

  const cart = await prisma.cart.findUnique({ where: { userId: user.id } })
  if (!cart) {
    return apiError("Cart not found", 404)
  }

  const item = await prisma.cartItem.findUnique({ where: { id: cartItemId } })

  await prisma.cartItem.deleteMany({
    where: { id: cartItemId, cartId: cart.id },
  })

  broadcastEvent({
    type: "cart_updated",
    data: {
      userId: user.id,
      cartItemId,
      action: "removed",
      productId: item?.productId,
    },
    timestamp: new Date().toISOString(),
  })

  return apiJson({ success: true })
}

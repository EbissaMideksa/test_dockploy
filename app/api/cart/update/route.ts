import { getApiUser, readBody, apiError, apiJson } from "@/lib/api"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const user = await getApiUser()
  if (!user) {
    return apiError("Unauthenticated", 401)
  }

  const { cartItemId, quantity } = await readBody(req)
  if (!cartItemId) {
    return apiError("cartItemId is required")
  }
  const qty = Math.max(1, Number(quantity) || 1)

  const cart = await prisma.cart.findUnique({ where: { userId: user.id } })
  if (!cart) {
    return apiError("Cart not found", 404)
  }

  const item = await prisma.cartItem.findUnique({ where: { id: cartItemId } })
  if (!item || item.cartId !== cart.id) {
    return apiError("Item not found", 404)
  }

  const product = await prisma.product.findUnique({ where: { id: item.productId } })
  if (product && product.stock < qty) {
    return apiError("Not enough stock", 400)
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity: qty },
  })

  return apiJson({ success: true })
}

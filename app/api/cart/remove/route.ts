import { getApiUser, readBody, apiError, apiJson } from "@/lib/api"
import { prisma } from "@/lib/prisma"

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

  await prisma.cartItem.deleteMany({
    where: { id: cartItemId, cartId: cart.id },
  })

  return apiJson({ success: true })
}

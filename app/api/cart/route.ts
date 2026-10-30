import { getApiUser, apiError, apiJson } from "@/lib/api"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const user = await getApiUser()
  if (!user) {
    return apiError("Unauthenticated", 401)
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: true } } },
  })
  if (!cart) {
    return apiJson({ items: [], total: 0 })
  }

  const total = cart.items.reduce(
    (sum, i) => sum + Number(i.product.price) * i.quantity,
    0
  )

  return apiJson({
    items: cart.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      product: {
        id: i.product.id,
        slug: i.product.slug,
        name: i.product.name,
        price: Number(i.product.price),
        imageUrl: i.product.imageUrl,
        stock: i.product.stock,
      },
      quantity: i.quantity,
    })),
    total,
  })
}

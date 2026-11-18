import { getApiUser, apiError, apiJson } from "@/lib/api"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const user = await getApiUser()
  if (!user) {
    return apiError("Unauthenticated", 401)
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  })
  if (!cart) {
    return apiJson({ items: [], total: 0 })
  }

  const items = cart.items.map((i) => {
    const unitPrice = i.variant?.price ?? i.product.price
    const stock = i.variant?.stock ?? i.product.stock
    const label = i.variant
      ? `${i.product.name} (${i.variant.color}/${i.variant.size})`
      : i.product.name

    return {
      id: i.id,
      productId: i.productId,
      variantId: i.variantId,
      label,
      product: {
        id: i.product.id,
        slug: i.product.slug,
        name: i.product.name,
        price: Number(unitPrice),
        imageUrl: i.variant?.imageUrl ?? i.product.imageUrl,
        stock,
      },
      quantity: i.quantity,
    }
  })

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  return apiJson({ items, total })
}
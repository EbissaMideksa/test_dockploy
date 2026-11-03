//app/api/orders/%5Bid%5D/route.ts
import { getApiUser, apiError, apiJson } from "@/lib/api"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser()
  if (!user) {
    return apiError("Unauthenticated", 401)
  }

  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, payment: true },
  })
  if (!order) {
    return apiError("Order not found", 404)
  }
  if (order.userId !== user.id) {
    return apiError("Forbidden", 403)
  }

  return apiJson({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: Number(order.total),
    createdAt: order.createdAt,
    payment: order.payment,
    items: order.items.map((i) => ({
      id: i.id,
      product: i.product.name,
      quantity: i.quantity,
      price: Number(i.price),
      imageUrl: i.product.imageUrl,
    })),
  })
}

//app/api/orders/route.ts
import { getApiUser, apiError, apiJson } from "@/lib/api"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const user = await getApiUser()
  if (!user) {
    return apiError("Unauthenticated", 401)
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: { include: { product: true } }, payment: true },
    orderBy: { createdAt: "desc" },
  })

  return apiJson({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      shippingStatus: o.shippingStatus,
      shippingMethod: o.shippingMethod,
      shippingAddress: o.shippingAddress,
      total: Number(o.total),
      createdAt: o.createdAt,
      payment: o.payment,
      items: o.items.map((i) => ({
        product: i.product.name,
        quantity: i.quantity,
        price: Number(i.price),
      })),
    })),
  })
}

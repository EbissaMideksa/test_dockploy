import { getApiUser, readBody, apiError, apiJson } from "@/lib/api"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const user = await getApiUser()
  if (!user) {
    return apiError("Unauthenticated", 401)
  }

  const { phoneNumber } = await readBody(req)
  const phone = phoneNumber || null

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: true } } },
  })
  if (!cart || cart.items.length === 0) {
    return apiError("Cart is empty", 400)
  }

  let total = 0
  for (const item of cart.items) {
    if (!item.product.isActive || item.product.stock < item.quantity) {
      return apiError(`Product "${item.product.name}" is unavailable or low on stock`, 400)
    }
    total += Number(item.product.price) * item.quantity
  }

  const orderNumber =
    "ORD-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase()

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: user.id,
      total,
      status: "PENDING",
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        })),
      },
      payment: {
        create: {
          method: "TELEBIRR",
          amount: total,
          status: "PENDING",
          phoneNumber: phone,
          reference: "TB-" + Date.now().toString(36),
        },
      },
    },
    include: { items: { include: { product: true } }, payment: true },
  })

  for (const item of cart.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    })
  }

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })

  return apiJson({ success: true, order }, 201)
}

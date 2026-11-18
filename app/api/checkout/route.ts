import { getApiUser, readBody, apiError, apiJson } from "@/lib/api"
import { prisma } from "@/lib/prisma"
import { broadcastEvent } from "@/lib/events"
import { decrementStockForItem } from "@/lib/stock"

export async function POST(req: Request) {
  const user = await getApiUser()
  if (!user) {
    return apiError("Unauthenticated", 401)
  }

  const { phoneNumber, shippingAddress } = await readBody(req)
  const phone = phoneNumber || null
  const shipping = shippingAddress || null

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
  if (!cart || cart.items.length === 0) {
    return apiError("Cart is empty", 400)
  }

  let total = 0
  for (const item of cart.items) {
    if (!item.product.isActive) {
      return apiError(`Product "${item.product.name}" is unavailable`, 400)
    }

    const unitPrice = item.variant?.price ?? item.product.price
    total += Number(unitPrice) * item.quantity

    if (item.variant) {
      if (item.variant.stock < item.quantity) {
        return apiError(
          `Only ${item.variant.stock} item(s) of "${item.product.name}" (${item.variant.color}/${item.variant.size}) left in stock`,
          400
        )
      }
    } else if (item.product.stock < item.quantity) {
      return apiError(`Only ${item.product.stock} item(s) of "${item.product.name}" left in stock`, 400)
    }
  }

  const orderNumber =
    "ORD-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase()

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: user.id,
      total,
      status: "PENDING",
      shippingAddress: shipping,
      shippingMethod: shipping ? "REMOTE" : "PICKUP",
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.variant?.price ?? item.product.price,
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
    include: { items: true, payment: true },
  })

  for (const item of cart.items) {
    await decrementStockForItem({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    })
  }

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })

  broadcastEvent({
    type: "order_created",
    data: {
      orderNumber: order.orderNumber,
      orderId: order.id,
      userId: order.userId,
      total: Number(order.total),
      status: order.status,
    },
    timestamp: new Date().toISOString(),
    orderId: order.id,
  })

  return apiJson({ success: true, order }, 201)
}
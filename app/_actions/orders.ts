"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function checkout(formData: FormData) {
  const user = await requireAuth()
  const phoneNumber = String(formData.get("phoneNumber") ?? "")

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: true } } },
  })
  if (!cart || cart.items.length === 0) {
    return { error: "Cart is empty" }
  }

  let total = 0
  for (const item of cart.items) {
    if (!item.product.isActive || item.product.stock < item.quantity) {
      return { error: `Product "${item.product.name}" is unavailable or low on stock` }
    }
    total += Number(item.product.price) * item.quantity
  }

  const orderNumber = "ORD-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase()

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: user.id,
      total: total,
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
          phoneNumber: phoneNumber || null,
          reference: "TB-" + Date.now().toString(36),
        },
      },
    },
    include: { items: true, payment: true },
  })

  for (const item of cart.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    })
  }

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })

  revalidatePath("/orders")
  revalidatePath("/cart")
  return { success: true, order }
}

export async function getOrders() {
  const user = await requireAuth()
  return prisma.order.findMany({
    where: { userId: user.id },
    include: { items: { include: { product: true } }, payment: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function getOrderById(orderId: string) {
  await requireAuth()
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } }, payment: true },
  })
}

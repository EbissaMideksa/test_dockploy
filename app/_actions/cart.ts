"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({ where: { userId } })
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } })
  }
  return cart
}

export async function addToCart(formData: FormData) {
  const user = await requireAuth()
  const productId = String(formData.get("productId"))
  const quantity = Math.max(1, Number(formData.get("quantity")) || 1)

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || !product.isActive) {
    return { error: "Product not found" }
  }
  if (product.stock < quantity) {
    return { error: "Not enough stock" }
  }

  const cart = await getOrCreateCart(user.id)

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  })
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    })
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    })
  }

  revalidatePath("/cart")
  return { success: true }
}

export async function removeFromCart(formData: FormData) {
  const user = await requireAuth()
  const cartItemId = String(formData.get("cartItemId"))

  const cart = await prisma.cart.findUnique({ where: { userId: user.id } })
  if (!cart) return { error: "Cart not found" }

  await prisma.cartItem.deleteMany({
    where: { id: cartItemId, cartId: cart.id },
  })

  revalidatePath("/cart")
  return { success: true }
}

export async function updateCartItem(formData: FormData) {
  const user = await requireAuth()
  const cartItemId = String(formData.get("cartItemId"))
  const quantity = Math.max(1, Number(formData.get("quantity")) || 1)

  const cart = await prisma.cart.findUnique({ where: { userId: user.id } })
  if (!cart) return { error: "Cart not found" }

  const item = await prisma.cartItem.findUnique({ where: { id: cartItemId } })
  if (!item || item.cartId !== cart.id) {
    return { error: "Item not found" }
  }

  const product = await prisma.product.findUnique({ where: { id: item.productId } })
  if (product && product.stock < quantity) {
    return { error: "Not enough stock" }
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  })

  revalidatePath("/cart")
  return { success: true }
}

export async function clearCart() {
  const user = await requireAuth()
  const cart = await prisma.cart.findUnique({ where: { userId: user.id } })
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
  }
  revalidatePath("/cart")
  return { success: true }
}

export async function getCartItemCount() {
  const user = await requireAuth()
  const cart = await prisma.cart.findUnique({ where: { userId: user.id } })
  if (!cart) return 0
  const items = await prisma.cartItem.findMany({ where: { cartId: cart.id } })
  return items.reduce((sum, i) => sum + i.quantity, 0)
}

export async function getCart() {
  const user = await requireAuth()
  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: true } } },
  })
  return cart
}

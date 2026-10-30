"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { OrderStatus } from "@prisma/client"

export async function createProduct(formData: FormData) {
  await requireAdmin()

  const name = String(formData.get("name") ?? "")
  const slug = String(formData.get("slug") ?? "")
  const description = String(formData.get("description") ?? "") || undefined
  const price = String(formData.get("price") ?? "")
  const stock = String(formData.get("stock") ?? "")
  const imageUrl = String(formData.get("imageUrl") ?? "") || undefined
  const categoryId = String(formData.get("categoryId") ?? "") || undefined
  const isActive = formData.get("isActive") === "on"
  const relatedIds = String(formData.get("relatedIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  if (!name || !slug || !price || !stock) {
    return { error: "Name, slug, price and stock are required" }
  }

  await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price,
      stock: parseInt(stock, 10),
      imageUrl,
      categoryId,
      isActive,
      relatedIds,
    },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/products")
}

export async function updateProduct(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")

  const name = String(formData.get("name") ?? "")
  const slug = String(formData.get("slug") ?? "")
  const description = String(formData.get("description") ?? "") || undefined
  const price = String(formData.get("price") ?? "")
  const stock = String(formData.get("stock") ?? "")
  const imageUrl = String(formData.get("imageUrl") ?? "") || undefined
  const categoryId = String(formData.get("categoryId") ?? "") || undefined
  const isActive = formData.get("isActive") === "on"
  const relatedIds = String(formData.get("relatedIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      price,
      stock: parseInt(stock, 10),
      imageUrl,
      categoryId,
      isActive,
      relatedIds,
    },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/products")
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  await prisma.product.delete({ where: { id } })
  revalidatePath("/admin")
  revalidatePath("/admin/products")
}

export async function createCategory(formData: FormData) {
  await requireAdmin()
  const name = String(formData.get("name") ?? "")
  const slug =
    String(formData.get("slug") ?? "") ||
    name.toLowerCase().replace(/\s+/g, "-")
  const imageUrl = String(formData.get("imageUrl") ?? "") || undefined

  if (!name || !slug) {
    return { error: "Name and slug are required" }
  }

  await prisma.category.create({ data: { name, slug, imageUrl } })
  revalidatePath("/admin")
  return { success: true }
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  await prisma.category.delete({ where: { id } })
  revalidatePath("/admin")
  return { success: true }
}

export async function getAdminProducts() {
  await requireAdmin()
  return prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function getAdminCategories() {
  await requireAdmin()
  return prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })
}

export async function getAdminOrders() {
  await requireAdmin()
  return prisma.order.findMany({
    include: { user: true, items: { include: { product: true } }, payment: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "")
  await prisma.order.update({ where: { id }, data: { status: status as OrderStatus } })
  revalidatePath("/admin/orders")
  return { success: true }
}

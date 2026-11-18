import { prisma } from "./prisma"

export async function sumVariantStock(productId: string) {
  const agg = await prisma.productVariant.aggregate({
    where: { productId },
    _sum: { stock: true },
  })
  return agg._sum.stock ?? 0
}

export async function syncProductStock(productId: string) {
  const stock = await sumVariantStock(productId)
  await prisma.product.update({ where: { id: productId }, data: { stock } })
  return stock
}

export async function decrementStockForItem(item: {
  productId: string
  variantId: string | null
  quantity: number
}) {
  if (item.variantId) {
    await prisma.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { decrement: item.quantity } },
    })
  }

  const variantCount = await prisma.productVariant.count({ where: { productId: item.productId } })

  if (variantCount === 0) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    })
    return
  }

  await syncProductStock(item.productId)
}
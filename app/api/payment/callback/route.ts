import { apiError, apiJson } from "@/lib/api"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { orderNumber, reference, status, phoneNumber } = await req
    .json()
    .catch(() => ({}))
  if (!orderNumber || !reference) {
    return apiError("orderNumber and reference are required", 400)
  }

  const order = await prisma.order.findUnique({ where: { orderNumber } })
  if (!order) {
    return apiError("Order not found", 404)
  }

  const payment = await prisma.payment.findUnique({ where: { orderId: order.id } })
  if (!payment) {
    return apiError("Payment record not found", 404)
  }

  const completed = status === "completed" || status === "success"

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: completed ? "COMPLETED" : "FAILED",
      reference,
      phoneNumber: phoneNumber || payment.phoneNumber,
    },
  })

  if (completed) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
    })
  }

  return apiJson({ success: true, orderId: order.id, paymentStatus: completed ? "COMPLETED" : "FAILED" })
}

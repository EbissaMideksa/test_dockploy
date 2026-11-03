//app/api/payment/callback/route.ts
import { apiError, apiJson } from "@/lib/api"
import { prisma } from "@/lib/prisma"
import { broadcastEvent } from "@/lib/events"

export async function POST(req: Request) {
  const { orderNumber, reference, status, phoneNumber, transactionNumber } = await req
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
      transactionNumber: transactionNumber || payment.transactionNumber,
      phoneNumber: phoneNumber || payment.phoneNumber,
    },
  })

  if (completed) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
    })

    broadcastEvent({
      type: "payment_completed",
      data: {
        orderNumber: order.orderNumber,
        orderId: order.id,
        userId: order.userId,
        paymentStatus: "COMPLETED",
        transactionNumber: transactionNumber || payment.transactionNumber,
        amount: Number(payment.amount),
      },
      timestamp: new Date().toISOString(),
      orderId: order.id,
    })
  } else {
    broadcastEvent({
      type: "payment_failed",
      data: {
        orderNumber: order.orderNumber,
        orderId: order.id,
        userId: order.userId,
        paymentStatus: "FAILED",
      },
      timestamp: new Date().toISOString(),
      orderId: order.id,
    })
  }

  return apiJson({
    success: true,
    orderId: order.id,
    paymentStatus: completed ? "COMPLETED" : "FAILED",
    transactionNumber: payment.transactionNumber || transactionNumber,
  })
}

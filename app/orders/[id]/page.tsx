import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import PayButton from "@/components/PayButton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table } from "@/components/ui/table"
import { TableBody } from "@/components/ui/table"
import { TableCell } from "@/components/ui/table"
import { TableHead } from "@/components/ui/table"
import { TableHeader } from "@/components/ui/table"
import { TableRow } from "@/components/ui/table"

export const dynamic = "force-dynamic"

function badgeVariant(status: string) {
  switch (status.toLowerCase()) {
    case "pending": return "secondary"
    case "paid": return "default"
    case "shipped": return "default"
    case "delivered": return "default"
    case "cancelled": return "destructive"
    default: return "outline"
  }
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, payment: true },
  })
  if (!order) {
    notFound()
  }
  if (user.role !== "ADMIN" && order.userId !== user.id) {
    notFound()
  }

  const isPending = order.status === "PENDING"

  function formatDateTime(dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className="mx-auto max-w-[700px] py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Order {order.orderNumber}</h1>
        <Badge variant={badgeVariant(order.status)} className="text-base">
          Status: {order.status}
        </Badge>
      </div>

      <div className="flex gap-8 mb-8">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground mb-4">Items</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(item.price))}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(item.price) * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="font-bold text-right mt-4">
            Total: {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(order.total))}
          </p>
        </div>
        <div className="flex-1 bg-muted rounded-lg p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">Payment (Telebirr)</h2>
          <p className="text-sm text-muted-foreground mb-2">
            Method: <strong className="text-foreground">Telebirr Mobile Money</strong>
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            Amount:{" "}
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(order.payment?.amount ?? order.total))}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Reference: <strong className="text-foreground">{order.payment?.reference ?? "—"}</strong>
          </p>
          <Badge variant={badgeVariant(order.payment?.status?.toLowerCase() ?? "pending")}>
            Payment: {order.payment?.status ?? "PENDING"}
          </Badge>
          <p className="mt-4 text-sm text-muted-foreground">
            To simulate payment completion, use the Telebirr callback with this order&apos;s reference.
          </p>
          {isPending && <PayButton orderNumber={order.orderNumber} />}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Order Details</h2>
        <p className="text-sm text-muted-foreground">
          Order Number: <strong className="text-foreground">{order.orderNumber}</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          Order Date: <strong className="text-foreground">{formatDateTime(order.createdAt.toISOString())}</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          Status: <Badge variant={badgeVariant(order.status)}>{order.status}</Badge>
        </p>
        <p className="text-sm text-muted-foreground">
          Shipping: <Badge variant={badgeVariant(order.shippingStatus)}>{order.shippingStatus}</Badge>
        </p>
        {order.shippingAddress && (
          <p className="text-sm text-muted-foreground">
            Shipping Address: {order.shippingAddress}
          </p>
        )}
        {order.shippingMethod && (
          <p className="text-sm text-muted-foreground">
            Shipping Method: {order.shippingMethod}
          </p>
        )}
      </div>

      <Button variant="outline" asChild>
        <Link href="/orders">&larr; Back to orders</Link>
      </Button>
    </div>
  )
}

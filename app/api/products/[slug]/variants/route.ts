import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      variants: {
        orderBy: [{ color: "asc" }, { size: "asc" }],
      },
    },
  })

  if (!product) {
    return new Response(JSON.stringify({ error: "Product not found" }), { status: 404 })
  }

  return Response.json(
    product.variants.map((v) => ({
      id: v.id,
      color: v.color,
      size: v.size,
      imageUrl: v.imageUrl,
      price: v.price ? Number(v.price) : null,
      stock: v.stock,
    }))
  )
}

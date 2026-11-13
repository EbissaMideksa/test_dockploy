import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      variants: {
        orderBy: [{ color: "asc" }, { size: "asc" }],
      },
    },
  })

  if (!product) {
    return new Response(JSON.stringify({ error: "Product not found" }), { status: 404 })
  }

  return Response.json({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: Number(product.price),
    stock: product.stock,
    imageUrl: product.imageUrl,
    isActive: product.isActive,
    category: product.category,
    variants: product.variants.map((v) => ({
      id: v.id,
      color: v.color,
      size: v.size,
      imageUrl: v.imageUrl,
      price: v.price ? Number(v.price) : null,
      stock: v.stock,
    })),
  })
}

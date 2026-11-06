import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import AddToCartButton from "@/components/AddToCartButton"
import { ImageZoom } from "@/components/ImageZoom"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  })
  if (!product || !product.isActive) {
    notFound()
  }

  let related: Array<{ id: string; name: string; slug: string; price: number; imageUrl: string | null; stock: number }> = []
  if (product.relatedIds && product.relatedIds.length > 0) {
    const fetched = await prisma.product.findMany({
      where: { id: { in: product.relatedIds }, isActive: true },
      take: 4,
    })
    related = fetched.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      imageUrl: p.imageUrl,
      stock: p.stock,
    }))
  }

  return (
    <div className="mx-auto max-w-[980px] py-8">
      <div className="flex gap-8 flex-wrap">
        <div className="flex-1 min-w-[320px]">
          {product.imageUrl ? (
            <ImageZoom src={product.imageUrl} alt={product.name} className="border border-input" />
          ) : (
            <div className="w-full h-80 rounded-lg border-2 border-dashed border-input bg-muted text-muted-foreground flex items-center justify-center">
              No image
            </div>
          )}
        </div>
        <div className="flex-1 min-w-[300px]">
          <h1 className="text-2xl font-bold text-foreground mb-2">{product.name}</h1>
          {product.category && (
            <p className="text-sm text-muted-foreground mb-5">
              <Link href={`/?cat=${product.category.slug}`} className="text-primary hover:underline">{product.category.name}</Link>
            </p>
          )}
          <p className="text-muted-foreground mb-5 whitespace-pre-line">
            {product.description ?? "No description available."}
          </p>
          <p className="text-xl font-bold text-foreground mb-4">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(product.price))}
          </p>
          <p className={`text-sm font-semibold mb-4 ${product.stock > 0 ? "text-emerald-600" : "text-destructive"}`}>
            {product.stock > 0 ? `In stock (${product.stock})` : "Out of stock"}
          </p>
          <AddToCartButton productId={product.id} stock={product.stock} />
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-foreground mb-4">Related Items</h2>
          <div className="grid grid-cols-4 gap-4">
            {related.map((p) => (
              <article key={p.id} className="bg-card p-4 rounded-lg border border-input">
                {p.imageUrl && (
                  <ImageZoom src={p.imageUrl} alt={p.name} className="h-24 mb-2" zoom={1.4} />
                )}
                <h3 className="text-sm font-semibold mb-1">
                  <Link href={`/products/${p.slug}`} className="text-foreground hover:text-primary">{p.name}</Link>
                </h3>
                <p className="text-sm font-bold text-foreground">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(p.price))}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

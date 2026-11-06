import { prisma } from "@/lib/prisma"
import Link from "next/link"
import AddToCartButton from "@/components/AddToCartButton"
import { ImageZoom } from "@/components/ImageZoom"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>
}) {
  const { cat } = await searchParams
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, take: 8 }),
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(cat ? { category: { slug: cat } } : {}),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <input
          id="search"
          type="text"
          placeholder="Search items..."
          className="border border-input rounded-md p-2 inline-block focus-visible:ring-2 focus-visible:ring-ring w-min-[320px]"
        />
      </div>

      {categories.length > 0 && (
        <div className="overflow-x-auto pb-2">
          <p className="block text-sm font-medium text-muted-foreground mb-1">Categories</p>
          <div className="flex gap-2">
            <Link href="/" className="border border-input text-muted-foreground px-3 py-1 text-sm rounded-md hover:bg-secondary whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring">
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/?cat=${cat.slug}`}
                className="border border-input text-muted-foreground px-3 py-1 text-sm rounded-md hover:bg-secondary whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {products.length === 0 ? (
          <div className="col-span-4 text-center py-12 text-muted-foreground">
            <h3 className="text-lg font-medium">No products found</h3>
            <p>Try adjusting your search or browse all categories.</p>
          </div>
        ) : (
          products.map((product, index) => (
            <article key={product.id} className="card" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="product-image">
                {product.imageUrl ? (
                  <ImageZoom src={product.imageUrl} alt={product.name} className="h-40" />
                ) : (
                  <span className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-input bg-muted text-muted-foreground">
                    No image
                  </span>
                )}
              </div>
              <div className="product-info mt-2">
                <span className="text-xs font-medium text-muted-foreground">{product.category?.name ?? "General"}</span>
                <h3 className="text-base font-semibold text-foreground mt-1">
                  <Link href={`/products/${product.slug}`} className="hover:text-primary">{product.name}</Link>
                </h3>
                <div className="product-stock mt-1 text-sm font-medium">
                  {product.stock > 0 ? `In stock (${product.stock})` : "Out of stock"}
                </div>
                <p className="product-price text-foreground mt-1">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(product.price))}
                </p>
                <AddToCartButton productId={product.id} stock={product.stock} />
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}

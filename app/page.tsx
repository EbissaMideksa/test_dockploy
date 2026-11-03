import { prisma } from "@/lib/prisma"
import Link from "next/link"
import AddToCartButton from "@/components/AddToCartButton"

export const dynamic = "force-dynamic"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; search?: string }>
}) {
  const { cat, search } = await searchParams
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, take: 8 }),
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(cat ? { category: { slug: cat } } : {}),
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
  ])

  return (
    <div className="section fade-in">
      <form
        action="/"
        method="GET"
        style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}
      >
        <h1 className="page-title" style={{ margin: 0 }}>Products</h1>
        <input
          name="search"
          type="text"
          placeholder="Search items..."
          className="input"
          defaultValue={search ?? ""}
          style={{ width: "min(320px, 100%)", display: "inline-block", marginBottom: 0 }}
        />
        {search && (
          <Link href="/" className="btn btn-outline btn-sm" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
            Clear
          </Link>
        )}
      </form>

      {categories.length > 0 && (
        <div style={{ marginBottom: "1.5rem", overflowX: "auto", paddingBottom: 0.5 }}>
          <p className="label">Categories</p>
          <div style={{ display: "flex", gap: 0.75, direction: "rtl" }}>
            <Link
              href="/"
              className="btn btn-outline btn-sm"
              style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/?cat=${cat.slug}${search ? `&search=${search}` : ""}`}
                className="btn btn-outline btn-sm"
                style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4">
        {products.length === 0 ? (
          <div className="empty-state fade-in">
            <h3>No products found</h3>
            <p>Try adjusting your search or browse all categories.</p>
          </div>
        ) : (
          products.map((product, index) => (
            <article
              key={product.id}
              className="product-card slide-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="product-image">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    loading="lazy"
                  />
                ) : (
                  <span>No image</span>
                )}
              </div>
              <div className="product-info">
                <span className="product-category">{product.category?.name ?? "General"}</span>
                <h3 className="product-name">
                  <Link href={`/products/${product.slug}`}>{product.name}</Link>
                </h3>
                <div className="product-stock in-stock">
                  {product.stock > 0 ? `In stock (${product.stock})` : "Out of stock"}
                </div>
                <p className="product-price">
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

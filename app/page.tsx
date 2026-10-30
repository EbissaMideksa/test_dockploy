import { prisma } from "@/lib/prisma"
import Link from "next/link"
import AddToCartButton from "@/components/AddToCartButton"

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
      where: { isActive: true, ...(cat ? { category: { slug: cat } } : {}) },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
  ])

  return (
    <div className="section">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <h1 className="page-title" style={{ margin: 0 }}>Products</h1>
        <input
          id="search"
          type="text"
          placeholder="Search items..."
          className="input"
          style={{ width: "min(320px, 100%)", display: "inline-block", marginBottom: 0 }}
        />
      </div>

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
                href={`/?cat=${cat.slug}`}
                className="btn btn-outline btn-sm"
                style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4" style={{ direction: "rtl" }}>
        {products.length === 0 ? (
          <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#64748b" }}>
            No products found.
          </p>
        ) : (
          products.map((product) => (
            <article key={product.id} className="card" style={{ direction: "ltr" }}>
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "6px", marginBottom: 0.75 }}
                />
              )}
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>
                <Link href={`/products/${product.slug}`}>{product.name}</Link>
              </h3>
              {product.category && (
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "#64748b" }}>
                  <Link href={`/?cat=${product.category.slug}`}>{product.category.name}</Link>
                </p>
              )}
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem" }}>
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(product.price))}
              </p>
              <AddToCartButton productId={product.id} stock={product.stock} />
            </article>
          ))
        )}
      </div>
    </div>
  )
}

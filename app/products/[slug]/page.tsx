import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import AddToCartButton from "@/components/AddToCartButton"

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
    <div className="section" style={{ maxWidth: 980 }}>
      <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{ width: "100%", borderRadius: 8, border: "1px solid #e2e8f0" }}
            />
          ) : (
            <div style={{ width: "100%", height: 320, borderRadius: 8, border: "1px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", background: "#f8fafc" }}>
              No image
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 300 }}>
          <h1 style={{ fontSize: 1.75, fontWeight: 700, margin: "0 0 0.5rem" }}>{product.name}</h1>
          {product.category && (
            <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "#64748b" }}>
              <Link href={`/?cat=${product.category.slug}`}>{product.category.name}</Link>
            </p>
          )}
          <p style={{ whiteSpace: "pre-line", margin: "0 0 1.25rem", color: "#334155" }}>
            {product.description ?? "No description available."}
          </p>
          <p style={{ margin: "0 0 1rem", fontSize: 1.5, fontWeight: 700 }}>
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(product.price))}
          </p>
          <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: product.stock > 0 ? "#15803d" : "#b91c1c", fontWeight: 600 }}>
            {product.stock > 0 ? `In stock (${product.stock})` : "Out of stock"}
          </p>
          <AddToCartButton productId={product.id} stock={product.stock} />
        </div>
      </div>

      {related.length > 0 && (
        <div style={{ marginTop: 2.5 }}>
          <h2 style={{ fontSize: 1.25, fontWeight: 700, marginBottom: 1 }}>Related Items</h2>
          <div className="grid grid-cols-4">
            {related.map((p) => (
              <article key={p.id} className="card">
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6, marginBottom: 0.5 }}
                  />
                )}
                <h3 style={{ margin: "0 0 0.4rem", fontSize: 1 }}>
                  <Link href={`/products/${p.slug}`}>{p.name}</Link>
                </h3>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>
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

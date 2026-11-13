"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import AddToCartButton from "@/components/AddToCartButton"
import { ImageZoom } from "@/components/ImageZoom"
import { VariantSelector } from "@/components/VariantSelector"

interface ProductVariant {
  id: string
  color: string
  size: string
  imageUrl: string | null
  price: number | null
  stock: number
}

interface ProductData {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  stock: number
  imageUrl: string | null
  isActive: boolean
  category: { id: string; name: string; slug: string } | null
  variants: ProductVariant[]
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const [product, setProduct] = useState<ProductData | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const resolvedParams = await params
      const { slug } = resolvedParams
      try {
        const [pRes, vRes] = await Promise.all([
          fetch(`/api/products/${slug}`, { cache: "no-store" }),
          fetch(`/api/products/${slug}/variants`, { cache: "no-store" }),
        ])
        if (pRes.ok) {
          const data = await pRes.json()
          setProduct(data)
        }
        if (vRes.ok) {
          const variants = await vRes.json()
          if (variants.length > 0) {
            setSelectedVariant(variants[0])
          }
        }
      } catch {
        // ignore
      }
      setLoading(false)
    })()
  }, [])

  if (loading) return <p>Loading...</p>
  if (!product) return notFound()

  const displayVariant = selectedVariant ?? null
  const displayPrice = displayVariant?.price ?? product.price
  const displayStock = displayVariant?.stock ?? product.stock
  const displayImage = displayVariant?.imageUrl ?? product.imageUrl

  return (
    <div className="mx-auto max-w-[1100px] py-8">
      <div className="flex gap-8 flex-wrap">
        {/* Left: variant swatches (small) */}
        <div className="flex-1 min-w-[280px]">
          {product.variants && product.variants.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Variants</h3>
              <VariantSelector variants={product.variants} onSelect={setSelectedVariant} />
              {displayVariant && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{displayVariant.color}</span> /{" "}
                    <span className="font-medium text-foreground">{displayVariant.size}</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
              No variants available
            </div>
          )}
        </div>

        {/* Right: big zoomed image + product details */}
        <div className="flex-1 min-w-[320px]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-input">
            {displayImage ? (
              <ImageZoom src={displayImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg text-muted-foreground text-sm">
                No image
              </div>
            )}
          </div>

          <div className="mt-6">
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
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(displayPrice))}
            </p>
            <p className={`text-sm font-semibold mb-6 ${displayStock > 0 ? "text-emerald-600" : "text-destructive"}`}>
              {displayStock > 0 ? `In stock — ${displayStock} available` : "Sold out — this variant is unavailable"}
            </p>
            <AddToCartButton productId={product.id} variantId={displayVariant?.id ?? undefined} stock={displayStock} />
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"

interface ProductVariant {
  id: string
  color: string
  size: string
  imageUrl: string | null
  price: number | null
  stock: number
}

interface VariantSelectorProps {
  variants: ProductVariant[]
  onSelect: (variant: ProductVariant | null) => void
}

export function VariantSelector({ variants, onSelect }: VariantSelectorProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(variants.length > 0 ? variants[0].id : null)

  const colors = Array.from(new Set(variants.map((v) => v.color)))
  const sizes = Array.from(new Set(variants.map((v) => v.size)))

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null

  const handleColorChange = (color: string) => {
    const variant = variants.find((v) => v.color === color && v.size === selectedVariant?.size)
    if (variant) setSelectedVariantId(variant.id)
  }

  const handleSizeChange = (size: string) => {
    const variant = variants.find((v) => v.size === size && v.color === selectedVariant?.color)
    if (variant) setSelectedVariantId(variant.id)
  }

  if (!selectedVariant) {
    onSelect(null)
    return null
  }

  onSelect(selectedVariant)

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
      {/* Variant photo thumbnails (small view on left) */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Photos</label>
        <div className="grid grid-cols-3 gap-2">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVariantId(v.id)}
              className={`relative aspect-square rounded-md border-2 overflow-hidden transition-colors cursor-pointer ${
                selectedVariant?.id === v.id ? "ring-2 ring-primary ring-offset-1" : "border-transparent hover:border-input"
              }`}
            >
              {v.imageUrl ? (
                <img src={v.imageUrl} alt={`${v.color} ${v.size}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                  <span className="text-[10px] text-muted-foreground">{v.color}</span>
                </div>
              )}
              {selectedVariant?.id === v.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="text-xs text-white font-medium bg-black/60 px-1.5 rounded">Selected</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Color & Size swatches */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Color</label>
          <div className="flex gap-2 flex-wrap">
            {colors.map((color) => {
              const active = selectedVariant?.color === color
              return (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`w-10 h-10 rounded-full border-2 transition-colors ${
                    active
                      ? "ring-2 ring-offset-2 ring-primary"
                      : "border-input hover:border-primary"
                  }`}
                  style={{ backgroundColor: color.toLowerCase() }}
                  aria-label={color}
                />
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Size</label>
          <div className="flex gap-2 flex-wrap">
            {sizes.map((size) => {
              const active = selectedVariant?.size === size
              return (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size)}
                  className={`px-4 py-2 text-sm border rounded-md transition-colors ${
                    active
                      ? "bg-primary text-white border-primary"
                      : "bg-background text-muted-foreground border-input hover:border-primary hover:text-primary"
                  }`}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-medium text-foreground capitalize">{selectedVariant.color}</span> /{" "}
          <span className="font-medium text-foreground capitalize">{selectedVariant.size}</span>
        </p>
        {selectedVariant.imageUrl && (
          <p className="text-xs text-muted-foreground mt-1">Photo shown on the right</p>
        )}
      </div>
    </div>
  )
}

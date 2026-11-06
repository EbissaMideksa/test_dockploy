"use client"

import { useState, useCallback } from "react"

interface ImageZoomProps {
  src: string
  alt: string
  className?: string
  zoom?: number
}

export function ImageZoom({ src, alt, className, zoom = 1.5 }: ImageZoomProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [hovering, setHovering] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPosition({ x, y })
    setHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHovering(false)
  }, [])

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-input ${className ?? ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ aspectRatio: "16 / 9" }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover block"
        style={{
          transform: hovering ? `scale(${zoom})` : "scale(1)",
          transformOrigin: hovering ? `${position.x}% ${position.y}%` : "center",
          transition: "transform 0.2s ease",
        }}
      />
    </div>
  )
}

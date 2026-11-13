"use client"

import { useState, useCallback } from "react"

interface ImageZoomProps {
  src: string
  alt: string
  className?: string
  zoom?: number
  lensSize?: number
}

export function ImageZoom({ src, alt, className, zoom = 5, lensSize = 150 }: ImageZoomProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [showLens, setShowLens] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPosition({ x, y })
    setShowLens(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setShowLens(false)
  }, [])

  const lensStyle: React.CSSProperties = {
    width: lensSize,
    height: lensSize,
    backgroundImage: `url("${src}")`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${zoom * 100}% ${zoom * 100}%`,
    backgroundPosition: `${position.x}% ${position.y}%`,
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-input ${className ?? ""}`}
      style={{ width: "100%" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <img src={src} alt={alt} className="w-full block" />

      {showLens && (
        <div
          className="absolute pointer-events-none border-2 border-white shadow-lg z-10"
          style={{
            ...lensStyle,
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </div>
  )
}

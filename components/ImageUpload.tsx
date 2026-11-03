"use client"

import { useState } from "react"

interface ImageUploadProps {
  value: string
  onChange: (value: string) => void
  accept?: string
}

export default function ImageUpload({ value, onChange, accept = "image/*" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "products")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success && data.fileUrl) {
          onChange(data.fileUrl)
        }
      } else {
        const err = await res.json()
        alert(err.error || "Upload failed")
      }
    } catch {
      alert("Upload failed")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0.75, marginBottom: 0.75 }}>
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="input"
        style={{ flex: 1, padding: "0.5rem", color: "#0f172a" }}
        disabled={uploading}
      />
      <button
        type="button"
        disabled={uploading}
        className="btn btn-primary"
        style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", color: "#fff" }}
      >
        {uploading ? "Uploading…" : "Upload Image"}
      </button>
      {value && (
        <div style={{ display: "flex", alignItems: "center", gap: 0.5, marginLeft: 0.75 }}>
          <img
            src={value}
            alt="preview"
            style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
          />
          <span style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {value.split("/").pop()}
          </span>
        </div>
      )}
    </div>
  )
}
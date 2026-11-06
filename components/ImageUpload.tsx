"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
      ;(e.target as HTMLInputElement).value = ""
    }
  }

  return (
    <div className="flex items-center gap-3 mb-3">
      <label className="flex-1 p-2 text-sm border border-input rounded-md focus-within:ring-2 focus-within:ring-ring cursor-pointer">
        <input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="w-0 h-0 opacity-0 overflow-hidden absolute"
        />
        {value ? value.split("/").pop() : "Choose image"}
      </label>
      <Button disabled={uploading}>
        {uploading ? "Uploading…" : "Upload Image"}
      </Button>
      {value && (
        <div className="flex items-center gap-2 ml-3">
          <img
            src={value}
            alt="preview"
            className="w-10 h-10 object-cover rounded-md"
          />
          <span className="text-sm text-muted-foreground truncate max-w-[150px]">
            {value.split("/").pop()}
          </span>
        </div>
      )}
    </div>
  )
}

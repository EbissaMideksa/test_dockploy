import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { apiError, apiJson } from "@/lib/api"

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me"
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads"
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:80"

async function requireAdmin() {
  try {
    const token = (await cookies()).get("token")?.value
    if (!token) return null
    const payload = jwt.verify(token, JWT_SECRET) as { role: string }
    return payload.role === "ADMIN" ? payload : null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) {
    return apiError("Forbidden", 403)
  }

  const formData = await req.formData()
  const file = formData.get("file") as File
  const folder = formData.get("folder") as string ?? "products"

  if (!file) {
    return apiError("No file provided", 400)
  }

  const fs = (await import("fs")) as typeof import("fs")
  const path = (await import("path")) as typeof import("path")

  const uploadDir = path.join(process.cwd(), UPLOAD_DIR, folder)
  fs.mkdirSync(uploadDir, { recursive: true })

  const fileName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
  const filePath = path.join(process.cwd(), UPLOAD_DIR, fileName)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  fs.writeFileSync(filePath, buffer)

  const fileUrl = `${NEXT_PUBLIC_APP_URL}/files/${fileName}`

  return apiJson({ success: true, fileUrl, fileName, bucket: UPLOAD_DIR })
}

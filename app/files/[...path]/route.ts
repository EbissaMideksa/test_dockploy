import { NextResponse } from "next/server"
import { createReadStream } from "fs"
import { stat } from "fs/promises"
import { join, sep } from "path"
import { Readable } from "stream"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/app/uploads"

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params

  const filePath = join(UPLOAD_DIR, ...path)

  // Prevent path traversal outside the uploads directory
  if (!filePath.startsWith(UPLOAD_DIR + sep)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  try {
    const info = await stat(filePath)
    if (!info.isFile()) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const fileName = path[path.length - 1] ?? ""
    const ext = (fileName.match(/\.[^.]+$/)?.[0] ?? "").toLowerCase()

    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream

    return new NextResponse(stream, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return new NextResponse("Not Found", { status: 404 })
  }
}
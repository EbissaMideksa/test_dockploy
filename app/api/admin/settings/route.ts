import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { readBody } from "@/lib/api"

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me"

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

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 })
  }

  const settings = await prisma.appSetting.findMany()
  const settingsMap: Record<string, string> = {}
  for (const s of settings) {
    settingsMap[s.key] = s.value
  }

  return NextResponse.json({ settings: settingsMap })
}

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) {
    return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 })
  }

  const body = await readBody(req)
  const { key, value } = body

  if (!key || !value) {
    return new NextResponse(JSON.stringify({ error: "key and value are required" }), { status: 400 })
  }

  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })

  return NextResponse.json({ success: true })
}

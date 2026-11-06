//app/api/seed/route.ts
import { NextResponse } from "next/server"
import { seed } from "@/lib/seed"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

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

export async function POST() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  await seed()
  return NextResponse.json({ seeded: true })
}

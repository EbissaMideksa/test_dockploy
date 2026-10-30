import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { apiError, apiJson } from "@/lib/api"

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me"

async function readBody(req: Request) {
  const ct = req.headers.get("content-type") ?? ""
  if (ct.includes("application/json")) {
    return req.json().catch(() => ({}))
  }
  const fd = await req.formData()
  const obj: Record<string, string> = {}
  for (const [k, v] of fd.entries()) {
    obj[k] = String(v)
  }
  return obj
}

export async function POST(req: Request) {
  const body = await readBody(req)
  const { email, password, name } = body
  if (!email || !password) {
    return apiError("Email and password are required")
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return apiError("Email already registered", 409)
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, password: hashed, name: name || undefined },
    select: { id: true, email: true, role: true },
  })

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  )
  ;(await cookies()).set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  return apiJson({ success: true, user })
}

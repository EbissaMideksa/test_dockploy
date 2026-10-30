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
  const { email, password } = body
  if (!email || !password) {
    return apiError("Email and password are required")
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return apiError("Invalid email or password", 401)
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return apiError("Invalid email or password", 401)
  }

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

  return apiJson({ success: true, user: { id: user.id, email: user.email, role: user.role } })
}

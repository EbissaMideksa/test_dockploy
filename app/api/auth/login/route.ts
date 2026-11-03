import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { apiError, apiJson } from "@/lib/api"
import { broadcastEvent } from "@/lib/events"

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

async function getSessionTimeoutMinutes(): Promise<number> {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: "sessionTimeoutMinutes" } })
    if (setting) {
      return parseInt(setting.value, 10) || 60 * 24 * 7
    }
  } catch {
    // ignore
  }
  return 60 * 24 * 7
}

function formatExpiry(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) return `${hours}h${mins}m`
  if (hours > 0) return `${hours}h`
  return `${mins}m`
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

  const sessionMinutes = await getSessionTimeoutMinutes()
  const expiresIn = formatExpiry(sessionMinutes)
  const maxAge = sessionMinutes * 60

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn } as jwt.SignOptions
  )
  ;(await cookies()).set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  })

  broadcastEvent({
    type: "auth_login",
    data: {
      userId: user.id,
      email: user.email,
      role: user.role,
      redirectTo: "/",
    },
    timestamp: new Date().toISOString(),
  })

  return apiJson({ success: true, user: { id: user.id, email: user.email, role: user.role } })
}

import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me"

export function baseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}

export async function readBody(req: Request) {
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

export async function getApiUser() {
  try {
    const token = (await cookies()).get("token")?.value
    if (!token) return null
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string }
    return payload
  } catch {
    return null
  }
}

export function apiError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export function apiJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

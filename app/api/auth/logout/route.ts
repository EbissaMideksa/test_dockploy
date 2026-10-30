import { cookies } from "next/headers"
import { apiJson } from "@/lib/api"

export async function POST() {
  ;(await cookies()).set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  return apiJson({ success: true })
}

import { cookies } from "next/headers"
import { apiJson } from "@/lib/api"
import { broadcastEvent } from "@/lib/events"

export async function POST() {
  ;(await cookies()).set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  broadcastEvent({
    type: "auth_logout",
    data: {
      redirectTo: "/login",
    },
    timestamp: new Date().toISOString(),
  })

  return apiJson({ success: true })
}

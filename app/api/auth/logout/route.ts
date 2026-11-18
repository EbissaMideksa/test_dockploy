import { clearAuthCookie } from "@/lib/auth"
import { apiJson } from "@/lib/api"
import { broadcastEvent } from "@/lib/events"

export async function POST() {
  await clearAuthCookie()

  broadcastEvent({
    type: "auth_logout",
    data: {
      redirectTo: "/login",
    },
    timestamp: new Date().toISOString(),
  })

  return apiJson({ success: true })
}

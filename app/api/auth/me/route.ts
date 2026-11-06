import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { apiJson } from "@/lib/api"

export async function GET() {
  try {
    const token = (await cookies()).get("token")?.value
    if (!token) {
      return apiJson({ user: null })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET ?? "dev-secret-change-me") as {
      id: string
      email: string
      role: string
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, role: true },
    })

    return apiJson({ user })
  } catch {
    return apiJson({ user: null })
  }
}

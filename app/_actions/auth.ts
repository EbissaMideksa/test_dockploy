"use server"

import { prisma } from "@/lib/prisma"
import {
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
} from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { error: "Invalid email or password" }
  }

  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    return { error: "Invalid email or password" }
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role })
  await setAuthCookie(token)
  revalidatePath("/")
  return { success: true, user: { id: user.id, email: user.email, role: user.role } }
}

export async function register(formData: FormData) {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const name = String(formData.get("name") ?? "")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "Email already registered" }
  }

  const hashed = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email, password: hashed, name: name || undefined },
    select: { id: true, email: true, role: true },
  })

  const token = signToken({ id: user.id, email: user.email, role: user.role })
  await setAuthCookie(token)
  revalidatePath("/")
  return { success: true, user }
}

export async function logout() {
  await clearAuthCookie()
  revalidatePath("/")
  return { success: true }
}

export async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) return

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return

  const hashed = await hashPassword(password)
  await prisma.user.create({
    data: { email, password: hashed, name: "Admin", role: "ADMIN" },
  })
}

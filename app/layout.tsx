import { cookies } from "next/headers"
import ClientNavbar from "@/components/ClientNavbar"
import { ToastProvider } from "@/components/ui/toaster"
import { getCurrentUser } from "@/lib/auth"
import type { AuthUser } from "@/lib/auth-types"
import "./globals.css"

export const metadata = {
  title: "Dokploy E-Commerce",
  description: "Prisma ORM + PostgreSQL e-commerce test app",
}

export const dynamic = "force-dynamic"

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const token = (await cookies()).get("token")?.value
  const user = token ? ((await getCurrentUser()) as AuthUser | null) : null

  return (
    <html lang="en">
      <head />
      <body>
        <ToastProvider>
          <ClientNavbar initialUser={user} />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
        </ToastProvider>
      </body>
    </html>
  )
}

import { getCurrentUser } from "@/lib/auth"
import Navbar from "@/components/navbar"
import "./globals.css"

export const metadata = {
  title: "Dokploy E-Commerce",
  description: "Prisma ORM + PostgreSQL e-commerce test app",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  return (
    <html lang="en">
      <head />
      <body>
        <Navbar user={user} />
        <main>{children}</main>
      </body>
    </html>
  )
}

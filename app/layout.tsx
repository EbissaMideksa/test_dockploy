import ClientNavbar from "@/components/ClientNavbar"
import { ToastProvider } from "@/components/ui/toaster"
import "./globals.css"

export const metadata = {
  title: "Dokploy E-Commerce",
  description: "Prisma ORM + PostgreSQL e-commerce test app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head />
      <body>
        <ToastProvider>
          <ClientNavbar />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
        </ToastProvider>
      </body>
    </html>
  )
}

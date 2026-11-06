"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Card } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"

export default function RegisterPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    const password = fd.get("password")
    const confirm = fd.get("confirmPassword")
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    setError("")
    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: fd,
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      toast("Account created successfully")
      window.dispatchEvent(new Event("auth-changed"))
      router.push("/")
      router.refresh()
    } else {
      toast({ title: data.error || "Registration failed", variant: "destructive" })
    }
  }

  return (
    <div className="mx-auto max-w-[420px] py-8">
      <h1 className="text-xl font-bold text-foreground mb-6">Register</h1>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      <Card>
        <CardHeader>
          <CardTitle>Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input name="name" type="text" placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input name="password" type="password" required placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>Confirm password</Label>
              <Input name="confirmPassword" type="password" required placeholder="••••••••" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">Log in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-muted-foreground mb-1">{children}</label>
}

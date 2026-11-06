"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table } from "@/components/ui/table"
import { TableBody } from "@/components/ui/table"
import { TableCell } from "@/components/ui/table"
import { TableHead } from "@/components/ui/table"
import { TableHeader } from "@/components/ui/table"
import { TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"

interface Setting {
  id: string
  key: string
  value: string
  updatedAt: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [message, setMessage] = useState({ text: "", type: "" as "error" | "success" })
  const [loading, setLoading] = useState(true)

  async function loadSettings() {
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        const settingsMap = data.settings || {}
        setSettings(
          Object.entries(settingsMap as Record<string, string>).map(([key, value]) => ({
            id: key,
            key,
            value,
            updatedAt: "",
          }))
        )
      }
    } catch {
      setMessage({ text: "Failed to load settings", type: "error" })
    }
    setLoading(false)
  }

  async function saveSetting(key: string, value: string) {
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    })
    if (res.ok) {
      setMessage({ text: "Setting saved", type: "success" })
      setEditing(null)
      loadSettings()
    } else {
      setMessage({ text: "Failed to save", type: "error" })
    }
  }

  useEffect(() => {
    ;(async () => {
      await loadSettings()
    })()
  }, [])

  if (loading) return <p>Loading...</p>

  const sessionTimeoutMinutes = settings.find((s) => s.key === "sessionTimeoutMinutes")

  function formatTimeout(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h > 0 && m > 0) return `${h}h ${m}m`
    if (h > 0) return `${h}h`
    return `${m}m`
  }

  return (
    <div className="mx-auto max-w-[800px] py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
        <Button variant="outline" asChild>
          <Link href="/admin"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
        </Button>
      </div>

      {message.text && (
        <p className={`mb-4 text-sm ${message.type === "error" ? "text-destructive" : "text-emerald-600"}`}>{message.text}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Session Timeout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <span className="font-semibold text-foreground">Session Timeout:</span>
            {editing === "sessionTimeoutMinutes" ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="525600"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-[80px]"
                  onBlur={() => {
                    if (editValue) {
                      saveSetting("sessionTimeoutMinutes", editValue)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editValue) {
                      saveSetting("sessionTimeoutMinutes", editValue)
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            ) : (
              <>
                <span className="text-lg font-bold text-primary">
                  {sessionTimeoutMinutes?.value ? formatTimeout(parseInt(sessionTimeoutMinutes.value, 10)) : "7d"}
                </span>
                <Button
                  onClick={() => {
                    setEditValue(sessionTimeoutMinutes?.value ?? "10080")
                    setEditing("sessionTimeoutMinutes")
                  }}
                  variant="outline"
                  size="sm"
                >
                  Edit
                </Button>
              </>
            )}
            <p className="text-sm text-muted-foreground ml-4">
              Controls how long user login sessions remain valid before requiring re-login.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">All Settings</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.key}</TableCell>
                <TableCell>{s.value}</TableCell>
                <TableCell>{new Date(s.updatedAt).toLocaleDateString()}</TableCell>
                <td className="p-4 text-right">
                  <Button
                    onClick={() => {
                      setEditValue(s.value)
                      setEditing(s.key)
                    }}
                    variant="outline"
                    size="sm"
                    className="mr-2"
                  >
                    Edit
                  </Button>
                </td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

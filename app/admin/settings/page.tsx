"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface AppSetting {
  id: string
  key: string
  value: string
  updatedAt: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSetting[]>([])
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

  useEffect(() => {
    ;(async () => {
      await loadSettings()
    })()
  }, [])

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
    <div className="section" style={{ maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 1.5 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Admin Settings</h1>
        <Link href="/admin" className="btn btn-outline">Back to Dashboard</Link>
      </div>

      {message.text && (
        <p className={message.type === "error" ? "error" : "success"}>{message.text}</p>
      )}

      <div className="card fade-in">
        <h2 style={{ fontSize: 1.1, fontWeight: 700, marginBottom: 1 }}>Session Timeout</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 1, marginBottom: 1 }}>
          <span style={{ fontWeight: 600, color: "#334155" }}>Session Timeout:</span>
          {editing === "sessionTimeoutMinutes" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <input
                type="number"
                min="1"
                max="525600"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="input"
                style={{ width: 80 }}
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
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>minutes</span>
            </div>
          ) : (
            <>
              <span
                style={{
                  fontSize: 1.1,
                  fontWeight: 700,
                  color: "#2563eb",
                }}
              >
                {sessionTimeoutMinutes?.value ? formatTimeout(parseInt(sessionTimeoutMinutes.value, 10)) : "7d"}
              </span>
              <button
                onClick={() => {
                  setEditValue(sessionTimeoutMinutes?.value ?? "10080")
                  setEditing("sessionTimeoutMinutes")
                }}
                className="btn btn-outline btn-sm"
                style={{ padding: "0.35rem 0.8rem", fontSize: "0.85rem" }}
              >
                Edit
              </button>
            </>
          )}
          <p className="muted" style={{ fontSize: "0.85rem", marginLeft: 1 }}>
            Controls how long user login sessions remain valid before requiring re-login.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 2 }}>
        <h2 style={{ fontSize: 1.1, fontWeight: 700, marginBottom: 1 }}>All Settings</h2>
        <table className="table" style={{ marginBottom: 1.5 }}>
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.key}</td>
                <td>{s.value}</td>
                <td>{new Date(s.updatedAt).toLocaleDateString()}</td>
                <td style={{ textAlign: "right" }}>
                  <button
                    onClick={() => {
                      setEditValue(s.value)
                      setEditing(s.key)
                    }}
                className="btn btn-outline btn-sm"
                style={{ padding: "0.35rem 0.8rem", fontSize: "0.85rem", marginRight: 0.4 }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

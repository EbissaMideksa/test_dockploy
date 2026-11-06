"use client"

import { Toaster } from "react-hot-toast"

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster position="top-right" toastOptions={style} />
      {children}
    </>
  )
}

const style = {
  style: {
    border: "1px solid var(--border)",
    padding: "16px",
    fontFamily: "var(--font-sans)",
    background: "var(--background)",
    color: "var(--foreground)",
  },
  success: {
    iconTheme: {
      primary: "#10b981",
      secondary: "#ffffff",
    },
  },
  error: {
    iconTheme: {
      primary: "#ef4444",
      secondary: "#ffffff",
    },
  },
}

"use client"

import toast from "react-hot-toast"

export function useToast() {
  return {
    toast: (messageOrOptions: string | { title?: string; description?: string; variant?: "default" | "destructive" }) => {
      if (typeof messageOrOptions === "string") {
        toast(messageOrOptions, { duration: 3000, icon: "✅" })
      } else {
        toast(messageOrOptions.title || "", {
          duration: 3000,
          icon: messageOrOptions.variant === "destructive" ? "❌" : "✅",
        })
      }
    },
  }
}

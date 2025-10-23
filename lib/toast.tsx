"use client"

import { Toaster as Sonner } from "sonner"

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        style: {
          background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
          border: "1px solid rgba(249, 115, 22, 0.3)",
          color: "#fff",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
        },
      }}
    />
  )
}

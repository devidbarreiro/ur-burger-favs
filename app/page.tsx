"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  const selectUser = (user: "Lolo" | "David") => {
    localStorage.setItem("burger-app-user", user)
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background to-muted/30">
      <div className="w-full max-w-md space-y-12">
        <div className="text-center space-y-6">
          <div className="text-7xl mb-4 animate-in zoom-in duration-700" style={{ animationDelay: "0ms" }}>
            🍔
          </div>
          <h1
            className="text-6xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: "200ms" }}
          >
            Burger Rater
          </h1>
          <p
            className="text-muted-foreground text-xl font-medium animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: "400ms" }}
          >
            ¿Quién eres?
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => selectUser("Lolo")}
            className="w-full h-24 text-3xl font-bold bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/50 animate-in fade-in slide-in-from-bottom-4 duration-700 button-press"
            style={{ animationDelay: "600ms" }}
          >
            <span className="mr-3">💖</span>
            Lolo
          </Button>
          <Button
            onClick={() => selectUser("David")}
            className="w-full h-24 text-3xl font-bold bg-secondary hover:bg-secondary/90 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-secondary/30 hover:shadow-2xl hover:shadow-secondary/50 animate-in fade-in slide-in-from-bottom-4 duration-700 button-press"
            style={{ animationDelay: "800ms" }}
          >
            <span className="mr-3">💙</span>
            David
          </Button>
        </div>
      </div>
    </div>
  )
}

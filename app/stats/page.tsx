"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, TrendingUp, Flame, Star } from "lucide-react"
import useSWR from "swr"

type BurgerPlace = {
  id: string
  name: string
  image_url: string
  created_by: string
  created_at: string
}

type Rating = {
  id: string
  burger_place_id: string
  user_name: string
  meat_rating: number
  cheese_rating: number
  juiciness_rating: number
  bread_rating: number
  sauce_rating: number
  comment?: string
  created_at: string
}

export default function StatsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<"Lolo" | "David" | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const user = localStorage.getItem("burger-app-user") as "Lolo" | "David" | null
    if (!user) {
      router.push("/")
    } else {
      setCurrentUser(user)
    }
  }, [router])

  const fetcher = async () => {
    const [placesRes, ratingsRes] = await Promise.all([
      supabase.from("burger_places").select("*").order("created_at", { ascending: false }),
      supabase.from("ratings").select("*").order("created_at", { ascending: false }),
    ])

    if (placesRes.error) throw placesRes.error
    if (ratingsRes.error) throw ratingsRes.error

    return {
      places: placesRes.data as BurgerPlace[],
      ratings: ratingsRes.data as Rating[],
    }
  }

  const { data, isLoading } = useSWR("burger-data", fetcher, {
    refreshInterval: 3000,
  })

  if (!currentUser) return null

  // Calculate statistics
  const loloRatings = data?.ratings.filter((r) => r.user_name === "Lolo") || []
  const davidRatings = data?.ratings.filter((r) => r.user_name === "David") || []

  const calculateAverage = (ratings: Rating[]) => {
    if (ratings.length === 0) return 0
    const sum = ratings.reduce((acc, r) => {
      return acc + (r.meat_rating + r.cheese_rating + r.juiciness_rating + r.bread_rating + r.sauce_rating) / 5
    }, 0)
    return sum / ratings.length
  }

  const loloAvg = calculateAverage(loloRatings)
  const davidAvg = calculateAverage(davidRatings)

  // Calculate category averages
  const calculateCategoryAverages = (ratings: Rating[]) => {
    if (ratings.length === 0) return { Carne: 0, Queso: 0, Jugosidad: 0, Pan: 0, Salsa: 0 }

    const totals = ratings.reduce(
      (acc, r) => ({
        Carne: acc.Carne + r.meat_rating,
        Queso: acc.Queso + r.cheese_rating,
        Jugosidad: acc.Jugosidad + r.juiciness_rating,
        Pan: acc.Pan + r.bread_rating,
        Salsa: acc.Salsa + r.sauce_rating,
      }),
      { Carne: 0, Queso: 0, Jugosidad: 0, Pan: 0, Salsa: 0 },
    )

    return {
      Carne: totals.Carne / ratings.length,
      Queso: totals.Queso / ratings.length,
      Jugosidad: totals.Jugosidad / ratings.length,
      Pan: totals.Pan / ratings.length,
      Salsa: totals.Salsa / ratings.length,
    }
  }

  const loloCategories = calculateCategoryAverages(loloRatings)
  const davidCategories = calculateCategoryAverages(davidRatings)

  // Calculate top 3 burger places
  const topPlaces = (data?.places || [])
    .map((place) => {
      const placeRatings = data?.ratings.filter((r) => r.burger_place_id === place.id) || []
      const avg = calculateAverage(placeRatings)
      return { place, avg, ratingsCount: placeRatings.length }
    })
    .filter((item) => item.ratingsCount > 0)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3)

  // Calculate streak (consecutive days with reviews)
  const calculateStreak = () => {
    if (!data?.ratings || data.ratings.length === 0) return 0

    const sortedDates = [...new Set(data.ratings.map((r) => new Date(r.created_at).toDateString()))].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    )

    let streak = 1
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const current = new Date(sortedDates[i])
      const next = new Date(sortedDates[i + 1])
      const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  const streak = calculateStreak()

  // Joint gamification stats
  const totalReviews = data?.ratings.length || 0
  const totalPlaces = data?.places.length || 0
  const overallAvg = calculateAverage(data?.ratings || [])

  const categories = ["Carne", "Queso", "Jugosidad", "Pan", "Salsa"]
  const categoryEmojis = {
    Carne: "🥩",
    Queso: "🧀",
    Jugosidad: "💧",
    Pan: "🍞",
    Salsa: "🥫",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-20">
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-b-[2rem] shadow-2xl p-6 pb-8">
        <Button
          onClick={() => router.push("/dashboard")}
          variant="ghost"
          className="text-white hover:bg-white/20 mb-4 -ml-2"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver
        </Button>
        <h1 className="text-white font-bold text-3xl mb-2">Estadísticas</h1>
        <p className="text-white/80 text-sm">Análisis completo de vuestras valoraciones</p>
      </div>

      <div className="px-6 mt-6 space-y-6">
        {/* Joint Stats */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-white font-bold text-xl">Estadísticas Conjuntas</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-xs mb-1">Total Reseñas</p>
              <p className="text-white text-3xl font-bold">{totalReviews}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-xs mb-1">Hamburgueserías</p>
              <p className="text-white text-3xl font-bold">{totalPlaces}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-xs mb-1">Nota Media Global</p>
              <p className="text-white text-3xl font-bold">{overallAvg.toFixed(1)}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <p className="text-gray-400 text-xs">Racha</p>
              </div>
              <p className="text-white text-3xl font-bold">{streak}</p>
              <p className="text-gray-500 text-[10px]">días consecutivos</p>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-white font-bold text-xl">Top 3 Hamburgueserías</h2>
          </div>

          {topPlaces.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No hay suficientes valoraciones aún</p>
          ) : (
            <div className="flex items-end justify-center gap-2 mb-6">
              {/* Second place */}
              {topPlaces[1] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center mb-2 shadow-lg">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <div className="w-full bg-gradient-to-t from-gray-700 to-gray-600 rounded-t-xl p-3 h-24 flex flex-col items-center justify-center">
                    <p className="text-white font-bold text-sm text-center line-clamp-2 mb-1">
                      {topPlaces[1].place.name}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-white text-xs font-bold">{topPlaces[1].avg.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* First place */}
              {topPlaces[0] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-2 shadow-2xl animate-pulse">
                    <Trophy className="h-10 w-10 text-white" />
                  </div>
                  <div className="w-full bg-gradient-to-t from-yellow-600 to-yellow-500 rounded-t-xl p-3 h-32 flex flex-col items-center justify-center">
                    <p className="text-white font-bold text-base text-center line-clamp-2 mb-1">
                      {topPlaces[0].place.name}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-white fill-white" />
                      <span className="text-white text-sm font-bold">{topPlaces[0].avg.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Third place */}
              {topPlaces[2] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-2 shadow-lg">
                    <span className="text-xl font-bold text-white">3</span>
                  </div>
                  <div className="w-full bg-gradient-to-t from-orange-700 to-orange-600 rounded-t-xl p-3 h-20 flex flex-col items-center justify-center">
                    <p className="text-white font-bold text-xs text-center line-clamp-2 mb-1">
                      {topPlaces[2].place.name}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-white text-xs font-bold">{topPlaces[2].avg.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lolo vs David Comparison */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <h2 className="text-white font-bold text-xl">Lolo vs David</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4">
              <p className="text-pink-400 font-bold mb-2">Lolo</p>
              <p className="text-white text-3xl font-bold">{loloAvg.toFixed(1)}</p>
              <p className="text-gray-400 text-xs">{loloRatings.length} reseñas</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-400 font-bold mb-2">David</p>
              <p className="text-white text-3xl font-bold">{davidAvg.toFixed(1)}</p>
              <p className="text-gray-400 text-xs">{davidRatings.length} reseñas</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-gray-400 text-sm font-medium mb-3">Comparación por Categorías</p>
            {categories.map((category) => {
              const loloValue = loloCategories[category as keyof typeof loloCategories]
              const davidValue = davidCategories[category as keyof typeof davidCategories]
              const maxValue = Math.max(loloValue, davidValue, 5)

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{categoryEmojis[category as keyof typeof categoryEmojis]}</span>
                      <span className="text-white text-sm font-medium">{category}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-pink-400 text-xs w-12">Lolo</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-pink-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(loloValue / maxValue) * 100}%` }}
                        />
                      </div>
                      <span className="text-white text-xs font-bold w-8">{loloValue.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 text-xs w-12">David</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(davidValue / maxValue) * 100}%` }}
                        />
                      </div>
                      <span className="text-white text-xs font-bold w-8">{davidValue.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

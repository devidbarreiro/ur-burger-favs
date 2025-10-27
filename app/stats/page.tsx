"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, TrendingUp, Star } from "lucide-react"
import useSWR from "swr"

type Restaurant = {
  id: string
  name: string
  image_url: string
  address: string
  latitude: number
  longitude: number
  place_id: string
  created_by: string
  created_at: string
}

type Burger = {
  id: string
  restaurant_id: string
  name: string
  created_by: string
  created_at: string
}

type Visit = {
  id: string
  restaurant_id: string
  visit_date: string
  photo_url: string
  created_by: string
  created_at: string
}

type VisitRating = {
  id: string
  visit_id: string
  burger_id: string
  user_name: string
  meat_rating: number
  cheese_rating: number
  juiciness_rating: number
  bread_rating: number
  sauce_rating: number
  fries_rating?: number
  comment?: string
  price?: number
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
    const [restaurantsRes, burgersRes, visitsRes, ratingsRes] = await Promise.all([
      supabase.from("restaurants").select("*").order("created_at", { ascending: false }),
      supabase.from("burgers").select("*").order("created_at", { ascending: false }),
      supabase.from("visits").select("*").order("visit_date", { ascending: false }),
      supabase.from("visit_ratings").select("*").order("created_at", { ascending: false }),
    ])

    if (restaurantsRes.error) throw restaurantsRes.error
    if (burgersRes.error) throw burgersRes.error
    if (visitsRes.error) throw visitsRes.error
    if (ratingsRes.error) throw ratingsRes.error

    return {
      restaurants: restaurantsRes.data as Restaurant[],
      burgers: burgersRes.data as Burger[],
      visits: visitsRes.data as Visit[],
      ratings: ratingsRes.data as VisitRating[],
    }
  }

  const { data, isLoading } = useSWR("burger-data", fetcher, {
    refreshInterval: 3000,
  })

  if (!currentUser) return null

  const loloRatings = data?.ratings.filter((r) => r.user_name === "Lolo") || []
  const davidRatings = data?.ratings.filter((r) => r.user_name === "David") || []

  const calculateAverage = (ratings: VisitRating[]) => {
    if (ratings.length === 0) return 0
    const sum = ratings.reduce((acc, r) => {
      const baseRating = (r.meat_rating + r.cheese_rating + r.juiciness_rating + r.bread_rating + r.sauce_rating) / 5
      if (r.fries_rating) {
        return acc + (baseRating * 5 + r.fries_rating) / 6
      }
      return acc + baseRating
    }, 0)
    return sum / ratings.length
  }

  const loloAvg = calculateAverage(loloRatings)
  const davidAvg = calculateAverage(davidRatings)

  const calculateCategoryAverages = (ratings: VisitRating[]) => {
    if (ratings.length === 0) return { Carne: 0, Queso: 0, Jugosidad: 0, Pan: 0, Salsa: 0, Patatas: 0 }

    const totals = ratings.reduce(
      (acc, r) => ({
        Carne: acc.Carne + r.meat_rating,
        Queso: acc.Queso + r.cheese_rating,
        Jugosidad: acc.Jugosidad + r.juiciness_rating,
        Pan: acc.Pan + r.bread_rating,
        Salsa: acc.Salsa + r.sauce_rating,
        Patatas: acc.Patatas + (r.fries_rating || 0),
      }),
      { Carne: 0, Queso: 0, Jugosidad: 0, Pan: 0, Salsa: 0, Patatas: 0 },
    )

    const friesCount = ratings.filter((r) => r.fries_rating).length

    return {
      Carne: totals.Carne / ratings.length,
      Queso: totals.Queso / ratings.length,
      Jugosidad: totals.Jugosidad / ratings.length,
      Pan: totals.Pan / ratings.length,
      Salsa: totals.Salsa / ratings.length,
      Patatas: friesCount > 0 ? totals.Patatas / friesCount : 0,
    }
  }

  const loloCategories = calculateCategoryAverages(loloRatings)
  const davidCategories = calculateCategoryAverages(davidRatings)

  const topRestaurants = (data?.restaurants || [])
    .map((restaurant) => {
      const restaurantVisits = data?.visits.filter((v) => v.restaurant_id === restaurant.id) || []
      const visitIds = restaurantVisits.map((v) => v.id)
      const restaurantRatings = data?.ratings.filter((r) => visitIds.includes(r.visit_id)) || []
      const avg = calculateAverage(restaurantRatings)
      const uniqueBurgers = new Set(restaurantRatings.map((r) => r.burger_id)).size
      return { restaurant, avg, visitsCount: restaurantVisits.length, uniqueBurgers }
    })
    .filter((item) => item.visitsCount > 0)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3)

  const topBurgers = (data?.burgers || [])
    .map((burger) => {
      const burgerRatings = data?.ratings.filter((r) => r.burger_id === burger.id) || []
      const restaurant = data?.restaurants.find((r) => r.id === burger.restaurant_id)
      const avg = calculateAverage(burgerRatings)
      return { burger, restaurant, avg, ratingsCount: burgerRatings.length }
    })
    .filter((item) => item.ratingsCount > 0)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3)

  const calculateStreak = () => {
    if (!data?.visits || data.visits.length === 0) return 0

    const sortedDates = [...new Set(data.visits.map((v) => new Date(v.visit_date).toDateString()))].sort(
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

  const totalVisits = data?.visits.length || 0
  const totalRatings = data?.ratings.length || 0
  const totalRestaurants = data?.restaurants.length || 0
  const totalUniqueBurgers = new Set(data?.ratings.map((r) => r.burger_id)).size
  const overallAvg = calculateAverage(data?.ratings || [])

  const categories = ["Carne", "Queso", "Jugosidad", "Pan", "Salsa", "Patatas"]
  const categoryEmojis = {
    Carne: "🥩",
    Queso: "🧀",
    Jugosidad: "💧",
    Pan: "🍞",
    Salsa: "🥫",
    Patatas: "🍟",
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-r from-primary via-secondary to-accent rounded-b-[2rem] shadow-2xl p-6 pb-8">
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
        <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-foreground font-bold text-xl">Estadísticas Conjuntas</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted rounded-xl p-4 border border-border">
              <p className="text-muted-foreground text-xs mb-1">Total Visitas</p>
              <p className="text-foreground text-3xl font-bold">{totalVisits}</p>
            </div>
            <div className="bg-muted rounded-xl p-4 border border-border">
              <p className="text-muted-foreground text-xs mb-1">Hamburguesas Probadas</p>
              <p className="text-foreground text-3xl font-bold">{totalUniqueBurgers}</p>
            </div>
            <div className="bg-muted rounded-xl p-4 border border-border">
              <p className="text-muted-foreground text-xs mb-1">Restaurantes</p>
              <p className="text-foreground text-3xl font-bold">{totalRestaurants}</p>
            </div>
            <div className="bg-muted rounded-xl p-4 border border-border">
              <p className="text-muted-foreground text-xs mb-1">Nota Media Global</p>
              <p className="text-foreground text-3xl font-bold">{overallAvg.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-foreground font-bold text-xl">Top 3 Restaurantes</h2>
          </div>

          {topRestaurants.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay suficientes valoraciones aún</p>
          ) : (
            <div className="flex items-end justify-center gap-2 mb-6">
              {/* Second place */}
              {topRestaurants[1] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center mb-2 shadow-lg">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <div className="w-full bg-gradient-to-t from-gray-700 to-gray-600 rounded-t-xl p-3 h-28 flex flex-col items-center justify-center">
                    <p className="text-white font-bold text-sm text-center line-clamp-2 mb-1">
                      {topRestaurants[1].restaurant.name}
                    </p>
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-white text-xs font-bold">{topRestaurants[1].avg.toFixed(1)}</span>
                    </div>
                    <p className="text-white/70 text-[10px]">
                      {topRestaurants[1].visitsCount} visitas · {topRestaurants[1].uniqueBurgers} burgers
                    </p>
                  </div>
                </div>
              )}

              {/* First place */}
              {topRestaurants[0] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-2 shadow-2xl animate-pulse">
                    <Trophy className="h-10 w-10 text-white" />
                  </div>
                  <div className="w-full bg-gradient-to-t from-yellow-600 to-yellow-500 rounded-t-xl p-3 h-36 flex flex-col items-center justify-center">
                    <p className="text-white font-bold text-base text-center line-clamp-2 mb-1">
                      {topRestaurants[0].restaurant.name}
                    </p>
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-4 w-4 text-white fill-white" />
                      <span className="text-white text-sm font-bold">{topRestaurants[0].avg.toFixed(1)}</span>
                    </div>
                    <p className="text-white/80 text-xs">
                      {topRestaurants[0].visitsCount} visitas · {topRestaurants[0].uniqueBurgers} burgers
                    </p>
                  </div>
                </div>
              )}

              {/* Third place */}
              {topRestaurants[2] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-2 shadow-lg">
                    <span className="text-xl font-bold text-white">3</span>
                  </div>
                  <div className="w-full bg-gradient-to-t from-orange-700 to-orange-600 rounded-t-xl p-3 h-24 flex flex-col items-center justify-center">
                    <p className="text-white font-bold text-xs text-center line-clamp-2 mb-1">
                      {topRestaurants[2].restaurant.name}
                    </p>
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-white text-xs font-bold">{topRestaurants[2].avg.toFixed(1)}</span>
                    </div>
                    <p className="text-white/70 text-[10px]">
                      {topRestaurants[2].visitsCount} visitas · {topRestaurants[2].uniqueBurgers} burgers
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-secondary" />
            <h2 className="text-foreground font-bold text-xl">Top 3 Hamburguesas</h2>
          </div>

          {topBurgers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay suficientes valoraciones aún</p>
          ) : (
            <div className="space-y-3">
              {topBurgers.map((item, index) => (
                <div
                  key={item.burger.id}
                  className="bg-muted rounded-xl p-4 border border-border flex items-center gap-4"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0
                        ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                        : index === 1
                          ? "bg-gradient-to-br from-gray-400 to-gray-600"
                          : "bg-gradient-to-br from-orange-400 to-orange-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-bold">{item.burger.name}</p>
                    <p className="text-muted-foreground text-sm">{item.restaurant?.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-primary fill-primary" />
                    <span className="text-foreground font-bold">{item.avg.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-accent" />
            <h2 className="text-foreground font-bold text-xl">Lolo vs David</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
              <p className="text-primary font-bold mb-2">Lolo</p>
              <p className="text-foreground text-3xl font-bold">{loloAvg.toFixed(1)}</p>
              <p className="text-muted-foreground text-xs">{loloRatings.length} reseñas</p>
            </div>
            <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4">
              <p className="text-secondary font-bold mb-2">David</p>
              <p className="text-foreground text-3xl font-bold">{davidAvg.toFixed(1)}</p>
              <p className="text-muted-foreground text-xs">{davidRatings.length} reseñas</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-muted-foreground text-sm font-medium mb-3">Comparación por Categorías</p>
            {categories.map((category) => {
              const loloValue = loloCategories[category as keyof typeof loloCategories]
              const davidValue = davidCategories[category as keyof typeof davidCategories]
              const maxValue = Math.max(loloValue, davidValue, 5)

              if (category === "Patatas" && loloValue === 0 && davidValue === 0) return null

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{categoryEmojis[category as keyof typeof categoryEmojis]}</span>
                      <span className="text-foreground text-sm font-medium">{category}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs w-12">Lolo</span>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(loloValue / maxValue) * 100}%` }}
                        />
                      </div>
                      <span className="text-foreground text-xs font-bold w-8">{loloValue.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-secondary text-xs w-12">David</span>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-secondary to-secondary/80 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(davidValue / maxValue) * 100}%` }}
                        />
                      </div>
                      <span className="text-foreground text-xs font-bold w-8">{davidValue.toFixed(1)}</span>
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

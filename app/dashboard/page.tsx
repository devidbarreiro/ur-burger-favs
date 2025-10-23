"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Flame, Star, TrendingUp, Search, ArrowUpDown, BarChart3, Calendar, Map } from "lucide-react"
import { BurgerCard } from "@/components/burger-card"
import { AddRatingModal } from "@/components/add-rating-modal"
import { BurgerCardSkeleton } from "@/components/burger-card-skeleton"
import { NextAdventureCard } from "@/components/next-adventure-card"
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
}

export default function DashboardPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<"Lolo" | "David" | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterUser, setFilterUser] = useState<"all" | "Lolo" | "David">("all")
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "name">("recent")
  const [isRefreshing, setIsRefreshing] = useState(false)
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
    const [placesRes, ratingsRes, adventureRes] = await Promise.all([
      supabase.from("burger_places").select("*").order("created_at", { ascending: false }),
      supabase.from("ratings").select("*"),
      supabase.from("next_adventure").select("*").single(),
    ])

    if (placesRes.error) throw placesRes.error
    if (ratingsRes.error) throw ratingsRes.error

    return {
      places: placesRes.data as BurgerPlace[],
      ratings: ratingsRes.data as Rating[],
      nextAdventure: adventureRes.data as {
        id: string
        place_name: string
        latitude: number | null
        longitude: number | null
        address: string | null
        updated_at: string
        updated_by: string
      } | null,
    }
  }

  const { data, mutate, isLoading } = useSWR("burger-data", fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  useEffect(() => {
    let startY = 0
    let currentY = 0

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY
      const diff = currentY - startY

      if (diff > 100 && window.scrollY === 0) {
        handleRefresh()
      }
    }

    window.addEventListener("touchstart", handleTouchStart)
    window.addEventListener("touchmove", handleTouchMove)

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
    }
  }, [])

  const stats = useMemo(() => {
    if (!data || !currentUser) return { totalReviews: 0, avgRating: 0, favoriteCategory: "Carne" }

    const totalReviews = data.places.length
    const userRatings = data.ratings.filter((r) => r.user_name === currentUser)

    const avgRating =
      userRatings.length > 0
        ? userRatings.reduce((sum, r) => {
            const avg = (r.meat_rating + r.cheese_rating + r.juiciness_rating + r.bread_rating + r.sauce_rating) / 5
            return sum + avg
          }, 0) / userRatings.length
        : 0

    const categoryAverages = {
      Carne: 0,
      Queso: 0,
      Jugosidad: 0,
      Pan: 0,
      Salsa: 0,
    }

    if (userRatings.length > 0) {
      userRatings.forEach((r) => {
        categoryAverages.Carne += r.meat_rating
        categoryAverages.Queso += r.cheese_rating
        categoryAverages.Jugosidad += r.juiciness_rating
        categoryAverages.Pan += r.bread_rating
        categoryAverages.Salsa += r.sauce_rating
      })

      Object.keys(categoryAverages).forEach((key) => {
        categoryAverages[key as keyof typeof categoryAverages] /= userRatings.length
      })
    }

    const favoriteCategory = Object.entries(categoryAverages).reduce((a, b) =>
      categoryAverages[a[0] as keyof typeof categoryAverages] > categoryAverages[b[0] as keyof typeof categoryAverages]
        ? a
        : b,
    )[0]

    return { totalReviews, avgRating, favoriteCategory }
  }, [data, currentUser])

  const daysSinceLastJointReview = useMemo(() => {
    if (!data || data.places.length === 0) return null

    const placesWithBothRatings = data.places.filter((place) => {
      const placeRatings = data.ratings.filter((r) => r.burger_place_id === place.id)
      const hasLolo = placeRatings.some((r) => r.user_name === "Lolo")
      const hasDavid = placeRatings.some((r) => r.user_name === "David")
      return hasLolo && hasDavid
    })

    if (placesWithBothRatings.length === 0) return null

    const mostRecent = placesWithBothRatings.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0]

    const daysDiff = Math.floor((Date.now() - new Date(mostRecent.created_at).getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff
  }, [data])

  const filteredPlaces = useMemo(() => {
    let places = data?.places || []

    if (searchQuery) {
      places = places.filter((place) => place.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (filterUser !== "all") {
      places = places.filter((place) => {
        const placeRatings = data?.ratings.filter((r) => r.burger_place_id === place.id) || []
        return placeRatings.some((r) => r.user_name === filterUser)
      })
    }

    return [...places].sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      } else if (sortBy === "rating") {
        const aRatings = data?.ratings.filter((r) => r.burger_place_id === a.id) || []
        const bRatings = data?.ratings.filter((r) => r.burger_place_id === b.id) || []

        const aAvg =
          aRatings.length > 0
            ? aRatings.reduce((sum, r) => {
                return (
                  sum + (r.meat_rating + r.cheese_rating + r.juiciness_rating + r.bread_rating + r.sauce_rating) / 5
                )
              }, 0) / aRatings.length
            : 0

        const bAvg =
          bRatings.length > 0
            ? bRatings.reduce((sum, r) => {
                return (
                  sum + (r.meat_rating + r.cheese_rating + r.juiciness_rating + r.bread_rating + r.sauce_rating) / 5
                )
              }, 0) / bRatings.length
            : 0

        return bAvg - aAvg
      }
      return 0
    })
  }, [data, searchQuery, filterUser, sortBy])

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-20">
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-pink-500 z-50 animate-in fade-in duration-200">
          <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse" />
        </div>
      )}

      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-b-[2rem] shadow-2xl p-6 pb-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push("/")} className="text-left hover:opacity-80 transition-opacity">
            <p className="text-white/90 text-lg mb-1">Hola,</p>
            <h1 className="text-white font-bold text-4xl">{currentUser}</h1>
          </button>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/map")}
              variant="ghost"
              className="text-white hover:bg-white/20 h-10 w-10 p-0 transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <Map className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => router.push("/stats")}
              variant="ghost"
              className="text-white hover:bg-white/20 h-10 w-10 p-0 transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <BarChart3 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div
            className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 hover:bg-white/30 transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "100ms" }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-2 shadow-lg">
              <Star className="w-5 h-5 text-white" />
            </div>
            <p className="text-white text-2xl font-bold">{stats.totalReviews}</p>
            <p className="text-white/80 text-xs">Reseñas</p>
          </div>
          <div
            className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 hover:bg-white/30 transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "200ms" }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-2 shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-white text-2xl font-bold">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "0"}</p>
            <p className="text-white/80 text-xs">Nota media</p>
          </div>
          <div
            className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 hover:bg-white/30 transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "300ms" }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center mb-2 shadow-lg">
              <span className="text-lg">
                {stats.favoriteCategory === "Carne"
                  ? "🥩"
                  : stats.favoriteCategory === "Queso"
                    ? "🧀"
                    : stats.favoriteCategory === "Jugosidad"
                      ? "💧"
                      : stats.favoriteCategory === "Pan"
                        ? "🍞"
                        : "🥫"}
              </span>
            </div>
            <p className="text-white text-xl font-bold">{stats.favoriteCategory}</p>
            <p className="text-white/80 text-[10px] leading-tight">Lo que más te gusta</p>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6">
        {!isLoading && data && data.places.length > 0 && (
          <div className="space-y-4 mb-6">
            <NextAdventureCard
              placeName={data.nextAdventure?.place_name || ""}
              latitude={data.nextAdventure?.latitude || null}
              longitude={data.nextAdventure?.longitude || null}
              address={data.nextAdventure?.address || null}
              currentUser={currentUser}
              onUpdate={() => mutate()}
            />

            {daysSinceLastJointReview !== null && daysSinceLastJointReview > 0 && (
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/30 backdrop-blur-sm animate-in fade-in duration-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      Hace {daysSinceLastJointReview} {daysSinceLastJointReview === 1 ? "día" : "días"}
                    </p>
                    <p className="text-gray-400 text-xs">que no probáis una hamburguesa juntos</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!isLoading && data && data.places.length > 0 && (
          <div className="mb-6 space-y-3 animate-in fade-in duration-500">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar hamburguesería..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1 flex-1">
                <button
                  onClick={() => setFilterUser("all")}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    filterUser === "all"
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterUser("Lolo")}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    filterUser === "Lolo" ? "bg-pink-500 text-white shadow-lg" : "text-gray-400 hover:text-pink-400"
                  }`}
                >
                  Lolo
                </button>
                <button
                  onClick={() => setFilterUser("David")}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    filterUser === "David" ? "bg-blue-500 text-white shadow-lg" : "text-gray-400 hover:text-blue-400"
                  }`}
                >
                  David
                </button>
              </div>

              <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
                <button
                  onClick={() => setSortBy(sortBy === "recent" ? "rating" : sortBy === "rating" ? "name" : "recent")}
                  className="px-3 py-2 rounded-md text-xs font-medium text-white hover:bg-gray-700/50 transition-all flex items-center gap-1"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {sortBy === "recent" ? "Reciente" : sortBy === "rating" ? "Valoración" : "Nombre"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <BurgerCardSkeleton key={i} />
            ))}
          </div>
        ) : data?.places.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-in fade-in duration-700">
            <div className="relative mb-6">
              <Flame className="h-24 w-24 text-orange-500 opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl">🍔</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">No hay valoraciones aún</h2>
            <p className="text-gray-400 mb-6 max-w-sm">
              Empieza a valorar tus hamburgueserías favoritas y comparte tu opinión con{" "}
              {currentUser === "Lolo" ? "David" : "Lolo"}
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Añadir primera hamburguesería
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 animate-in fade-in duration-500">
              <h3 className={`text-xl font-bold ${currentUser === "Lolo" ? "text-pink-400" : "text-blue-400"}`}>
                {filterUser === "all" ? "Todas las Reseñas" : `Reseñas de ${filterUser}`}
                <span className="text-sm font-normal text-gray-400 ml-2">({filteredPlaces.length})</span>
              </h3>
            </div>

            {filteredPlaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-6">
                <Search className="h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No se encontraron resultados</h3>
                <p className="text-gray-400">Intenta con otra búsqueda o filtro</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredPlaces.map((place, index) => {
                  const placeRatings = data.ratings.filter((r) => r.burger_place_id === place.id)
                  const loloRating = placeRatings.find((r) => r.user_name === "Lolo")
                  const davidRating = placeRatings.find((r) => r.user_name === "David")

                  return (
                    <div key={place.id} className="stagger-item" style={{ animationDelay: `${index * 50}ms` }}>
                      <BurgerCard
                        place={place}
                        loloRating={loloRating}
                        davidRating={davidRating}
                        currentUser={currentUser}
                        onUpdate={() => mutate()}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white animate-in zoom-in duration-500 button-press"
        style={{ animationDelay: "600ms" }}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <AddRatingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={currentUser}
        onSuccess={() => mutate()}
      />
    </div>
  )
}

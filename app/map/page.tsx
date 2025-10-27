"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MapPin, Star, Search, Map, Phone, Globe, Clock, Euro } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { getGoogleMapsConfig } from "@/app/actions/maps"
import { toast } from "sonner"
import type { google } from "google-maps"

interface Restaurant {
  id: string
  name: string
  image_url: string
  latitude: number
  longitude: number
  address: string
  avg_rating: number
  visit_count: number
}

interface NextAdventure {
  place_name: string
  latitude: number | null
  longitude: number | null
  address: string | null
}

interface NearbyPlace {
  place_id: string
  name: string
  address: string
  phone?: string
  website?: string
  opening_hours?: {
    open_now: boolean
    weekday_text: string[]
  }
  price_level?: number
  rating?: number
  user_ratings_total?: number
  latitude: number
  longitude: number
  photo_reference?: string
}

type ViewMode = "explore" | "our-map"

export default function MapPage() {
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("our-map")
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [nextAdventure, setNextAdventure] = useState<NextAdventure | null>(null)
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [selectedNearbyPlace, setSelectedNearbyPlace] = useState<NearbyPlace | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingNearby, setIsLoadingNearby] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    loadRestaurants()
    loadNextAdventure()
    loadGoogleMapsScript()
    getUserLocation()
  }, [])

  useEffect(() => {
    if (viewMode === "our-map" && (restaurants.length > 0 || nextAdventure) && scriptLoaded && !map && mapRef.current) {
      initOurMap()
    } else if (viewMode === "explore" && scriptLoaded && !map && mapRef.current) {
      initExploreMap()
    }
  }, [restaurants, nextAdventure, scriptLoaded, map, viewMode])

  useEffect(() => {
    if (viewMode === "explore" && userLocation && nearbyPlaces.length === 0) {
      loadNearbyPlaces()
    }
  }, [viewMode, userLocation])

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            toast.info("Usando ubicación por defecto", {
              description: "Activa la ubicación para ver hamburgueserías cerca de ti",
            })
          }
          setUserLocation({ lat: 40.4168, lng: -3.7038 })
        },
      )
    } else {
      toast.info("Geolocalización no disponible", {
        description: "Usando ubicación por defecto (Madrid)",
      })
      setUserLocation({ lat: 40.4168, lng: -3.7038 })
    }
  }

  const loadNearbyPlaces = async () => {
    if (!userLocation) return

    setIsLoadingNearby(true)
    try {
      const response = await fetch(`/api/places/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5000`)
      const data = await response.json()

      if (data.places) {
        const sortedPlaces = data.places.sort((a: NearbyPlace, b: NearbyPlace) => {
          return (b.rating || 0) - (a.rating || 0)
        })
        setNearbyPlaces(sortedPlaces)
      }
    } catch (error) {
      console.error("[v0] Error loading nearby places:", error)
    } finally {
      setIsLoadingNearby(false)
    }
  }

  const loadGoogleMapsScript = async () => {
    if (typeof window !== "undefined" && (window as any).google) {
      setScriptLoaded(true)
      return
    }

    try {
      const config = await getGoogleMapsConfig()

      const script = document.createElement("script")
      script.src = config.scriptUrl
      script.async = true
      script.defer = true
      script.onload = () => setScriptLoaded(true)
      script.onerror = () => console.error("[v0] Error loading Google Maps script")
      document.head.appendChild(script)
    } catch (error) {
      console.error("[v0] Error loading Google Maps config:", error)
    }
  }

  const loadRestaurants = async () => {
    const supabase = createBrowserClient()

    const { data: restaurantsData } = await supabase
      .from("restaurants")
      .select("*")
      .not("latitude", "is", null)
      .not("longitude", "is", null)

    if (restaurantsData) {
      const restaurantsWithRatings = await Promise.all(
        restaurantsData.map(async (restaurant) => {
          // Get all visits to this restaurant
          const { data: visits } = await supabase
            .from("visits")
            .select(`
              id,
              visit_ratings (
                meat_rating,
                cheese_rating,
                juiciness_rating,
                bread_rating,
                sauce_rating,
                fries_rating
              )
            `)
            .eq("restaurant_id", restaurant.id)

          let totalRating = 0
          let ratingCount = 0

          if (visits) {
            visits.forEach((visit: any) => {
              if (visit.visit_ratings) {
                visit.visit_ratings.forEach((rating: any) => {
                  const sum =
                    rating.meat_rating +
                    rating.cheese_rating +
                    rating.juiciness_rating +
                    rating.bread_rating +
                    rating.sauce_rating +
                    (rating.fries_rating || 0)
                  const count = rating.fries_rating ? 6 : 5
                  totalRating += sum / count
                  ratingCount++
                })
              }
            })
          }

          const avgRating = ratingCount > 0 ? totalRating / ratingCount : 0

          return {
            ...restaurant,
            avg_rating: avgRating,
            visit_count: visits?.length || 0,
          }
        }),
      )

      setRestaurants(restaurantsWithRatings)
    }
    setIsLoading(false)
  }

  const loadNextAdventure = async () => {
    const supabase = createBrowserClient()
    const { data } = await supabase.from("next_adventure").select("*").single()

    if (data && data.place_name && data.latitude && data.longitude) {
      setNextAdventure(data)
    }
  }

  const initOurMap = () => {
    if (!mapRef.current) return
    if (restaurants.length === 0 && !nextAdventure) return
    if (!(window as any).google) return

    const center =
      nextAdventure?.latitude && nextAdventure?.longitude
        ? { lat: nextAdventure.latitude, lng: nextAdventure.longitude }
        : restaurants.length > 0
          ? { lat: restaurants[0].latitude, lng: restaurants[0].longitude }
          : { lat: 40.4168, lng: -3.7038 }

    const mapInstance = new (window as any).google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      styles: [
        { featureType: "all", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
        { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
        { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f0f1e" }] },
      ],
    })

    setMap(mapInstance)

    if (nextAdventure?.latitude && nextAdventure?.longitude) {
      const nextMarker = new (window as any).google.maps.Marker({
        position: { lat: nextAdventure.latitude, lng: nextAdventure.longitude },
        map: mapInstance,
        title: nextAdventure.place_name,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#f97316",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        animation: (window as any).google.maps.Animation.BOUNCE,
      })

      nextMarker.addListener("click", () => {
        alert(`Próxima aventura: ${nextAdventure.place_name}`)
      })
    }

    restaurants.forEach((restaurant) => {
      const marker = new (window as any).google.maps.Marker({
        position: { lat: restaurant.latitude, lng: restaurant.longitude },
        map: mapInstance,
        title: restaurant.name,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#ec4899",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      })

      marker.addListener("click", () => {
        setSelectedRestaurant(restaurant)
        mapInstance.panTo({ lat: restaurant.latitude, lng: restaurant.longitude })
      })
    })
  }

  const initExploreMap = () => {
    if (!mapRef.current || !userLocation) return
    if (!(window as any).google) return

    const mapInstance = new (window as any).google.maps.Map(mapRef.current, {
      center: userLocation,
      zoom: 13,
      styles: [
        { featureType: "all", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
        { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
        { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f0f1e" }] },
      ],
    })

    setMap(mapInstance)
    ;new (window as any).google.maps.Marker({
      position: userLocation,
      map: mapInstance,
      title: "Tu ubicación",
      icon: {
        path: (window as any).google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    })

    nearbyPlaces.forEach((place) => {
      const marker = new (window as any).google.maps.Marker({
        position: { lat: place.latitude, lng: place.longitude },
        map: mapInstance,
        title: place.name,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#10b981",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      })

      marker.addListener("click", () => {
        setSelectedNearbyPlace(place)
        mapInstance.panTo({ lat: place.latitude, lng: place.longitude })
      })
    })
  }

  const switchView = (mode: ViewMode) => {
    setViewMode(mode)
    setMap(null)
    setSelectedRestaurant(null)
    setSelectedNearbyPlace(null)
  }

  const getPriceLevel = (level?: number) => {
    if (!level) return "No disponible"
    return "€".repeat(level)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Cargando mapa...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4 mb-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">
                {viewMode === "our-map" ? "Nuestro Mapa" : "Explorar Cerca"}
              </h1>
              <p className="text-sm text-gray-400">
                {viewMode === "our-map"
                  ? `${restaurants.length} restaurantes explorados`
                  : `${nearbyPlaces.length} hamburgueserías cercanas`}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => switchView("our-map")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === "our-map" ? "bg-pink-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              <Map className="w-4 h-4" />
              Nuestro Mapa
            </button>
            <button
              onClick={() => switchView("explore")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === "explore" ? "bg-green-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              <Search className="w-4 h-4" />
              Explorar
            </button>
          </div>

          {viewMode === "our-map" && (
            <div className="flex gap-3 text-xs mt-3">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                <span className="text-gray-400">Visitadas</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-gray-400">Próxima</span>
              </div>
            </div>
          )}
          {viewMode === "explore" && (
            <div className="flex gap-3 text-xs mt-3">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-400">Tu ubicación</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-400">Hamburgueserías</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative h-[calc(100vh-160px)]">
        <div ref={mapRef} className="w-full h-full" />

        {viewMode === "explore" && isLoadingNearby && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
            <div className="text-white">Buscando hamburgueserías cercanas...</div>
          </div>
        )}

        {viewMode === "our-map" && selectedRestaurant && (
          <div className="absolute bottom-4 left-4 right-4 bg-gray-900 border border-white/10 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex gap-4">
              <img
                src={selectedRestaurant.image_url || "/placeholder.svg"}
                alt={selectedRestaurant.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h3 className="text-white font-bold">{selectedRestaurant.name}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-400 line-clamp-1">{selectedRestaurant.address}</p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-bold text-white">{selectedRestaurant.avg_rating.toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-gray-400">{selectedRestaurant.visit_count} visitas</span>
                </div>
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors self-start"
              >
                Ver
              </button>
            </div>
          </div>
        )}

        {viewMode === "explore" && selectedNearbyPlace && (
          <div className="absolute bottom-4 left-4 right-4 bg-gray-900 border border-white/10 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">{selectedNearbyPlace.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedNearbyPlace.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-white">{selectedNearbyPlace.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">
                          ({selectedNearbyPlace.user_ratings_total} reseñas)
                        </span>
                      </div>
                    )}
                    {selectedNearbyPlace.price_level && (
                      <div className="flex items-center gap-1">
                        <Euro className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-300">{getPriceLevel(selectedNearbyPlace.price_level)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNearbyPlace(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300">{selectedNearbyPlace.address}</p>
              </div>

              {selectedNearbyPlace.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a href={`tel:${selectedNearbyPlace.phone}`} className="text-sm text-blue-400 hover:underline">
                    {selectedNearbyPlace.phone}
                  </a>
                </div>
              )}

              {selectedNearbyPlace.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a
                    href={selectedNearbyPlace.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline truncate"
                  >
                    Sitio web
                  </a>
                </div>
              )}

              {selectedNearbyPlace.opening_hours && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span
                      className={`text-sm font-medium ${selectedNearbyPlace.opening_hours.open_now ? "text-green-400" : "text-red-400"}`}
                    >
                      {selectedNearbyPlace.opening_hours.open_now ? "Abierto ahora" : "Cerrado"}
                    </span>
                  </div>
                  {selectedNearbyPlace.opening_hours.weekday_text && (
                    <div className="ml-6 space-y-1">
                      {selectedNearbyPlace.opening_hours.weekday_text.map((day, index) => (
                        <p key={index} className="text-xs text-gray-400">
                          {day}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MapPin, Star } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { getGoogleMapsConfig } from "@/app/actions/maps"
import type { google } from "google-maps"

interface BurgerPlace {
  id: string
  name: string
  image_url: string
  latitude: number
  longitude: number
  address: string
  avg_rating: number
}

interface NextAdventure {
  place_name: string
  latitude: number | null
  longitude: number | null
  address: string | null
}

export default function MapPage() {
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  const [places, setPlaces] = useState<BurgerPlace[]>([])
  const [nextAdventure, setNextAdventure] = useState<NextAdventure | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<BurgerPlace | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    loadPlaces()
    loadNextAdventure()
    loadGoogleMapsScript()
  }, [])

  useEffect(() => {
    if ((places.length > 0 || nextAdventure) && scriptLoaded && !map && mapRef.current) {
      initMap()
    }
  }, [places, nextAdventure, scriptLoaded, map])

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

  const loadPlaces = async () => {
    const supabase = createBrowserClient()

    const { data: burgerPlaces } = await supabase
      .from("burger_places")
      .select("*")
      .not("latitude", "is", null)
      .not("longitude", "is", null)

    if (burgerPlaces) {
      const placesWithRatings = await Promise.all(
        burgerPlaces.map(async (place) => {
          const { data: ratings } = await supabase.from("ratings").select("*").eq("burger_place_id", place.id)

          const avgRating =
            ratings && ratings.length > 0
              ? ratings.reduce((sum, r) => {
                  const avg =
                    (r.meat_rating + r.cheese_rating + r.juiciness_rating + r.bread_rating + r.sauce_rating) / 5
                  return sum + avg
                }, 0) / ratings.length
              : 0

          return {
            ...place,
            avg_rating: avgRating,
          }
        }),
      )

      setPlaces(placesWithRatings)
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

  const initMap = () => {
    if (!mapRef.current) {
      console.error("[v0] Map container not found")
      return
    }
    if (places.length === 0 && !nextAdventure) return
    if (!(window as any).google) return

    const center =
      nextAdventure?.latitude && nextAdventure?.longitude
        ? { lat: nextAdventure.latitude, lng: nextAdventure.longitude }
        : places.length > 0
          ? { lat: places[0].latitude, lng: places[0].longitude }
          : { lat: 40.4168, lng: -3.7038 } // Madrid default

    const mapInstance = new (window as any).google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      styles: [
        {
          featureType: "all",
          elementType: "geometry",
          stylers: [{ color: "#1a1a2e" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.fill",
          stylers: [{ color: "#ffffff" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#1a1a2e" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#0f0f1e" }],
        },
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
          fillColor: "#f97316", // Orange for next adventure
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

    places.forEach((place) => {
      const marker = new (window as any).google.maps.Marker({
        position: { lat: place.latitude, lng: place.longitude },
        map: mapInstance,
        title: place.name,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#ec4899", // Pink for visited places
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      })

      marker.addListener("click", () => {
        setSelectedPlace(place)
        mapInstance.panTo({ lat: place.latitude, lng: place.longitude })
      })
    })
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
        <div className="px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Mapa de Hamburgueserías</h1>
            <p className="text-sm text-gray-400">{places.length} lugares explorados</p>
          </div>
          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              <span className="text-gray-400">Visitadas</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-gray-400">Próxima</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-[calc(100vh-80px)]">
        <div ref={mapRef} className="w-full h-full" />

        {selectedPlace && (
          <div className="absolute bottom-4 left-4 right-4 bg-gray-900 border border-white/10 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex gap-4">
              <img
                src={selectedPlace.image_url || "/placeholder.svg"}
                alt={selectedPlace.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h3 className="text-white font-bold">{selectedPlace.name}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-400 line-clamp-1">{selectedPlace.address}</p>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-bold text-white">{selectedPlace.avg_rating.toFixed(1)}</span>
                </div>
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors"
              >
                Ver
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

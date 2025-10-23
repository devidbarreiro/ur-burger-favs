"use client"

import { useEffect, useRef, useState } from "react"
import { getGoogleMapsConfig } from "@/app/actions/maps"

type LocationMapPreviewProps = {
  latitude: number
  longitude: number
  placeName: string
}

export function LocationMapPreview({ latitude, longitude, placeName }: LocationMapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadMap = async () => {
      try {
        const config = await getGoogleMapsConfig()

        if (!(window as any).google) {
          const script = document.createElement("script")
          script.src = config.scriptUrl
          script.async = true
          script.defer = true
          script.onload = () => setIsLoaded(true)
          document.head.appendChild(script)
        } else {
          setIsLoaded(true)
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error)
      }
    }

    loadMap()
  }, [])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !(window as any).google) return

    const map = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat: latitude, lng: longitude },
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      gestureHandling: "none",
      styles: [
        {
          featureType: "all",
          elementType: "geometry",
          stylers: [{ color: "#242f3e" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#242f3e" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.fill",
          stylers: [{ color: "#746855" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#17263c" }],
        },
      ],
    })
    ;new (window as any).google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map: map,
      title: placeName,
      icon: {
        path: (window as any).google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#f97316",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    })
  }, [isLoaded, latitude, longitude, placeName])

  return (
    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-700/50 bg-gray-800">
      <div ref={mapRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-sm text-gray-400">Cargando mapa...</div>
        </div>
      )}
    </div>
  )
}

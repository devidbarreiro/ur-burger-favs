"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Loader2 } from "lucide-react"

interface PlaceResult {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
}

interface GooglePlacesAutocompleteProps {
  onPlaceSelect: (place: PlaceResult) => void
  value: string
  onChange: (value: string) => void
}

export function GooglePlacesAutocomplete({ onPlaceSelect, value, onChange }: GooglePlacesAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout>()

  const safeValue = value || ""

  useEffect(() => {
    if (safeValue.length < 3) {
      setSuggestions([])
      return
    }

    // Debounce search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/places/search?query=${encodeURIComponent(safeValue)}`)
        const data = await response.json()
        setSuggestions(data.results || [])
        setShowSuggestions(true)
      } catch (error) {
        console.error("[v0] Error searching places:", error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [safeValue])

  const handleSelectPlace = (place: PlaceResult) => {
    onChange(place.name)
    onPlaceSelect(place)
    setShowSuggestions(false)
    setSuggestions([])
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar hamburguesería..."
          className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500 animate-spin" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-900 border border-white/10 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {suggestions.map((place) => (
            <button
              key={place.place_id}
              onClick={() => handleSelectPlace(place)}
              className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-pink-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{place.name}</p>
                  <p className="text-xs text-gray-400 truncate">{place.formatted_address}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && !isLoading && safeValue.length >= 3 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-900 border border-white/10 rounded-xl shadow-xl p-4 text-center text-gray-400 text-sm">
          No se encontraron hamburgueserías
        </div>
      )}
    </div>
  )
}

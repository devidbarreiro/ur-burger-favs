"use client"

import { useState } from "react"
import { MapPin, Edit2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { GooglePlacesAutocomplete } from "./google-places-autocomplete"
import { LocationMapPreview } from "./location-map-preview"

type NextAdventureCardProps = {
  placeName: string
  latitude: number | null
  longitude: number | null
  address: string | null
  currentUser: "Lolo" | "David"
  onUpdate: () => void
}

export function NextAdventureCard({
  placeName,
  latitude,
  longitude,
  address,
  currentUser,
  onUpdate,
}: NextAdventureCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [placeData, setPlaceData] = useState<{
    name: string
    latitude: number
    longitude: number
    address: string
    placeId: string
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    if (!placeData) {
      toast.error("Selecciona una hamburguesería")
      return
    }

    setIsSaving(true)
    try {
      const { error: deleteError } = await supabase
        .from("next_adventure")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all rows

      if (deleteError) throw deleteError

      const { error: insertError } = await supabase.from("next_adventure").insert({
        place_name: placeData.name,
        latitude: placeData.latitude,
        longitude: placeData.longitude,
        address: placeData.address,
        place_id: placeData.placeId,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      })

      if (insertError) throw insertError

      toast.success("Próxima aventura actualizada")
      setIsEditing(false)
      setPlaceData(null)
      onUpdate()
    } catch (error) {
      console.error("Error updating next adventure:", error)
      toast.error("Error al actualizar")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setPlaceData(null)
    setSearchValue("")
    setIsEditing(false)
  }

  if (!placeName && !isEditing) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 shadow-xl animate-in fade-in duration-500">
        <div className="flex flex-col items-center justify-center text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Próxima Aventura</h3>
          <p className="text-gray-400 text-sm mb-4 max-w-xs">
            ¿Dónde queréis probar vuestra próxima hamburguesa juntos?
          </p>
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg transition-all duration-300 hover:scale-105"
          >
            Elegir sitio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl p-6 border border-orange-500/30 shadow-xl backdrop-blur-sm animate-in fade-in duration-500">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Próxima Aventura</h3>
            <p className="text-xs text-gray-400">Hamburguesería pendiente</p>
          </div>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="ghost"
            size="sm"
            className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 h-8 w-8 p-0"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <GooglePlacesAutocomplete
            value={searchValue}
            onChange={setSearchValue}
            onPlaceSelect={(place) => {
              setPlaceData({
                name: place.name,
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
                address: place.formatted_address,
                placeId: place.place_id,
              })
            }}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || !placeData}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              <Check className="h-4 w-4 mr-1" />
              Guardar
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isSaving}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
            <p className="text-white font-semibold text-lg">{placeName}</p>
            {address && <p className="text-gray-400 text-xs mt-1">{address}</p>}
            <p className="text-gray-400 text-xs mt-1">¡A por ella! 🍔</p>
          </div>
          {latitude && longitude && (
            <LocationMapPreview latitude={latitude} longitude={longitude} placeName={placeName} />
          )}
        </div>
      )}
    </div>
  )
}

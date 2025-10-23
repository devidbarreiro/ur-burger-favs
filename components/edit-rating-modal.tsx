"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { StarRating } from "./star-rating"
import { GooglePlacesAutocomplete } from "./google-places-autocomplete"
import Image from "next/image"
import { Trash2, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { LocationMapPreview } from "./location-map-preview"

type Rating = {
  id: string
  burger_place_id: string
  user_name: string
  meat_rating: number
  cheese_rating: number
  juiciness_rating: number
  bread_rating: number
  sauce_rating: number
  comment?: string | null
  price?: number | null
}

type BurgerPlace = {
  id: string
  name: string
  image_url: string
  created_by: string
  created_at: string
  place_id?: string
  latitude?: number
  longitude?: number
  address?: string
}

type EditRatingModalProps = {
  isOpen: boolean
  onClose: () => void
  place: BurgerPlace
  currentUser: "Lolo" | "David"
  existingRating?: Rating
  onSuccess: () => void
}

export function EditRatingModal({
  isOpen,
  onClose,
  place,
  currentUser,
  existingRating,
  onSuccess,
}: EditRatingModalProps) {
  const [ratings, setRatings] = useState({
    meat: 0,
    cheese: 0,
    juiciness: 0,
    bread: 0,
    sauce: 0,
  })
  const [comment, setComment] = useState("")
  const [placeName, setPlaceName] = useState(place.name)
  const [placeData, setPlaceData] = useState<{
    place_id?: string
    lat?: number
    lng?: number
    address?: string
  }>({})
  const [price, setPrice] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fullPlaceData, setFullPlaceData] = useState<BurgerPlace | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchPlaceData = async () => {
      const { data } = await supabase.from("burger_places").select("*").eq("id", place.id).single()

      if (data) {
        setFullPlaceData(data)
      }
    }

    if (isOpen) {
      fetchPlaceData()
    }
  }, [isOpen, place.id, supabase])

  useEffect(() => {
    if (existingRating) {
      setRatings({
        meat: existingRating.meat_rating,
        cheese: existingRating.cheese_rating,
        juiciness: existingRating.juiciness_rating,
        bread: existingRating.bread_rating,
        sauce: existingRating.sauce_rating,
      })
      setComment(existingRating.comment || "")
      setPrice(existingRating.price?.toString() || "")
    } else {
      setRatings({ meat: 0, cheese: 0, juiciness: 0, bread: 0, sauce: 0 })
      setComment("")
      setPrice("")
    }
    setPlaceName(place.name)
    setPlaceData({})
  }, [existingRating, isOpen, place.name])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (placeName !== place.name || placeData.place_id) {
        const updateData: any = {
          name: placeName,
        }

        if (placeData.place_id) {
          updateData.place_id = placeData.place_id
          updateData.latitude = placeData.lat
          updateData.longitude = placeData.lng
          updateData.address = placeData.address
        }

        const { error: placeError } = await supabase.from("burger_places").update(updateData).eq("id", place.id)

        if (placeError) throw placeError
      }

      if (existingRating) {
        const { error: updateError } = await supabase
          .from("ratings")
          .update({
            meat_rating: ratings.meat,
            cheese_rating: ratings.cheese,
            juiciness_rating: ratings.juiciness,
            bread_rating: ratings.bread,
            sauce_rating: ratings.sauce,
            comment: comment || null,
            price: price ? Number.parseFloat(price) : null,
          })
          .eq("id", existingRating.id)

        if (updateError) throw updateError

        toast.success("¡Valoración actualizada!", {
          description: `Tu reseña de ${placeName} ha sido actualizada`,
        })
      } else {
        const { error: insertError } = await supabase.from("ratings").insert({
          burger_place_id: place.id,
          user_name: currentUser,
          meat_rating: ratings.meat,
          cheese_rating: ratings.cheese,
          juiciness_rating: ratings.juiciness,
          bread_rating: ratings.bread,
          sauce_rating: ratings.sauce,
          comment: comment || null,
          price: price ? Number.parseFloat(price) : null,
        })

        if (insertError) throw insertError

        toast.success("¡Valoración añadida!", {
          description: `Has valorado ${placeName}`,
        })
      }

      onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al guardar"
      setError(errorMessage)
      toast.error("Error al guardar", {
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!existingRating) return
    if (!confirm("¿Estás seguro de que quieres eliminar esta valoración?")) return

    setIsDeleting(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase.from("ratings").delete().eq("id", existingRating.id)

      if (deleteError) throw deleteError

      toast.success("Valoración eliminada", {
        description: `Tu reseña de ${place.name} ha sido eliminada`,
      })

      onSuccess()
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar"
      setError(errorMessage)
      toast.error("Error al eliminar", {
        description: errorMessage,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-0 text-white shadow-2xl p-0 gap-0 max-h-[95vh] flex flex-col animate-in fade-in zoom-in duration-300">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700/50 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle
                className={`text-2xl font-bold ${currentUser === "Lolo" ? "text-pink-400" : "text-blue-400"}`}
              >
                {existingRating ? "Editar Valoración" : "Añadir Valoración"}
              </DialogTitle>
              <p className="text-sm text-gray-400 mt-1">
                {existingRating ? "Actualiza tu valoración" : "Comparte tu opinión"}
              </p>
            </div>
            {existingRating && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6">
          <div className="py-4 space-y-5">
            <div className="relative aspect-[2/1] rounded-xl overflow-hidden shadow-xl">
              <Image src={place.image_url || "/placeholder.svg"} alt={placeName} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-lg font-bold text-white drop-shadow-lg">{placeName}</h3>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hamburguesería</h4>
              <GooglePlacesAutocomplete
                value={placeName}
                onChange={setPlaceName}
                onPlaceSelect={(place) => {
                  setPlaceName(place.name)
                  setPlaceData({
                    place_id: place.place_id,
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng,
                    address: place.formatted_address,
                  })
                }}
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Precio</h4>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Precio de la hamburguesa (opcional)"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Valora cada aspecto</h4>
              <div className="space-y-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                <StarRating
                  label="🥩 Carne"
                  value={ratings.meat}
                  onChange={(value) => setRatings({ ...ratings, meat: value })}
                />
                <StarRating
                  label="🧀 Queso"
                  value={ratings.cheese}
                  onChange={(value) => setRatings({ ...ratings, cheese: value })}
                />
                <StarRating
                  label="💧 Jugosidad"
                  value={ratings.juiciness}
                  onChange={(value) => setRatings({ ...ratings, juiciness: value })}
                />
                <StarRating
                  label="🍞 Pan"
                  value={ratings.bread}
                  onChange={(value) => setRatings({ ...ratings, bread: value })}
                />
                <StarRating
                  label="🥫 Salsa"
                  value={ratings.sauce}
                  onChange={(value) => setRatings({ ...ratings, sauce: value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Comentario</h4>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cuéntanos más sobre tu experiencia..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2"
              />
            </div>

            {fullPlaceData?.latitude && fullPlaceData?.longitude && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ubicación</h4>
                <LocationMapPreview
                  latitude={fullPlaceData.latitude}
                  longitude={fullPlaceData.longitude}
                  placeName={placeName}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-700/50 shrink-0 bg-gray-900/50">
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 h-11 rounded-xl border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent transition-all"
              disabled={isLoading || isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              className={`flex-1 h-11 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 ${
                currentUser === "Lolo"
                  ? "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-pink-500/30"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30"
              }`}
              disabled={isLoading || isDeleting}
            >
              {isLoading ? "Guardando..." : existingRating ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { StarRating } from "./star-rating"
import Image from "next/image"
import { Upload, Camera, MapPin } from "lucide-react"
import { toast } from "sonner"
import { GooglePlacesAutocomplete } from "./google-places-autocomplete"

type AddRatingModalProps = {
  isOpen: boolean
  onClose: () => void
  currentUser: "Lolo" | "David"
  onSuccess: () => void
}

export function AddRatingModal({ isOpen, onClose, currentUser, onSuccess }: AddRatingModalProps) {
  const [name, setName] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const [location, setLocation] = useState<{
    lat: number
    lng: number
    placeId: string
    address: string
  } | null>(null)
  const [price, setPrice] = useState("")
  const [ratings, setRatings] = useState({
    meat: 0,
    cheese: 0,
    juiciness: 0,
    bread: 0,
    sauce: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!image) {
      setError("La foto es obligatoria")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const fileExt = image.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage.from("burger-images").upload(filePath, image)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("burger-images").getPublicUrl(filePath)

      const { data: placeData, error: placeError } = await supabase
        .from("burger_places")
        .insert({
          name,
          image_url: publicUrl,
          created_by: currentUser,
          latitude: location?.lat || null,
          longitude: location?.lng || null,
          place_id: location?.placeId || null,
          address: location?.address || null,
        })
        .select()
        .single()

      if (placeError) throw placeError

      const { error: ratingError } = await supabase.from("ratings").insert({
        burger_place_id: placeData.id,
        user_name: currentUser,
        meat_rating: ratings.meat,
        cheese_rating: ratings.cheese,
        juiciness_rating: ratings.juiciness,
        bread_rating: ratings.bread,
        sauce_rating: ratings.sauce,
        comment: comment || null,
        price: price ? Number.parseFloat(price) : null,
      })

      if (ratingError) throw ratingError

      toast.success("¡Reseña publicada!", {
        description: `${name} ha sido añadida correctamente`,
      })

      setName("")
      setImage(null)
      setImagePreview(null)
      setComment("")
      setLocation(null)
      setPrice("")
      setRatings({ meat: 0, cheese: 0, juiciness: 0, bread: 0, sauce: 0 })
      onSuccess()
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al guardar"
      setError(errorMessage)
      toast.error("Error al publicar", {
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 to-gray-800 border-0 text-white shadow-2xl animate-in fade-in zoom-in duration-300">
        <DialogHeader className="relative pb-4 border-b border-gray-700">
          <DialogTitle className={`text-2xl font-bold ${currentUser === "Lolo" ? "text-pink-400" : "text-blue-400"}`}>
            Nueva Reseña
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-1">Comparte tu experiencia con una hamburguesa</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-300">Foto de la hamburguesa *</Label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
                id="camera-capture"
              />
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="gallery-upload" />

              {imagePreview ? (
                <div className="relative h-48 border-2 border-gray-600 rounded-2xl overflow-hidden group">
                  <Image src={imagePreview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label
                      htmlFor="camera-capture"
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg cursor-pointer transition-colors flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      <span className="text-sm font-medium">Cámara</span>
                    </label>
                    <label
                      htmlFor="gallery-upload"
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="text-sm font-medium">Galería</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <label
                    htmlFor="camera-capture"
                    className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-600 rounded-2xl cursor-pointer hover:border-orange-500 transition-all duration-300 bg-gray-800/50 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">Hacer foto</span>
                  </label>

                  <label
                    htmlFor="gallery-upload"
                    className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-600 rounded-2xl cursor-pointer hover:border-orange-500 transition-all duration-300 bg-gray-800/50 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">Subir foto</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-300">
              Nombre de la hamburguesería *
            </Label>
            <GooglePlacesAutocomplete
              value={name}
              onChange={setName}
              onPlaceSelect={(place) => {
                setName(place.name)
                setLocation({
                  lat: place.geometry.location.lat,
                  lng: place.geometry.location.lng,
                  placeId: place.place_id,
                  address: place.formatted_address,
                })
              }}
            />
            {location && (
              <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-800/50 p-2 rounded-lg">
                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{location.address}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="price" className="text-sm font-semibold text-gray-300">
              Precio (opcional)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="9.50"
                className="pl-8 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 h-12 rounded-xl text-base"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-semibold text-gray-300 mb-4">Valora cada aspecto</h4>
            <div className="space-y-5 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
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
            <Label htmlFor="comment" className="text-sm font-semibold text-gray-300">
              Comentario (opcional)
            </Label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos más sobre tu experiencia..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 h-12 rounded-xl border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className={`flex-1 h-12 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 ${
                currentUser === "Lolo"
                  ? "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-pink-500/50"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/50"
              }`}
              disabled={isLoading}
            >
              {isLoading ? "Guardando..." : "Publicar Reseña"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

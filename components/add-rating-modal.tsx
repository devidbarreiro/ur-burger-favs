"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { StarRating } from "./star-rating"
import Image from "next/image"
import { Upload, Camera, MapPin, ArrowLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { GooglePlacesAutocomplete } from "./google-places-autocomplete"

type AddRatingModalProps = {
  isOpen: boolean
  onClose: () => void
  currentUser: "Lolo" | "David"
  onSuccess: () => void
  existingVisitId?: string // Allow joining an existing visit
}

export function AddRatingModal({ isOpen, onClose, currentUser, onSuccess, existingVisitId }: AddRatingModalProps) {
  const [step, setStep] = useState<1 | 2>(existingVisitId ? 2 : 1)
  const [visitId, setVisitId] = useState<string | null>(existingVisitId || null)

  // Step 1 state
  const [restaurantName, setRestaurantName] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [location, setLocation] = useState<{
    lat: number
    lng: number
    placeId: string
    address: string
  } | null>(null)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  // Step 2 state
  const [burgerName, setBurgerName] = useState("")
  const [existingBurgers, setExistingBurgers] = useState<Array<{ id: string; name: string }>>([])
  const [selectedBurgerId, setSelectedBurgerId] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const [price, setPrice] = useState("")
  const [ratings, setRatings] = useState({
    meat: 0,
    cheese: 0,
    juiciness: 0,
    bread: 0,
    sauce: 0,
  })
  const [friesRating, setFriesRating] = useState<number | null>(null)
  const [showFries, setShowFries] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (existingVisitId && isOpen) {
      const loadVisitData = async () => {
        setIsLoading(true)
        try {
          console.log("[v0] Loading visit data for:", existingVisitId)

          // Fetch visit with restaurant data
          const { data: visit, error: visitError } = await supabase
            .from("visits")
            .select(`
              id,
              image_url,
              restaurant_id,
              restaurants (
                id,
                name,
                address,
                latitude,
                longitude,
                place_id
              )
            `)
            .eq("id", existingVisitId)
            .single()

          if (visitError) throw visitError
          if (!visit) throw new Error("Visita no encontrada")

          console.log("[v0] Visit data loaded:", visit)

          // Set visit data
          setVisitId(visit.id)
          setRestaurantId(visit.restaurant_id)
          setRestaurantName(visit.restaurants.name)
          setImagePreview(visit.image_url)

          if (visit.restaurants.latitude && visit.restaurants.longitude) {
            setLocation({
              lat: visit.restaurants.latitude,
              lng: visit.restaurants.longitude,
              placeId: visit.restaurants.place_id || "",
              address: visit.restaurants.address || "",
            })
          }

          // Fetch existing burgers for this restaurant
          const { data: burgers } = await supabase
            .from("burgers")
            .select("id, name")
            .eq("restaurant_id", visit.restaurant_id)

          console.log("[v0] Found existing burgers:", burgers?.length || 0)
          setExistingBurgers(burgers || [])
        } catch (err) {
          console.error("[v0] Error loading visit data:", err)
          const errorMessage = err instanceof Error ? err.message : "Error al cargar la visita"
          setError(errorMessage)
          toast.error("Error", { description: errorMessage })
        } finally {
          setIsLoading(false)
        }
      }

      loadVisitData()
    }
  }, [existingVisitId, isOpen])

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

  const handleStep1Submit = async () => {
    console.log("[v0] Step 1 submit - image:", !!image, "restaurantName:", restaurantName, "location:", location)

    if (!image) {
      setError("La foto es obligatoria")
      return
    }
    if (!restaurantName) {
      setError("Selecciona un restaurante")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Upload image
      const fileExt = image.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      console.log("[v0] Uploading image:", filePath)
      const { error: uploadError } = await supabase.storage.from("burger-images").upload(filePath, image)
      if (uploadError) {
        console.error("[v0] Upload error:", uploadError)
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("burger-images").getPublicUrl(filePath)
      console.log("[v0] Image uploaded:", publicUrl)

      // Create or get restaurant
      console.log("[v0] Looking for existing restaurant with place_id:", location?.placeId)
      const { data: existingRestaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("place_id", location?.placeId || "")
        .maybeSingle()

      let finalRestaurantId: string

      if (existingRestaurant) {
        console.log("[v0] Found existing restaurant:", existingRestaurant.id)
        finalRestaurantId = existingRestaurant.id
      } else {
        console.log("[v0] Creating new restaurant:", restaurantName)
        const { data: newRestaurant, error: restaurantError } = await supabase
          .from("restaurants")
          .insert({
            name: restaurantName,
            address: location?.address || null,
            latitude: location?.lat || null,
            longitude: location?.lng || null,
            place_id: location?.placeId || null,
            created_by: currentUser,
          })
          .select()
          .single()

        if (restaurantError) {
          console.error("[v0] Restaurant creation error:", restaurantError)
          throw restaurantError
        }
        console.log("[v0] Restaurant created:", newRestaurant.id)
        finalRestaurantId = newRestaurant.id
      }

      setRestaurantId(finalRestaurantId)

      console.log("[v0] Creating visit for restaurant:", finalRestaurantId)
      const { data: newVisit, error: visitError } = await supabase
        .from("visits")
        .insert({
          restaurant_id: finalRestaurantId,
          image_url: publicUrl,
          created_by: currentUser,
        })
        .select()
        .single()

      if (visitError) {
        console.error("[v0] Visit creation error:", visitError)
        throw visitError
      }
      console.log("[v0] Visit created:", newVisit.id)

      setVisitId(newVisit.id)

      const { data: nextAdventure } = await supabase.from("next_adventure").select("*").limit(1).maybeSingle()

      if (nextAdventure) {
        // Check if the restaurant matches by place_id or name
        const matchesByPlaceId = location?.placeId && nextAdventure.place_id === location.placeId
        const matchesByName =
          !location?.placeId && nextAdventure.place_name?.toLowerCase() === restaurantName.toLowerCase()

        if (matchesByPlaceId || matchesByName) {
          console.log("[v0] Clearing next adventure")
          // Clear next adventure
          await supabase.from("next_adventure").delete().eq("id", nextAdventure.id)

          toast.success("¡Próxima aventura completada!", {
            description: "Habéis visitado el restaurante planeado",
          })
        }
      }

      // Fetch existing burgers for this restaurant
      const { data: burgers } = await supabase.from("burgers").select("id, name").eq("restaurant_id", finalRestaurantId)
      console.log("[v0] Found existing burgers:", burgers?.length || 0)

      setExistingBurgers(burgers || [])

      // Move to step 2
      setStep(2)
      toast.success("Visita creada", {
        description: "Ahora añade tu hamburguesa y valoración",
      })
    } catch (err) {
      console.error("[v0] Error in handleStep1Submit:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al crear visita"
      setError(errorMessage)
      toast.error("Error", { description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] Step 2 submit - burgerName:", burgerName, "visitId:", visitId, "restaurantId:", restaurantId)

    if (!burgerName) {
      setError("Escribe el nombre de la hamburguesa")
      return
    }
    if (!visitId || !restaurantId) {
      setError("Error: falta información de la visita")
      console.error("[v0] Missing data - visitId:", visitId, "restaurantId:", restaurantId)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create or get burger
      let finalBurgerId: string

      if (selectedBurgerId) {
        finalBurgerId = selectedBurgerId
      } else {
        // Check if burger exists
        const { data: existingBurger } = await supabase
          .from("burgers")
          .select("id")
          .eq("restaurant_id", restaurantId)
          .ilike("name", burgerName)
          .single()

        if (existingBurger) {
          finalBurgerId = existingBurger.id
        } else {
          // Create new burger
          const { data: newBurger, error: burgerError } = await supabase
            .from("burgers")
            .insert({
              restaurant_id: restaurantId,
              name: burgerName,
              created_by: currentUser,
            })
            .select()
            .single()

          if (burgerError) throw burgerError
          finalBurgerId = newBurger.id
        }
      }

      // Create rating
      const { error: ratingError } = await supabase.from("visit_ratings").insert({
        visit_id: visitId,
        burger_id: finalBurgerId,
        user_name: currentUser,
        meat_rating: ratings.meat,
        cheese_rating: ratings.cheese,
        juiciness_rating: ratings.juiciness,
        bread_rating: ratings.bread,
        sauce_rating: ratings.sauce,
        fries_rating: friesRating,
        comment: comment || null,
        price: price ? Number.parseFloat(price) : null,
      })

      if (ratingError) throw ratingError

      toast.success("¡Valoración añadida!", {
        description: `${burgerName} ha sido valorada correctamente`,
      })

      // Reset form
      setStep(1)
      setVisitId(null)
      setRestaurantId(null)
      setRestaurantName("")
      setImage(null)
      setImagePreview(null)
      setLocation(null)
      setBurgerName("")
      setSelectedBurgerId(null)
      setExistingBurgers([])
      setComment("")
      setPrice("")
      setRatings({ meat: 0, cheese: 0, juiciness: 0, bread: 0, sauce: 0 })
      setFriesRating(null)
      setShowFries(false)

      onSuccess()
      onClose()
    } catch (err) {
      console.error("[v0] Error in handleStep2Submit:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al guardar"
      setError(errorMessage)
      toast.error("Error al publicar", { description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 2 && !existingVisitId) {
      setStep(1)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border text-foreground shadow-2xl">
        <DialogHeader className="relative pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            {step === 2 && !existingVisitId && (
              <button onClick={handleBack} className="p-2 hover:bg-muted rounded-lg transition-colors" type="button">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex-1">
              <DialogTitle
                className={`text-2xl font-bold ${currentUser === "Lolo" ? "text-primary" : "text-secondary"}`}
              >
                {step === 1 ? "Nueva Visita" : "Añade tu Hamburguesa"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 1 ? "Paso 1: Selecciona el restaurante" : "Paso 2: Valora tu hamburguesa"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-6 pt-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Foto de la hamburguesa *</Label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="hidden"
                  id="camera-capture"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="gallery-upload"
                />

                {imagePreview ? (
                  <div className="relative h-48 border-2 border-border rounded-2xl overflow-hidden group">
                    <Image src={imagePreview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label
                        htmlFor="camera-capture"
                        className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg cursor-pointer transition-colors flex items-center gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        <span className="text-sm font-medium">Cámara</span>
                      </label>
                      <label
                        htmlFor="gallery-upload"
                        className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg cursor-pointer transition-colors flex items-center gap-2"
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
                      className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary transition-all duration-300 bg-muted/50 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-sm font-medium">Hacer foto</span>
                    </label>

                    <label
                      htmlFor="gallery-upload"
                      className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary transition-all duration-300 bg-muted/50 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-sm font-medium">Subir foto</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-semibold">
                Nombre del restaurante *
              </Label>
              <GooglePlacesAutocomplete
                value={restaurantName}
                onChange={setRestaurantName}
                onPlaceSelect={(place) => {
                  setRestaurantName(place.name)
                  setLocation({
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng,
                    placeId: place.place_id,
                    address: place.formatted_address,
                  })
                }}
              />
              {location && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted p-2 rounded-lg">
                  <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{location.address}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 h-12 rounded-xl bg-transparent"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleStep1Submit}
                className={`flex-1 h-12 rounded-xl font-semibold ${
                  currentUser === "Lolo" ? "bg-primary hover:bg-primary/90" : "bg-secondary hover:bg-secondary/90"
                }`}
                disabled={isLoading || !image || !restaurantName}
              >
                {isLoading ? (
                  "Creando..."
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleStep2Submit} className="space-y-6 pt-4">
            {imagePreview && (
              <div className="relative h-32 border-2 border-border rounded-xl overflow-hidden">
                <Image src={imagePreview || "/placeholder.svg"} alt="Visit" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                  <p className="text-white font-semibold">{restaurantName}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="burger" className="text-sm font-semibold">
                Nombre de la hamburguesa *
              </Label>
              <Input
                id="burger"
                value={burgerName}
                onChange={(e) => {
                  setBurgerName(e.target.value)
                  setSelectedBurgerId(null)
                }}
                placeholder="Ej: Cheeseburger Trufada"
                className="h-12 rounded-xl"
                list="existing-burgers"
              />
              {existingBurgers.length > 0 && (
                <datalist id="existing-burgers">
                  {existingBurgers.map((burger) => (
                    <option key={burger.id} value={burger.name} />
                  ))}
                </datalist>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="price" className="text-sm font-semibold">
                Precio (opcional)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="9.50"
                  className="pl-8 h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-semibold mb-4">Valora cada aspecto</h4>
              <div className="space-y-5 bg-muted/50 p-4 rounded-xl border border-border">
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
                {!showFries ? (
                  <button
                    type="button"
                    onClick={() => setShowFries(true)}
                    className="w-full py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">🍟</span>
                    <span className="font-medium">+ Patatas</span>
                  </button>
                ) : (
                  <div className="border-t border-border pt-4">
                    <StarRating
                      label="🍟 Patatas"
                      value={friesRating || 0}
                      onChange={(value) => setFriesRating(value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="comment" className="text-sm font-semibold">
                Comentario (opcional)
              </Label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cuéntanos más sobre tu experiencia..."
                rows={3}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 h-12 rounded-xl bg-transparent"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className={`flex-1 h-12 rounded-xl font-semibold ${
                  currentUser === "Lolo" ? "bg-primary hover:bg-primary/90" : "bg-secondary hover:bg-secondary/90"
                }`}
                disabled={isLoading}
              >
                {isLoading ? "Guardando..." : "Publicar Valoración"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { StarRating } from "./star-rating"

type Restaurant = {
  id: string
  name: string
  address: string | null
  image_url: string | null
}

type Visit = {
  id: string
  restaurant_id: string
  visit_date: string
  image_url: string | null
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
  fries_rating: number | null
  price: number | null
  comment: string | null
  created_at: string
}

type Burger = {
  id: string
  restaurant_id: string
  name: string
  created_at: string
  created_by: string
}

type EditVisitModalProps = {
  isOpen: boolean
  onClose: () => void
  visit: Visit
  restaurant: Restaurant
  loloRatings: VisitRating[]
  davidRatings: VisitRating[]
  burgers: Burger[]
  currentUser: "Lolo" | "David"
  onUpdate: () => void
}

export function EditVisitModal({
  isOpen,
  onClose,
  visit,
  restaurant,
  loloRatings,
  davidRatings,
  burgers,
  currentUser,
  onUpdate,
}: EditVisitModalProps) {
  const [activeUser, setActiveUser] = useState<"Lolo" | "David">(currentUser)
  const [isLoading, setIsLoading] = useState(false)
  const [editingRatingId, setEditingRatingId] = useState<string | null>(null)
  const [isAddingBurger, setIsAddingBurger] = useState(false)

  const [editForm, setEditForm] = useState({
    burgerName: "",
    meatRating: 0,
    cheeseRating: 0,
    juicinessRating: 0,
    breadRating: 0,
    sauceRating: 0,
    friesRating: null as number | null,
    price: "",
    comment: "",
  })
  const [showFriesRating, setShowFriesRating] = useState(false)

  const supabase = createClient()

  const currentRatings = activeUser === "Lolo" ? loloRatings : davidRatings
  const canEdit = activeUser === currentUser

  const handleNext = () => {
    setActiveUser(activeUser === "Lolo" ? "David" : "Lolo")
  }

  const handlePrev = () => {
    setActiveUser(activeUser === "Lolo" ? "David" : "Lolo")
  }

  const handleEditRating = (rating: VisitRating) => {
    const burger = burgers.find((b) => b.id === rating.burger_id)
    setEditingRatingId(rating.id)
    setEditForm({
      burgerName: burger?.name || "",
      meatRating: rating.meat_rating,
      cheeseRating: rating.cheese_rating,
      juicinessRating: rating.juiciness_rating,
      breadRating: rating.bread_rating,
      sauceRating: rating.sauce_rating,
      friesRating: rating.fries_rating,
      price: rating.price?.toString() || "",
      comment: rating.comment || "",
    })
    setShowFriesRating(rating.fries_rating !== null)
  }

  const handleSaveEdit = async () => {
    if (!editingRatingId) return

    const rating = currentRatings.find((r) => r.id === editingRatingId)
    if (!rating) return

    setIsLoading(true)
    try {
      let burgerId = rating.burger_id
      const existingBurger = burgers.find((b) => b.id === rating.burger_id)

      if (existingBurger?.name !== editForm.burgerName) {
        const { data: existingBurgerData } = await supabase
          .from("burgers")
          .select("id")
          .eq("restaurant_id", restaurant.id)
          .ilike("name", editForm.burgerName)
          .single()

        if (existingBurgerData) {
          burgerId = existingBurgerData.id
        } else {
          const { data: newBurger, error: burgerError } = await supabase
            .from("burgers")
            .insert({
              restaurant_id: restaurant.id,
              name: editForm.burgerName,
              created_by: currentUser,
            })
            .select()
            .single()

          if (burgerError) throw burgerError
          burgerId = newBurger.id
        }
      }

      const { error } = await supabase
        .from("visit_ratings")
        .update({
          burger_id: burgerId,
          meat_rating: editForm.meatRating,
          cheese_rating: editForm.cheeseRating,
          juiciness_rating: editForm.juicinessRating,
          bread_rating: editForm.breadRating,
          sauce_rating: editForm.sauceRating,
          fries_rating: showFriesRating ? editForm.friesRating : null,
          price: editForm.price ? Number.parseFloat(editForm.price) : null,
          comment: editForm.comment || null,
        })
        .eq("id", editingRatingId)

      if (error) throw error

      toast.success("Valoración actualizada")
      setEditingRatingId(null)
      onUpdate()
    } catch (error) {
      console.error("Error updating rating:", error)
      toast.error("Error al actualizar la valoración")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRating = async (ratingId: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta valoración?")) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("visit_ratings").delete().eq("id", ratingId)

      if (error) throw error

      toast.success("Valoración eliminada")
      onUpdate()
    } catch (error) {
      console.error("Error deleting rating:", error)
      toast.error("Error al eliminar la valoración")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartAddBurger = () => {
    setIsAddingBurger(true)
    setEditForm({
      burgerName: "",
      meatRating: 0,
      cheeseRating: 0,
      juicinessRating: 0,
      breadRating: 0,
      sauceRating: 0,
      friesRating: null,
      price: "",
      comment: "",
    })
    setShowFriesRating(false)
  }

  const handleSaveNewBurger = async () => {
    if (!editForm.burgerName.trim()) {
      toast.error("Por favor, escribe el nombre de la hamburguesa")
      return
    }

    if (
      editForm.meatRating === 0 ||
      editForm.cheeseRating === 0 ||
      editForm.juicinessRating === 0 ||
      editForm.breadRating === 0 ||
      editForm.sauceRating === 0
    ) {
      toast.error("Por favor, valora todas las categorías")
      return
    }

    setIsLoading(true)
    try {
      let burgerId: string
      const { data: existingBurger } = await supabase
        .from("burgers")
        .select("id")
        .eq("restaurant_id", restaurant.id)
        .ilike("name", editForm.burgerName)
        .single()

      if (existingBurger) {
        burgerId = existingBurger.id
      } else {
        const { data: newBurger, error: burgerError } = await supabase
          .from("burgers")
          .insert({
            restaurant_id: restaurant.id,
            name: editForm.burgerName,
            created_by: currentUser,
          })
          .select()
          .single()

        if (burgerError) throw burgerError
        burgerId = newBurger.id
      }

      const { error } = await supabase.from("visit_ratings").insert({
        visit_id: visit.id,
        burger_id: burgerId,
        user_name: currentUser,
        meat_rating: editForm.meatRating,
        cheese_rating: editForm.cheeseRating,
        juiciness_rating: editForm.juicinessRating,
        bread_rating: editForm.breadRating,
        sauce_rating: editForm.sauceRating,
        fries_rating: showFriesRating ? editForm.friesRating : null,
        price: editForm.price ? Number.parseFloat(editForm.price) : null,
        comment: editForm.comment || null,
      })

      if (error) throw error

      toast.success("Hamburguesa añadida")
      setIsAddingBurger(false)
      onUpdate()
    } catch (error) {
      console.error("Error adding burger:", error)
      toast.error("Error al añadir la hamburguesa")
    } finally {
      setIsLoading(false)
    }
  }

  const imageUrl = visit.image_url || restaurant.image_url || "/placeholder.svg"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 to-gray-800 border-0 text-white shadow-2xl">
        <DialogHeader className="relative pb-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <Button onClick={handlePrev} variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <DialogTitle className={`text-xl font-bold ${activeUser === "Lolo" ? "text-pink-400" : "text-blue-400"}`}>
              Valoración de {activeUser}
            </DialogTitle>
            <Button onClick={handleNext} variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-400 mt-1 text-center">{restaurant.name}</p>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="relative h-48 rounded-2xl overflow-hidden">
            <Image src={imageUrl || "/placeholder.svg"} alt={restaurant.name} fill className="object-cover" />
          </div>

          {currentRatings.length === 0 && !isAddingBurger ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">{activeUser} aún no ha añadido su valoración</p>
              {canEdit && (
                <Button
                  onClick={handleStartAddBurger}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir mi hamburguesa
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {currentRatings.map((rating) => {
                const burger = burgers.find((b) => b.id === rating.burger_id)
                const isEditing = editingRatingId === rating.id

                if (isEditing) {
                  return (
                    <div key={rating.id} className="bg-gray-800/50 rounded-xl p-4 border border-orange-500">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white">Editando</h3>
                        <Button
                          onClick={() => setEditingRatingId(null)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <Input
                          placeholder="Nombre de la hamburguesa"
                          value={editForm.burgerName}
                          onChange={(e) => setEditForm({ ...editForm, burgerName: e.target.value })}
                          className="bg-gray-900 border-gray-700"
                        />

                        <StarRating
                          label="🥩 Carne"
                          value={editForm.meatRating}
                          onChange={(value) => setEditForm({ ...editForm, meatRating: value })}
                        />
                        <StarRating
                          label="🧀 Queso"
                          value={editForm.cheeseRating}
                          onChange={(value) => setEditForm({ ...editForm, cheeseRating: value })}
                        />
                        <StarRating
                          label="💧 Jugosidad"
                          value={editForm.juicinessRating}
                          onChange={(value) => setEditForm({ ...editForm, juicinessRating: value })}
                        />
                        <StarRating
                          label="🍞 Pan"
                          value={editForm.breadRating}
                          onChange={(value) => setEditForm({ ...editForm, breadRating: value })}
                        />
                        <StarRating
                          label="🥫 Salsa"
                          value={editForm.sauceRating}
                          onChange={(value) => setEditForm({ ...editForm, sauceRating: value })}
                        />

                        {!showFriesRating ? (
                          <Button
                            onClick={() => setShowFriesRating(true)}
                            variant="outline"
                            size="sm"
                            className="w-full border-dashed"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Patatas
                          </Button>
                        ) : (
                          <StarRating
                            label="🍟 Patatas"
                            value={editForm.friesRating || 0}
                            onChange={(value) => setEditForm({ ...editForm, friesRating: value })}
                          />
                        )}

                        <Input
                          type="number"
                          placeholder="Precio (€)"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          className="bg-gray-900 border-gray-700"
                        />

                        <Textarea
                          placeholder="Comentario (opcional)"
                          value={editForm.comment}
                          onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                          className="bg-gray-900 border-gray-700"
                        />

                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveEdit}
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500"
                          >
                            Guardar
                          </Button>
                          <Button
                            onClick={() => setEditingRatingId(null)}
                            variant="outline"
                            disabled={isLoading}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={rating.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-white">{burger?.name || "Hamburguesa"}</h3>
                      {rating.price && <span className="text-sm text-gray-400">{rating.price}€</span>}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">🥩 Carne</span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < rating.meat_rating ? "bg-yellow-400" : "bg-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">🧀 Queso</span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < rating.cheese_rating ? "bg-yellow-400" : "bg-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">💧 Jugosidad</span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < rating.juiciness_rating ? "bg-yellow-400" : "bg-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">🍞 Pan</span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < rating.bread_rating ? "bg-yellow-400" : "bg-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">🥫 Salsa</span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < rating.sauce_rating ? "bg-yellow-400" : "bg-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {rating.fries_rating && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">🍟 Patatas</span>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < rating.fries_rating! ? "bg-yellow-400" : "bg-gray-600"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {rating.comment && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-sm text-gray-300">{rating.comment}</p>
                      </div>
                    )}

                    {canEdit && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                        <Button onClick={() => handleEditRating(rating)} variant="outline" size="sm" className="flex-1">
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => handleDeleteRating(rating.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}

              {isAddingBurger && canEdit && (
                <div className="bg-gray-800/50 rounded-xl p-4 border border-orange-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white">Nueva hamburguesa</h3>
                    <Button onClick={() => setIsAddingBurger(false)} variant="ghost" size="icon" className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <Input
                      placeholder="Nombre de la hamburguesa"
                      value={editForm.burgerName}
                      onChange={(e) => setEditForm({ ...editForm, burgerName: e.target.value })}
                      className="bg-gray-900 border-gray-700"
                    />

                    <StarRating
                      label="🥩 Carne"
                      value={editForm.meatRating}
                      onChange={(value) => setEditForm({ ...editForm, meatRating: value })}
                    />
                    <StarRating
                      label="🧀 Queso"
                      value={editForm.cheeseRating}
                      onChange={(value) => setEditForm({ ...editForm, cheeseRating: value })}
                    />
                    <StarRating
                      label="💧 Jugosidad"
                      value={editForm.juicinessRating}
                      onChange={(value) => setEditForm({ ...editForm, juicinessRating: value })}
                    />
                    <StarRating
                      label="🍞 Pan"
                      value={editForm.breadRating}
                      onChange={(value) => setEditForm({ ...editForm, breadRating: value })}
                    />
                    <StarRating
                      label="🥫 Salsa"
                      value={editForm.sauceRating}
                      onChange={(value) => setEditForm({ ...editForm, sauceRating: value })}
                    />

                    {!showFriesRating ? (
                      <Button
                        onClick={() => setShowFriesRating(true)}
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Patatas
                      </Button>
                    ) : (
                      <StarRating
                        label="🍟 Patatas"
                        value={editForm.friesRating || 0}
                        onChange={(value) => setEditForm({ ...editForm, friesRating: value })}
                      />
                    )}

                    <Input
                      type="number"
                      placeholder="Precio (€)"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className="bg-gray-900 border-gray-700"
                    />

                    <Textarea
                      placeholder="Comentario (opcional)"
                      value={editForm.comment}
                      onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                      className="bg-gray-900 border-gray-700"
                    />

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveNewBurger}
                        disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-red-500"
                      >
                        Guardar
                      </Button>
                      <Button
                        onClick={() => setIsAddingBurger(false)}
                        variant="outline"
                        disabled={isLoading}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {canEdit && !isAddingBurger && !editingRatingId && (
                <Button
                  onClick={handleStartAddBurger}
                  variant="outline"
                  className="w-full border-dashed border-gray-600 text-gray-400 hover:border-orange-500 hover:text-orange-400 bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir otra hamburguesa
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

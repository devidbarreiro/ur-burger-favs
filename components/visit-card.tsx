"use client"

import Image from "next/image"
import { Star, User, Plus } from "lucide-react"
import { useState } from "react"
import { EditVisitModal } from "./edit-visit-modal"
import { AddRatingModal } from "./add-rating-modal"

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

type VisitCardProps = {
  visit: Visit
  restaurant: Restaurant
  loloRatings: VisitRating[]
  davidRatings: VisitRating[]
  burgers: Burger[]
  currentUser: "Lolo" | "David"
  onUpdate: () => void
}

export function VisitCard({
  visit,
  restaurant,
  loloRatings,
  davidRatings,
  burgers,
  currentUser,
  onUpdate,
}: VisitCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const calculateAverage = (ratings: VisitRating[]) => {
    if (ratings.length === 0) return 0
    const sum = ratings.reduce((acc, r) => {
      const ratingValues = [r.meat_rating, r.cheese_rating, r.juiciness_rating, r.bread_rating, r.sauce_rating]
      if (r.fries_rating) ratingValues.push(r.fries_rating)
      return acc + ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
    }, 0)
    return sum / ratings.length
  }

  const loloAvg = calculateAverage(loloRatings)
  const davidAvg = calculateAverage(davidRatings)
  const hasLolo = loloRatings.length > 0
  const hasDavid = davidRatings.length > 0

  const currentUserHasRating = currentUser === "Lolo" ? hasLolo : hasDavid
  const otherUser = currentUser === "Lolo" ? "David" : "Lolo"
  const otherUserHasRating = currentUser === "Lolo" ? hasDavid : hasLolo

  const imageUrl = visit.image_url || restaurant.image_url || "/placeholder.svg"

  const handleClick = () => {
    if (currentUserHasRating) {
      setIsEditModalOpen(true)
    } else {
      setIsAddModalOpen(true)
    }
  }

  return (
    <>
      <div
        onClick={handleClick}
        className="group relative bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-border animate-slide-up"
      >
        <div className="relative h-48 overflow-hidden">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={restaurant.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {!currentUserHasRating && otherUserHasRating && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse-glow">
              <Plus className="w-3.5 h-3.5" />
              ¡Añade la tuya!
            </div>
          )}

          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
            {new Date(visit.visit_date).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>

        <div className="p-4 space-y-3">
          <h3 className="font-bold text-card-foreground text-base line-clamp-1 group-hover:text-primary transition-colors">
            {restaurant.name}
          </h3>

          <div className="space-y-2">
            {hasLolo ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 transition-colors hover:bg-muted">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-md">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-card-foreground">Lolo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-bold text-card-foreground">{loloAvg.toFixed(1)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-dashed border-border">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground italic">
                  {currentUser === "Lolo" ? "Sube tu valoración" : "Lolo pendiente"}
                </span>
              </div>
            )}

            {hasDavid ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 transition-colors hover:bg-muted">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-card-foreground">David</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-bold text-card-foreground">{davidAvg.toFixed(1)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-dashed border-border">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground italic">
                  {currentUser === "David" ? "Sube tu valoración" : "David pendiente"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {currentUserHasRating && (
        <EditVisitModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          visit={visit}
          restaurant={restaurant}
          loloRatings={loloRatings}
          davidRatings={davidRatings}
          burgers={burgers}
          currentUser={currentUser}
          onUpdate={onUpdate}
        />
      )}

      {!currentUserHasRating && (
        <AddRatingModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          currentUser={currentUser}
          onSuccess={onUpdate}
          existingVisitId={visit.id}
        />
      )}
    </>
  )
}

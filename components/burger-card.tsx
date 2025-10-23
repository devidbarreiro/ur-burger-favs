"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Star, Edit } from "lucide-react"
import Image from "next/image"
import { EditRatingModal } from "./edit-rating-modal"
import { useState, useRef } from "react"

type Rating = {
  id: string
  burger_place_id: string
  user_name: string
  meat_rating: number
  cheese_rating: number
  juiciness_rating: number
  bread_rating: number
  sauce_rating: number
}

type BurgerPlace = {
  id: string
  name: string
  image_url: string
  created_by: string
  created_at: string
}

type BurgerCardProps = {
  place: BurgerPlace
  loloRating?: Rating
  davidRating?: Rating
  currentUser: "Lolo" | "David"
  onUpdate: () => void
}

export function BurgerCard({ place, loloRating, davidRating, currentUser, onUpdate }: BurgerCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [swipeX, setSwipeX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)

  const calculateAverage = (rating?: Rating) => {
    if (!rating) return 0
    return (
      (rating.meat_rating +
        rating.cheese_rating +
        rating.juiciness_rating +
        rating.bread_rating +
        rating.sauce_rating) /
      5
    )
  }

  const loloAvg = calculateAverage(loloRating)
  const davidAvg = calculateAverage(davidRating)
  const totalAvg =
    loloRating && davidRating ? (loloAvg + davidAvg) / 2 : loloRating ? loloAvg : davidRating ? davidAvg : 0

  const currentUserRating = currentUser === "Lolo" ? loloRating : davidRating

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return
    currentX.current = e.touches[0].clientX
    const diff = currentX.current - startX.current

    // Limit swipe distance
    if (Math.abs(diff) < 150) {
      setSwipeX(diff)
    }
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)

    // If swiped left more than 80px, open edit modal
    if (swipeX < -80) {
      setIsEditModalOpen(true)
    }

    // Reset swipe position with animation
    setSwipeX(0)
  }

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none z-0">
          <div
            className="flex items-center gap-2 transition-opacity duration-200"
            style={{ opacity: swipeX < -40 ? 1 : 0 }}
          >
            <Edit className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Editar</span>
          </div>
        </div>

        <Card
          className="group overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-0 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 rounded-2xl shadow-xl relative z-10"
          style={{
            transform: `perspective(1000px) rotateY(-5deg) rotateX(2deg) translateX(${swipeX}px)`,
            transformStyle: "preserve-3d",
            transition: isSwiping ? "none" : "transform 0.3s ease-out",
          }}
          onClick={() => !isSwiping && setIsEditModalOpen(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative h-48 overflow-hidden">
            <Image
              src={place.image_url || "/placeholder.svg"}
              alt={place.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              priority
            />

            <div className="absolute top-3 left-3 bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-base px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              ★ {totalAvg.toFixed(1)}
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-gray-900 to-gray-800">
            <h4 className="font-bold text-white text-base leading-tight mb-3">{place.name}</h4>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-pink-500/20 backdrop-blur-sm px-3 py-2 rounded-lg flex-1 justify-center border border-pink-500/30 transition-all duration-300 group-hover:bg-pink-500/30">
                <Star className="w-4 h-4 text-pink-400 fill-pink-400" />
                <span className="text-sm font-bold text-pink-300">{loloAvg.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-lg flex-1 justify-center border border-blue-500/30 transition-all duration-300 group-hover:bg-blue-500/30">
                <Star className="w-4 h-4 text-blue-400 fill-blue-400" />
                <span className="text-sm font-bold text-blue-300">{davidAvg.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <EditRatingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        place={place}
        currentUser={currentUser}
        existingRating={currentUserRating}
        onSuccess={() => {
          onUpdate()
          setIsEditModalOpen(false)
        }}
      />
    </>
  )
}

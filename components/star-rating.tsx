"use client"

import { Star } from "lucide-react"

type StarRatingProps = {
  label: string
  value: number
  onChange: (value: number) => void
}

export function StarRating({ label, value, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-gray-300 min-w-[100px]">{label}</span>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none"
          >
            <Star
              className={`h-7 w-7 transition-all duration-200 ${
                star <= value
                  ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                  : "text-gray-600 hover:text-yellow-400/50"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

"use client"

import { Star } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

type RatingSliderProps = {
  label: string
  value: number
  onChange: (value: number) => void
}

export function RatingSlider({ label, value, onChange }: RatingSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
            />
          ))}
        </div>
      </div>
      <Slider value={[value]} onValueChange={(values) => onChange(values[0])} max={5} step={1} className="w-full" />
    </div>
  )
}

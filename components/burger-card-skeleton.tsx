import { Card } from "@/components/ui/card"

export function BurgerCardSkeleton() {
  return (
    <Card
      className="overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-0 rounded-2xl shadow-xl animate-pulse"
      style={{
        transform: "perspective(1000px) rotateY(-5deg) rotateX(2deg)",
        transformStyle: "preserve-3d",
      }}
    >
      <div className="relative h-48 bg-gray-700/50" />

      <div className="p-4 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="h-5 bg-gray-700/50 rounded mb-3 w-3/4" />

        <div className="flex items-center justify-between gap-3">
          <div className="h-10 bg-gray-700/50 rounded-lg flex-1" />
          <div className="h-10 bg-gray-700/50 rounded-lg flex-1" />
        </div>
      </div>
    </Card>
  )
}

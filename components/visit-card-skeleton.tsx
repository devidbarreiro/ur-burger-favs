export function VisitCardSkeleton() {
  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border animate-pulse">
      <div className="relative h-48 bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="flex gap-4 pt-2">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-16" />
            <div className="h-8 bg-muted rounded" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-16" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

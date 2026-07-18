import { Skeleton } from '@/components/atoms/Skeleton'
import { cn } from '@/lib/utils'

export interface SkeletonStatsProps {
  count?: number
  className?: string
}

/**
 * SkeletonStats — KPI cards grid (number + label).
 */
export function SkeletonStats({ count = 4, className }: SkeletonStatsProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-100/40 p-6 space-y-2 bg-surface-base">
          <Skeleton variant="text" className="h-2 w-1/2" />
          <Skeleton variant="rect" className="h-10 w-3/4" />
          <Skeleton variant="text" className="h-2 w-1/3" />
        </div>
      ))}
    </div>
  )
}

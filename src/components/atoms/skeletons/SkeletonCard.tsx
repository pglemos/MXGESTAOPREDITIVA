import { Skeleton } from '@/components/atoms/Skeleton'
import { cn } from '@/lib/utils'

export interface SkeletonCardProps {
  className?: string
  showAvatar?: boolean
  lines?: number
}

/**
 * SkeletonCard — Card placeholder (header + body + footer).
 */
export function SkeletonCard({ className, showAvatar = false, lines = 3 }: SkeletonCardProps) {
  return (
    <div className={cn('rounded-2xl border border-gray-100/50 bg-surface-base p-6 space-y-4', className)}>
      <div className="flex items-center gap-4">
        {showAvatar && <Skeleton variant="avatar" />}
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-4 w-2/3" />
          <Skeleton variant="text" className="h-2 w-1/3" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} variant="text" className={cn('h-2', i === lines - 1 ? 'w-2/3' : 'w-full')} />
        ))}
      </div>
    </div>
  )
}

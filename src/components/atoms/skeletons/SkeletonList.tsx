import { Skeleton } from '@/components/atoms/Skeleton'
import { cn } from '@/lib/utils'

export interface SkeletonListProps {
  items?: number
  className?: string
  showAvatar?: boolean
}

/**
 * SkeletonList — Lista vertical de items (notificações, vendedores, etc).
 */
export function SkeletonList({ items = 5, className, showAvatar = true }: SkeletonListProps) {
  return (
    <div className={cn('w-full space-y-2', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border border-gray-100/40 p-4">
          {showAvatar && <Skeleton variant="avatar" />}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-3/4" />
            <Skeleton variant="text" className="h-2 w-1/2" />
          </div>
          <Skeleton variant="rect" className="h-10 w-32 hidden sm:block" />
        </div>
      ))}
    </div>
  )
}

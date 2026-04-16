import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rect' | 'circle'
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'rect', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse bg-surface-alt/80 border border-border-default/50",
          variant === 'circle' ? "rounded-mx-full" : "rounded-mx-xl",
          className
        )}
        {...props}
      >
        <div className="sr-only">Carregando...</div>
      </div>
    )
  }
)
Skeleton.displayName = "Skeleton"

export { Skeleton }

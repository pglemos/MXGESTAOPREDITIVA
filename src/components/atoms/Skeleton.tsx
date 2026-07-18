import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Skeleton — Loading placeholder primitive.
 *
 * A11y:
 * - Skeleton is decorative (`aria-hidden="true"`). Parent container MUST set
 *   `aria-busy="true"` + `aria-live="polite"` to announce loading state to AT.
 *
 * Motion:
 * - Respects `prefers-reduced-motion`: shimmer animation is disabled (still keeps
 *   a static placeholder) when user prefers reduced motion.
 */
export type SkeletonVariant = 'rect' | 'circle' | 'text' | 'avatar' | 'chart' | 'card' | 'table-row'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant
}

const variantClasses: Record<SkeletonVariant, string> = {
  rect: 'rounded-2xl',
  circle: 'rounded-full',
  text: 'h-4 rounded-sm',
  avatar: 'rounded-full w-14 h-14',
  chart: 'h-64 w-full rounded-2xl',
  card: 'h-48 w-full rounded-2xl',
  'table-row': 'h-14 w-full rounded-2xl',
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'rect', ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          // Animation respects reduced-motion preference via Tailwind's motion-safe variant.
          'motion-safe:animate-[pulse_1200ms_ease-in-out_infinite] bg-gray-50 border border-gray-200/60',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Skeleton.displayName = 'Skeleton'

export { Skeleton }

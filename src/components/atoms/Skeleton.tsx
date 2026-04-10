import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rect' | 'circle'
}

/**
 * MX Skeleton Atom
 * Provides a shimmering placeholder for loading states.
 * Follows MX Design Tokens for radius and spacing.
 */
function Skeleton({
  className,
  variant = 'rect',
  ...props
}: SkeletonProps) {
  return (
    <div
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

export { Skeleton }

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      size: {
        sm: "py-mx-md px-mx-sm space-y-mx-xs",
        md: "py-mx-xl px-mx-lg space-y-mx-sm",
        lg: "py-mx-3xl px-mx-2xl space-y-mx-md",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const iconSizeVariants = cva(
  "text-text-tertiary",
  {
    variants: {
      size: {
        sm: "h-8 w-8",
        md: "h-12 w-12",
        lg: "h-16 w-16",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, size, icon, title, description, action, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(emptyStateVariants({ size }), className)} {...props}>
        {icon && (
          <div className={cn(iconSizeVariants({ size }))}>
            {icon}
          </div>
        )}
        <Typography variant="h3" className="text-text-primary">
          {title}
        </Typography>
        {description && (
          <Typography variant="p" tone="muted" className="max-w-md">
            {description}
          </Typography>
        )}
        {action && (
          <div className="mt-mx-xs">
            {action}
          </div>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState, emptyStateVariants }

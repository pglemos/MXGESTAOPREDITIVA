import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      size: {
        sm: "py-6 px-4 space-y-2",
        md: "py-12 px-8 space-y-4",
        lg: "py-24 px-16 space-y-6",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const iconSizeVariants = cva(
  "text-gray-500",
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
  nextStep?: string
  action?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, size, icon, title, description, nextStep, action, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(emptyStateVariants({ size }), className)} {...props}>
        {icon && (
          <div className={cn(iconSizeVariants({ size }))}>
            {icon}
          </div>
        )}
        <Typography variant="h3" className="text-gray-800">
          {title}
        </Typography>
        {description && (
          <Typography variant="p" tone="muted" className="max-w-md">
            {description}
          </Typography>
        )}
        {nextStep && (
          <div className="mt-2 max-w-md rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 text-left">
            <Typography variant="caption" className="block text-gray-600">
              Próximo passo
            </Typography>
            <Typography variant="p" className="mt-1 text-gray-600">
              {nextStep}
            </Typography>
          </div>
        )}
        {action && (
          <div className="mt-2">
            {action}
          </div>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState, emptyStateVariants }

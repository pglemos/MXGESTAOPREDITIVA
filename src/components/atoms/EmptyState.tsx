import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { useManagementVisualMode } from '@/components/visual/ManagementVisualContext'

/* management-audit:seller-only-start */
const emptyStateVariants = cva(
  'flex flex-col items-center justify-center text-center',
  {
    variants: {
      size: {
        sm: 'py-mx-md px-mx-sm space-y-mx-xs',
        md: 'py-mx-xl px-mx-lg space-y-mx-sm',
        lg: 'py-mx-3xl px-mx-2xl space-y-mx-md',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

const sellerEmptyStateVisual = {
  title: 'text-text-primary',
  nextStep: 'mt-mx-xs rounded-mx-xl border border-border-default bg-surface-alt px-mx-md py-mx-sm',
  caption: 'text-text-secondary',
  paragraph: 'mt-mx-tiny text-text-secondary',
  action: 'mt-mx-xs',
}

const sellerIconSizeVariants = cva('text-text-tertiary', {
  variants: {
    size: {
      sm: 'h-8 w-8',
      md: 'h-12 w-12',
      lg: 'h-16 w-16',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})
/* management-audit:seller-only-end */

const managerEmptyStateVisual = {
  title: 'text-gray-800',
  nextStep: 'mt-2 rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4',
  caption: 'text-gray-600',
  paragraph: 'mt-1 text-gray-600',
  action: 'mt-2',
}

const managerEmptyStateVariants = cva(
  'flex flex-col items-center justify-center text-center',
  {
    variants: {
      size: {
        sm: 'space-y-2 px-4 py-6',
        md: 'space-y-4 px-8 py-12',
        lg: 'space-y-6 px-16 py-24',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

const managerIconSizeVariants = cva('text-gray-500', {
  variants: {
    size: {
      sm: 'h-8 w-8',
      md: 'h-12 w-12',
      lg: 'h-16 w-16',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

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
    const visualMode = useManagementVisualMode()
    const isManager = visualMode === 'manager'
    const visual = isManager ? managerEmptyStateVisual : sellerEmptyStateVisual
    const stateClasses = isManager
      ? managerEmptyStateVariants({ size })
      : emptyStateVariants({ size })
    const iconClasses = isManager
      ? managerIconSizeVariants({ size })
      : sellerIconSizeVariants({ size })

    return (
      <div ref={ref} className={cn(stateClasses, className)} {...props}>
        {icon ? <div className={iconClasses}>{icon}</div> : null}
        <Typography variant="h3" className={visual.title}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="p" tone="muted" className="max-w-md">
            {description}
          </Typography>
        ) : null}
        {nextStep ? (
          <div className={cn('max-w-md text-left', visual.nextStep)}>
            <Typography variant="caption" className={cn('block', visual.caption)}>
              Próximo passo
            </Typography>
            <Typography variant="p" className={visual.paragraph}>
              {nextStep}
            </Typography>
          </div>
        ) : null}
        {action ? <div className={visual.action}>{action}</div> : null}
      </div>
    )
  },
)
EmptyState.displayName = 'EmptyState'

export { EmptyState, emptyStateVariants }

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

import { Typography } from '@/components/atoms/Typography'

const badgeVariants = cva(
  "inline-flex items-center rounded-mx-md border px-3 py-1 font-black uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-primary text-white shadow-mx-sm hover:opacity-90",
        brand: "border-transparent bg-brand-primary text-white shadow-mx-md hover:bg-pure-black",
        secondary: "border-transparent bg-brand-secondary text-white hover:bg-pure-black",
        success: "border-transparent bg-status-success text-white shadow-mx-sm",
        warning: "border-transparent bg-status-warning text-white shadow-mx-sm",
        info: "border-transparent bg-status-info text-white shadow-mx-sm",
        danger: "border-transparent bg-status-error text-white shadow-mx-sm",
        outline: "border-border-strong bg-white text-text-primary hover:bg-surface-alt",
        ghost: "border-transparent text-text-secondary hover:text-text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {typeof children === 'string' ? (
        <Typography variant="caption" className="text-inherit tracking-inherit">
          {children}
        </Typography>
      ) : (
        children
      )}
    </div>
  )
}

export { Badge, badgeVariants }

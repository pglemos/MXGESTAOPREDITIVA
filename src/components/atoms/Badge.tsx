import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  "inline-flex items-center rounded-mx-md border px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-primary text-white shadow hover:opacity-90",
        secondary: "border-transparent bg-brand-secondary text-white hover:bg-black",
        success: "border-transparent bg-status-success text-white",
        warning: "border-transparent bg-status-warning text-white",
        info: "border-transparent bg-status-info text-white",
        danger: "border-transparent bg-status-error text-white",
        outline: "border-border-strong text-text-primary",
        ghost: "border-transparent text-text-secondary",
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

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

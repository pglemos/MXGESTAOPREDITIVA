import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-mx-md text-[10px] font-black uppercase tracking-widest transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-11 px-6 sm:h-10 sm:px-4", 
  {
    variants: {
      variant: {
        primary: "bg-brand-primary text-white shadow-mx-md hover:bg-brand-primary-hover",
        secondary: "bg-brand-secondary text-white hover:bg-black",
        success: "bg-status-success text-white hover:opacity-90",
        warning: "bg-status-warning text-white hover:opacity-90",
        info: "bg-status-info text-white hover:opacity-90",
        danger: "bg-status-error text-white hover:bg-rose-600",
        outline: "border border-border-strong bg-white text-text-primary hover:bg-surface-alt",
        ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-alt",
      },
      size: {
        default: "h-11 px-6 sm:h-10 sm:px-4",
        sm: "h-9 rounded-mx-sm px-3",
        lg: "h-14 rounded-mx-lg px-8",
        icon: "h-11 w-11 sm:h-10 sm:w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-mx-xs whitespace-nowrap rounded-mx-md text-xs font-black uppercase tracking-widest transition-all focus-visible:ring-4 focus-visible:ring-mx-indigo-500/20 outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-11 px-mx-md sm:h-10 sm:px-mx-sm", 
  {
    variants: {
      variant: {
        primary: "bg-brand-primary text-text-on-brand shadow-mx-md hover:bg-brand-primary-hover",
        secondary: "bg-brand-secondary text-text-on-brand hover:bg-brand-secondary-hover",
        success: "bg-status-success text-text-on-brand hover:opacity-90",
        warning: "bg-status-warning text-text-on-brand hover:opacity-90",
        info: "bg-status-info text-text-on-brand hover:opacity-90",
        danger: "bg-status-error text-text-on-brand hover:bg-mx-rose-600",
        outline: "border border-border-strong bg-surface-main text-text-primary hover:bg-surface-alt",
        ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-alt",
      }
    },
    defaultVariants: {
      variant: "primary"
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Process children to ensure SVGs are hidden from screen readers by default
    // Only apply this when not using asChild to avoid breaking Radix Slot's single-child requirement
    const processedChildren = asChild 
      ? children 
      : React.Children.map(children, child => {
          if (React.isValidElement(child) && typeof child.type === 'string' && child.type === 'svg') {
            return React.cloneElement(child as React.ReactElement<any>, {
              'aria-hidden': 'true',
              ...child.props
            })
          }
          return child
        })

    return (
      <Comp
        className={cn(buttonVariants({ variant, className }))}
        ref={ref}
        {...props}
      >
        {processedChildren}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

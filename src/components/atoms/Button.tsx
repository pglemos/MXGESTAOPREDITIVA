import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

import { Typography } from '@/components/atoms/Typography'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-mx-xs whitespace-nowrap rounded-mx-md font-black uppercase tracking-widest transition-all focus-visible:ring-4 focus-visible:ring-brand-primary/20 outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-mx-11 px-6 sm:h-10 sm:px-4", 
  {
    variants: {
      variant: {
        primary: "bg-brand-secondary text-white shadow-lg shadow-brand-primary/25 hover:bg-mx-green-950 hover:shadow-brand-primary/40",
        secondary: "bg-white text-brand-secondary border border-border-strong hover:bg-surface-alt hover:border-brand-primary/40",
        success: "bg-status-success text-white hover:opacity-90",
        warning: "bg-status-warning text-white hover:opacity-90",
        info: "bg-status-info text-white hover:opacity-90",
        danger: "bg-status-error text-white hover:bg-rose-600",
        outline: "border border-border-strong bg-white text-text-primary hover:bg-surface-alt",
        ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-alt",
      },
      size: {
        default: "h-mx-11 px-6 sm:h-10 sm:px-4",
        sm: "h-mx-9 rounded-mx-sm px-3",
        lg: "h-mx-14 rounded-mx-lg px-8",
        icon: "h-mx-11 w-mx-11 sm:h-10 sm:w-10",
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
  ({ className, variant, size, children, asChild = false, ...props }, ref) => {
    const decoratedChildren = React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child
      if (typeof child.type === 'string' && child.type === 'svg') {
        const childProps = child.props as { ['aria-hidden']?: boolean; focusable?: boolean }
        return React.cloneElement(child as React.ReactElement<any>, {
          'aria-hidden': childProps['aria-hidden'] ?? true,
          focusable: childProps.focusable ?? false,
        })
      }
      return child
    })

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>
      return React.cloneElement(child, {
        ...props,
        className: cn(buttonVariants({ variant, size, className }), child.props.className),
      })
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {!asChild && typeof children === 'string' ? (
          <Typography variant="caption" className="text-inherit tracking-inherit">
            {children}
          </Typography>
        ) : (
          decoratedChildren
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

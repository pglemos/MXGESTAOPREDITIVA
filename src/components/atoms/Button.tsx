import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

import { Typography } from '@/components/atoms/Typography'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-mx-xs whitespace-nowrap rounded-mx-md font-black uppercase tracking-widest transition-all focus-visible:ring-4 focus-visible:ring-brand-primary/20 outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
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
        "mx-elite": "bg-mx-black text-brand-primary border border-brand-primary shadow-mx-glow-brand hover:bg-mx-green-950",
      },
      size: {
        default: "h-mx-11 px-6 sm:h-10 sm:px-4",
        sm: "h-mx-9 rounded-mx-sm px-3",
        xs: "h-mx-8 rounded-mx-sm px-2 text-[10px]",
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
  loading?: boolean
  icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, asChild = false, loading = false, icon, ...props }, ref) => {
    const decoratedChildren = React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child
      if (typeof child.type === 'string' && child.type === 'svg') {
        return React.cloneElement(
          child,
          { 'aria-hidden': true, focusable: false } as Partial<typeof child.props>
        )
      }
      return child
    })

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<Record<string, unknown>>
      return React.cloneElement(child, {
        ...props,
        className: cn(buttonVariants({ variant, size, className }), String(child.props.className ?? '')),
      })
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-mx-sm">
            <svg className="animate-spin h-mx-4 w-mx-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {typeof children === 'string' ? (
              <Typography variant="caption" className="text-inherit tracking-inherit">
                Carregando...
              </Typography>
            ) : children}
          </div>
        ) : (
          <>
            {icon && <span className="mr-mx-xs">{icon}</span>}
            {!asChild && typeof children === 'string' ? (
              <Typography variant="caption" className="text-inherit tracking-inherit">
                {children}
              </Typography>
            ) : (
              decoratedChildren
            )}
          </>
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

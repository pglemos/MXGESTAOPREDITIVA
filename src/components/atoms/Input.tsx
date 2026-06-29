import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-mx-md border border-mx-border bg-white px-5 py-3 text-sm font-bold text-mx-text shadow-inner transition-all duration-[120ms] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-mx-subtle focus-visible:outline-none focus-visible:border-mx-action focus-visible:ring-4 focus-visible:ring-mx-action/20 disabled:cursor-not-allowed disabled:bg-mx-bg disabled:text-mx-muted disabled:opacity-100",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

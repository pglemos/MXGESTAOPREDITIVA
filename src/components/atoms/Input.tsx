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
          "flex w-full rounded-mx-md border border-border-default bg-white px-5 py-3 text-sm font-bold text-text-primary shadow-inner transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-tertiary focus:outline-none focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 disabled:cursor-not-allowed disabled:opacity-50 h-mx-14 sm:h-12",
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

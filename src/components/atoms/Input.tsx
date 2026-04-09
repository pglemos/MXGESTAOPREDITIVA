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
          "flex w-full rounded-mx-md border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-inner transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 disabled:cursor-not-allowed disabled:opacity-50 h-14 sm:h-12", // 56px on mobile (14), 48px on desktop (12)
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

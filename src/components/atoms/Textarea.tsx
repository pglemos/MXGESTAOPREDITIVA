import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-2xl border border-gray-200 bg-white px-6 py-5 text-sm font-bold text-gray-800 shadow-inner transition-all duration-[120ms] placeholder:text-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-100 resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, label, ...props }, ref) => {
    return (
      <div className="relative group w-full">
        {label && <label className="mx-text-caption ml-2 mb-2 block">{label}</label>}
        <select
          className={cn(
            "w-full h-14 bg-surface-alt border border-border-default rounded-mx-xl px-6 text-sm font-bold text-text-primary outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all appearance-none cursor-pointer shadow-inner",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none group-hover:text-brand-primary transition-colors mt-0" />
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }

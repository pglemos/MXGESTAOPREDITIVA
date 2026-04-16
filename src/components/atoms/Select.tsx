import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const selectVariants = cva(
  "flex w-full rounded-mx-md border bg-white px-5 py-3 text-sm font-bold text-text-primary shadow-inner transition-all appearance-none disabled:cursor-not-allowed disabled:opacity-50 h-mx-14 sm:h-12 focus:outline-none focus:ring-4 focus:ring-brand-primary/5",
  {
    variants: {
      variant: {
        default: "border-border-default focus:border-brand-primary/30",
        error: "border-status-error focus:border-status-error focus:ring-status-error/5",
        ghost: "border-transparent bg-transparent shadow-none focus:ring-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {
  label?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, label, id, children, ...props }, ref) => {
    const fieldId = id || React.useId()
    const selectElement = (
      <div className="relative">
        <select
          id={fieldId}
          className={cn(
            selectVariants({ variant }),
            "pr-10",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-mx-0 flex items-center pr-3 text-text-tertiary">
          <svg className="h-mx-xs w-mx-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    )

    if (label) {
      return (
        <div className="space-y-mx-xs w-full">
          <label htmlFor={fieldId} className="block ml-2">
            <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">
              {label}
            </span>
          </label>
          {selectElement}
        </div>
      )
    }

    return selectElement
  }
)
Select.displayName = "Select"

export { Select, selectVariants }

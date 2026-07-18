import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { useManagementVisualMode } from '@/components/visual/ManagementVisualContext'

const selectVariants = cva(
  'flex h-mx-14 w-full appearance-none rounded-mx-md border bg-white px-5 py-3 text-sm font-bold text-mx-text shadow-inner transition-all duration-[120ms] focus:outline-none focus:ring-4 focus:ring-mx-action/20 disabled:cursor-not-allowed disabled:bg-mx-bg disabled:text-mx-muted disabled:opacity-100 sm:h-12',
  {
    variants: {
      variant: {
        default: 'border-mx-border focus:border-mx-action data-[legacy-default=true]:border-border-default',
        error: 'border-status-error focus:border-status-error focus:ring-status-error/5',
        ghost: 'border-transparent bg-transparent shadow-none focus:ring-0',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

const managerSelectVariants = cva(
  'flex h-11 w-full appearance-none rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-none transition-colors focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 disabled:opacity-100',
  {
    variants: {
      variant: {
        default: 'border-gray-200 focus:border-emerald-500',
        error: 'border-red-300 focus:border-red-500 focus:ring-red-500/10',
        ghost: 'border-transparent bg-transparent shadow-none focus:ring-0',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {
  label?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, label, id, children, ...props }, ref) => {
    const visualMode = useManagementVisualMode()
    const fieldId = id || React.useId()
    const variantFactory = visualMode === 'manager' ? managerSelectVariants : selectVariants
    const selectElement = (
      <div className="relative">
        <select
          id={fieldId}
          className={cn(variantFactory({ variant }), 'pr-10', className)}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div
          className={visualMode === 'manager'
            ? 'pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400'
            : 'pointer-events-none absolute inset-y-0 right-mx-0 flex items-center pr-3 text-text-tertiary'}
        >
          <svg
            className={visualMode === 'manager' ? 'h-4 w-4' : 'h-mx-xs w-mx-xs'}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    )

    if (label) {
      return (
        <div className={visualMode === 'manager' ? 'w-full space-y-2' : 'w-full space-y-mx-xs'}>
          <label htmlFor={fieldId} className={visualMode === 'manager' ? 'block' : 'ml-2 block'}>
            <span
              className={visualMode === 'manager'
                ? 'text-xs font-semibold text-gray-600'
                : 'text-mx-tiny font-black uppercase tracking-widest text-text-tertiary'}
            >
              {label}
            </span>
          </label>
          {selectElement}
        </div>
      )
    }

    return selectElement
  },
)
Select.displayName = 'Select'

export { Select, selectVariants, managerSelectVariants }

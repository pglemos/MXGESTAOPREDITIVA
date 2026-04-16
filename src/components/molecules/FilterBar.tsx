import * as React from 'react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  icon?: React.ReactNode
}

const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  ({ className, label, icon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-wrap items-center gap-mx-sm',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-mx-xs shrink-0">
          {icon && <span className="text-text-tertiary">{icon}</span>}
          <Typography variant="caption" className="font-black uppercase tracking-widest">
            {label}
          </Typography>
        </div>
        <div className="flex flex-wrap items-center gap-mx-xs">
          {children}
        </div>
      </div>
    )
  }
)
FilterBar.displayName = 'FilterBar'

export { FilterBar }

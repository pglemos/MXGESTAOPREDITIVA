import * as React from 'react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { useManagementVisualMode } from '@/components/visual/ManagementVisualContext'

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  icon?: React.ReactNode
}

const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  ({ className, label, icon, children, ...props }, ref) => {
    const visualMode = useManagementVisualMode()
    const manager = visualMode === 'manager'
    return (
      <div
        ref={ref}
        className={cn(
          manager
            ? 'flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center'
            : 'flex flex-col gap-mx-sm sm:flex-row sm:flex-wrap sm:items-center',
          className,
        )}
        {...props}
      >
        <div className={manager ? 'flex shrink-0 items-center gap-2' : 'flex shrink-0 items-center gap-mx-xs'}>
          {icon ? <span className={manager ? 'text-gray-400' : 'text-text-tertiary'}>{icon}</span> : null}
          <Typography
            variant="caption"
            className={manager ? 'text-xs font-semibold text-gray-600' : 'font-black uppercase tracking-widest'}
          >
            {label}
          </Typography>
        </div>
        <div className={manager
          ? 'flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:flex-1'
          : 'flex w-full min-w-0 flex-wrap items-center gap-mx-xs sm:w-auto sm:flex-1'}
        >
          {children}
        </div>
      </div>
    )
  },
)
FilterBar.displayName = 'FilterBar'

export { FilterBar }

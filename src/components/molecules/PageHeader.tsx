import * as React from 'react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { useManagementVisualMode } from '@/components/visual/ManagementVisualContext'

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'description'> {
  title: React.ReactNode
  description?: React.ReactNode
  breadcrumb?: React.ReactNode
  actions?: React.ReactNode
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, breadcrumb, actions, ...props }, ref) => {
    const visualMode = useManagementVisualMode()
    return (
      <div
        ref={ref}
        className={cn(
          visualMode === 'manager'
            ? 'space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'
            : 'space-y-mx-sm',
          className,
        )}
        {...props}
      >
        {breadcrumb ? <div>{breadcrumb}</div> : null}
        <div className={visualMode === 'manager'
          ? 'flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'
          : 'flex flex-col gap-mx-md 2xl:flex-row 2xl:items-start 2xl:justify-between'}
        >
          <div className={visualMode === 'manager' ? 'min-w-0 flex-1 space-y-1' : 'min-w-0 flex-1 space-y-mx-tiny'}>
            <Typography variant="h1" className={visualMode === 'manager' ? 'text-xl font-bold text-gray-800 md:text-2xl' : 'break-words leading-tight'}>
              {title}
            </Typography>
            {description ? (
              <Typography variant="caption" tone="muted" className={visualMode === 'manager' ? 'text-sm leading-6 text-gray-500' : undefined}>
                {description}
              </Typography>
            ) : null}
          </div>
          {actions ? (
            <div className={visualMode === 'manager'
              ? 'flex min-w-0 flex-wrap items-center gap-2'
              : 'flex min-w-0 w-full flex-wrap items-center gap-mx-xs 2xl:w-auto 2xl:justify-end'}
            >
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    )
  },
)
PageHeader.displayName = 'PageHeader'

export { PageHeader }

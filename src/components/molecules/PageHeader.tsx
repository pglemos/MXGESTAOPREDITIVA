import * as React from 'react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  breadcrumb?: React.ReactNode
  actions?: React.ReactNode
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, breadcrumb, actions, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-mx-sm", className)} {...props}>
        {breadcrumb && <div>{breadcrumb}</div>}
        <div className="flex items-start justify-between gap-mx-md">
          <div className="space-y-mx-tiny">
            <Typography variant="h1">{title}</Typography>
            {description && (
              <Typography variant="caption" tone="muted">{description}</Typography>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-mx-xs shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    )
  }
)
PageHeader.displayName = "PageHeader"

export { PageHeader }

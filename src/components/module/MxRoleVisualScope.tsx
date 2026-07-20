import type { ReactNode } from 'react'
import { ButtonVisualProvider } from '@/components/atoms/Button'
import { cn } from '@/lib/utils'

export function MxRoleVisualScope({
  children,
  manager = true,
  className,
}: {
  children: ReactNode
  manager?: boolean
  className?: string
}) {
  if (!manager) return <>{children}</>

  return (
    <ButtonVisualProvider mode="manager">
      <div
        data-mx-visual-system="manager"
        className={cn(
          'mx-manager-scope h-full min-h-0 w-full bg-gray-50 text-gray-800',
          className,
        )}
      >
        {children}
      </div>
    </ButtonVisualProvider>
  )
}

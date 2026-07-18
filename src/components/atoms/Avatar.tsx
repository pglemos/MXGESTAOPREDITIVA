import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { useManagementVisualMode } from '@/components/visual/ManagementVisualContext'

/* management-audit:seller-only-start */
const avatarVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-mx-full border border-border-default bg-surface-alt',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-mx-micro',
        md: 'h-10 w-10 text-mx-tiny',
        lg: 'h-12 w-12 text-sm',
        xl: 'h-16 w-16 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

const sellerFallbackClass = 'text-brand-primary'

const sellerStatusDotVariants = cva('absolute rounded-mx-full border-2 border-white', {
  variants: {
    status: {
      online: 'bg-status-success',
      offline: 'bg-text-tertiary',
      busy: 'bg-status-error',
      away: 'bg-status-warning',
    },
    size: {
      sm: 'size-mx-tiny bottom-mx-0 right-mx-0',
      md: 'size-2.5 bottom-mx-0 right-mx-0',
      lg: 'size-3 bottom-mx-tiny right-mx-tiny',
      xl: 'size-3.5 bottom-mx-tiny right-mx-tiny',
    },
  },
  defaultVariants: {
    status: undefined,
    size: 'md',
  },
})
/* management-audit:seller-only-end */

const managerFallbackClass = 'text-emerald-600'

const managerAvatarVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-gray-50',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-[9px]',
        md: 'h-10 w-10 text-[10px]',
        lg: 'h-12 w-12 text-sm',
        xl: 'h-16 w-16 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

const managerStatusDotVariants = cva('absolute rounded-full border-2 border-white', {
  variants: {
    status: {
      online: 'bg-emerald-600',
      offline: 'bg-gray-500',
      busy: 'bg-red-600',
      away: 'bg-amber-500',
    },
    size: {
      sm: 'bottom-0 right-0 size-1',
      md: 'bottom-0 right-0 size-2.5',
      lg: 'bottom-1 right-1 size-3',
      xl: 'bottom-1 right-1 size-3.5',
    },
  },
  defaultVariants: {
    status: undefined,
    size: 'md',
  },
})

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string
  alt?: string
  fallback?: string
  status?: 'online' | 'offline' | 'busy' | 'away'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, status, ...props }, ref) => {
    const [imgError, setImgError] = React.useState(false)
    const visualMode = useManagementVisualMode()
    const isManager = visualMode === 'manager'
    const showFallback = !src || imgError
    const initials = fallback ? getInitials(fallback) : '?'
    const accessibleName = alt || fallback || 'Avatar'
    const rootClasses = isManager
      ? managerAvatarVariants({ size })
      : avatarVariants({ size })
    const statusClasses = isManager
      ? managerStatusDotVariants({ status, size })
      : sellerStatusDotVariants({ status, size })

    return (
      <div
        ref={ref}
        role={showFallback ? 'img' : undefined}
        aria-label={showFallback ? accessibleName : undefined}
        className={cn(rootClasses, className)}
        {...props}
      >
        {showFallback ? (
          <span
            className={cn(
              'select-none font-black uppercase',
              isManager ? managerFallbackClass : sellerFallbackClass,
            )}
            aria-hidden="true"
          >
            {initials}
          </span>
        ) : (
          <img
            src={src}
            alt={accessibleName}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
        {status ? <span className={statusClasses} aria-label={status} /> : null}
      </div>
    )
  },
)
Avatar.displayName = 'Avatar'

export { Avatar, avatarVariants }

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const avatarVariants = cva(
  "relative inline-flex items-center justify-center rounded-full overflow-hidden bg-gray-50 border border-gray-100 shrink-0",
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-[9px]",
        md: "h-10 w-10 text-[10px]",
        lg: "h-12 w-12 text-sm",
        xl: "h-16 w-16 text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const statusDotVariants = cva(
  "absolute rounded-full border-2 border-white",
  {
    variants: {
      status: {
        online: "bg-emerald-600",
        offline: "bg-text-tertiary",
        busy: "bg-red-600",
        away: "bg-amber-500",
      },
      size: {
        sm: "size-1 bottom-0 right-0",
        md: "size-2.5 bottom-0 right-0",
        lg: "size-3 bottom-1 right-1",
        xl: "size-3.5 bottom-1 right-1",
      },
    },
    defaultVariants: {
      status: undefined,
      size: "md",
    },
  }
)

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

  const showFallback = !src || imgError
  const initials = fallback ? getInitials(fallback) : '?'
  const accessibleName = alt || fallback || 'Avatar'

  return (
    <div
      ref={ref}
      role={showFallback ? 'img' : undefined}
      aria-label={showFallback ? accessibleName : undefined}
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {showFallback ? (
        <span className="font-black uppercase text-emerald-600 select-none" aria-hidden="true">
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
        {status && (
          <span className={cn(statusDotVariants({ status, size }))} aria-label={status} />
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar, avatarVariants }

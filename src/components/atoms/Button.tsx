import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import {
  ManagementVisualProvider,
  type ManagementVisualMode,
  useManagementVisualMode,
} from '@/components/visual/ManagementVisualContext'

const buttonVariants = cva(
  'group relative inline-flex items-center justify-center gap-mx-xs whitespace-nowrap rounded-mx-md font-semibold tracking-normal transition-all duration-[120ms] focus-visible:ring-4 focus-visible:ring-mx-action/20 outline-none disabled:pointer-events-none disabled:bg-mx-bg disabled:text-mx-muted disabled:opacity-100 data-[legacy-disabled=true]:disabled:opacity-50 active:scale-[0.98] active:duration-[80ms] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-mx-action text-white shadow-action hover:bg-mx-action-hover data-[legacy-primary=true]:bg-brand-secondary',
        brand: 'bg-mx-teal text-white shadow-sm hover:bg-mx-teal/90',
        secondary: 'border border-mx-border bg-white text-mx-text hover:border-mx-action/40 hover:bg-mx-bg',
        success: 'bg-status-success text-white hover:opacity-90',
        warning: 'bg-status-warning text-white hover:opacity-90',
        info: 'bg-status-info text-white hover:opacity-90',
        danger: 'bg-status-error text-white hover:bg-status-error/90',
        whatsapp: 'bg-whatsapp text-white hover:bg-whatsapp/90',
        outline: 'border border-mx-border bg-white text-mx-text hover:bg-mx-bg',
        ghost: 'text-mx-muted hover:bg-mx-bg hover:text-mx-text',
        'mx-elite': 'border border-brand-primary bg-mx-black text-brand-primary shadow-mx-glow-brand hover:bg-mx-green-950',
        managerPrimary: 'bg-mx-action text-white',
        managerOutline: 'border border-mx-border bg-white text-mx-text',
        managerSecondary: 'border border-mx-border bg-white text-mx-text',
        managerGhost: 'text-mx-muted',
      },
      size: {
        default: 'h-mx-11 px-6 sm:h-10 sm:px-4',
        sm: 'h-mx-9 rounded-mx-sm px-3',
        xs: 'h-mx-8 rounded-mx-sm px-2 text-[10px]',
        lg: 'h-mx-14 rounded-mx-lg px-8',
        icon: 'h-mx-11 w-mx-11 sm:h-10 sm:w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

const managerButtonVariants = cva(
  'group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold tracking-normal outline-none transition-all duration-150 focus-visible:ring-4 focus-visible:ring-emerald-500/20 disabled:pointer-events-none disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-100 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
        brand: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
        secondary: 'border border-gray-200 bg-white text-gray-700 shadow-none hover:bg-gray-50 hover:text-gray-900',
        success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
        warning: 'bg-amber-500 text-white shadow-sm hover:bg-amber-600',
        info: 'bg-blue-600 text-white shadow-sm hover:bg-blue-700',
        danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
        whatsapp: 'bg-[#25D366] text-white shadow-sm hover:bg-[#20bd5a]',
        outline: 'border border-gray-200 bg-white text-gray-700 shadow-none hover:bg-gray-50 hover:text-gray-900',
        ghost: 'bg-transparent text-gray-500 shadow-none hover:bg-gray-50 hover:text-gray-800',
        'mx-elite': 'border border-emerald-200 bg-gray-900 text-emerald-300 shadow-sm hover:bg-gray-800',
        managerPrimary: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
        managerOutline: 'border border-emerald-200 bg-white text-emerald-700 shadow-none hover:bg-emerald-50',
        managerSecondary: 'border border-gray-200 bg-white text-gray-700 shadow-none hover:bg-gray-50 hover:text-gray-900',
        managerGhost: 'bg-transparent text-gray-500 shadow-none hover:bg-gray-50 hover:text-gray-800',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-9 px-3',
        xs: 'h-8 px-2 text-[10px]',
        lg: 'h-12 px-6',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'managerPrimary',
      size: 'default',
    },
  },
)

export type ButtonVisualMode = ManagementVisualMode
export const ButtonVisualProvider = ManagementVisualProvider

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
}

type ButtonVariant = NonNullable<ButtonProps['variant']>

function resolveVisualVariant(
  variant: ButtonProps['variant'],
  mode: ButtonVisualMode,
): ButtonVariant {
  const requested = variant ?? 'primary'
  if (mode !== 'manager') return requested

  const managerMap: Partial<Record<ButtonVariant, ButtonVariant>> = {
    primary: 'managerPrimary',
    brand: 'managerPrimary',
    outline: 'managerSecondary',
    secondary: 'managerSecondary',
    ghost: 'managerGhost',
  }

  return managerMap[requested] ?? requested
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, asChild = false, loading = false, icon, ...props }, ref) => {
    const visualMode = useManagementVisualMode()
    const resolvedVariant = resolveVisualVariant(variant, visualMode)
    const variantFactory = visualMode === 'manager' ? managerButtonVariants : buttonVariants
    const iconTooltip = size === 'icon' && typeof props['aria-label'] === 'string' ? props['aria-label'] : null
    const decoratedChildren = React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child
      if (typeof child.type === 'string' && child.type === 'svg') {
        return React.cloneElement(
          child,
          { 'aria-hidden': true, focusable: false } as Partial<typeof child.props>,
        )
      }
      return child
    })

    const resolvedClassName = cn(
      variantFactory({ variant: resolvedVariant, size, className }),
    )

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<Record<string, unknown>>
      return React.cloneElement(child, {
        ...props,
        className: cn(resolvedClassName, String(child.props.className ?? '')),
      })
    }

    return (
      <button
        className={resolvedClassName}
        ref={ref}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading ? (
          <div className={visualMode === 'manager' ? 'flex items-center gap-2' : 'flex items-center gap-mx-sm'}>
            <svg
              className={visualMode === 'manager' ? 'h-4 w-4 animate-spin text-current' : 'h-mx-4 w-mx-4 animate-spin text-current'}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {typeof children === 'string' ? (
              <Typography variant="caption" className="text-inherit tracking-inherit">
                Carregando...
              </Typography>
            ) : children}
          </div>
        ) : (
          <>
            {icon ? <span className={visualMode === 'manager' ? 'mr-2' : 'mr-mx-xs'}>{icon}</span> : null}
            {!asChild && typeof children === 'string' ? (
              <Typography variant="caption" className="text-inherit tracking-inherit">
                {children}
              </Typography>
            ) : decoratedChildren}
            {iconTooltip ? (
              <span
                className={visualMode === 'manager'
                  ? 'pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 rounded-lg bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100'
                  : 'pointer-events-none absolute left-1/2 top-full z-50 mt-mx-xs -translate-x-1/2 rounded-mx-md bg-brand-secondary px-mx-xs py-mx-tiny text-mx-micro font-medium text-white opacity-0 shadow-mx-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100'}
              >
                {iconTooltip}
              </span>
            ) : null}
          </>
        )}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants, managerButtonVariants }

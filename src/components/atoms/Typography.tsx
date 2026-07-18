import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { useManagementVisualMode } from '@/components/visual/ManagementVisualContext'

const typographyVariants = cva('transition-colors', {
  variants: {
    variant: {
      h1: 'text-3xl font-black leading-tight tracking-tight text-text-primary md:text-4xl',
      h2: 'text-xl font-bold leading-tight tracking-normal text-text-primary md:text-2xl',
      h3: 'text-lg font-semibold leading-tight tracking-normal text-text-primary',
      h4: 'text-base font-semibold leading-tight tracking-normal text-text-primary',
      p: 'text-sm font-normal leading-relaxed tracking-normal text-text-secondary',
      caption: 'text-mx-tiny font-medium tracking-normal text-text-tertiary',
      tiny: 'text-mx-micro font-medium tracking-normal',
      mono: 'font-mono-numbers text-sm font-semibold',
    },
    tone: {
      default: '',
      brand: 'text-mx-green-700',
      success: 'text-status-success',
      warning: 'text-status-warning',
      info: 'text-status-info',
      error: 'text-status-error',
      muted: 'text-text-tertiary',
      white: 'text-white',
    },
  },
  defaultVariants: {
    variant: 'p',
    tone: 'default',
  },
})

const managerTypographyVariants = cva('transition-colors', {
  variants: {
    variant: {
      h1: 'text-3xl font-bold leading-tight tracking-tight text-gray-800 md:text-4xl',
      h2: 'text-xl font-bold leading-tight tracking-normal text-gray-800 md:text-2xl',
      h3: 'text-lg font-semibold leading-tight tracking-normal text-gray-800',
      h4: 'text-base font-semibold leading-tight tracking-normal text-gray-800',
      p: 'text-sm font-normal leading-relaxed tracking-normal text-gray-600',
      caption: 'text-xs font-medium tracking-normal text-gray-500',
      tiny: 'text-[10px] font-medium tracking-normal text-gray-500',
      mono: 'font-mono text-sm font-semibold tabular-nums text-gray-700',
    },
    tone: {
      default: '',
      brand: 'text-emerald-700',
      success: 'text-emerald-600',
      warning: 'text-amber-600',
      info: 'text-blue-600',
      error: 'text-red-600',
      muted: 'text-gray-500',
      white: 'text-white',
    },
  },
  defaultVariants: {
    variant: 'p',
    tone: 'default',
  },
})

type TypographyElementType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'label' | 'div'

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: TypographyElementType
  htmlFor?: string
}

const DEFAULT_ELEMENT_MAP: Record<string, TypographyElementType> = {
  body: 'p',
  caption: 'span',
  tiny: 'span',
  mono: 'span',
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, tone, as, htmlFor, ...props }, ref) => {
    const visualMode = useManagementVisualMode()
    const Component = as || DEFAULT_ELEMENT_MAP[variant as string] || (variant as TypographyElementType) || 'p'
    const variantFactory = visualMode === 'manager' ? managerTypographyVariants : typographyVariants

    return (
      <Component
        className={cn(variantFactory({ variant, tone, className }))}
        ref={ref as React.Ref<never>}
        {...(htmlFor ? { htmlFor } : {})}
        {...props}
      />
    )
  },
)
Typography.displayName = 'Typography'

export { Typography, typographyVariants, managerTypographyVariants }

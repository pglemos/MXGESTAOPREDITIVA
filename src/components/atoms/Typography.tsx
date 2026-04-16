import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const typographyVariants = cva(
  "transition-colors",
  {
    variants: {
      variant: {
        h1: "text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none text-text-primary",
        h2: "text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none text-text-primary",
        h3: "text-xl font-black tracking-tight uppercase leading-none text-text-primary",
        p: "text-sm font-bold leading-relaxed text-text-secondary uppercase tracking-tight",
        caption: "text-mx-tiny font-black uppercase tracking-mx-wider text-text-tertiary",
        tiny: "text-mx-micro font-black uppercase tracking-widest",
        mono: "font-mono-numbers text-sm font-black",
      },
      tone: {
        default: "",
        brand: "text-mx-green-700",
        success: "text-status-success",
        warning: "text-status-warning",
        info: "text-status-info",
        error: "text-status-error",
        muted: "text-text-tertiary",
        white: "text-white",
      }
    },
    defaultVariants: {
      variant: "p",
      tone: "default"
    }
  }
)

type TypographyElementType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'label' | 'div'

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: TypographyElementType
  htmlFor?: string
}

const DEFAULT_ELEMENT_MAP: Record<string, TypographyElementType> = {
  caption: 'span',
  tiny: 'span',
  mono: 'span',
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, tone, as, htmlFor, ...props }, ref) => {
    const Component = as || DEFAULT_ELEMENT_MAP[variant as string] || (variant as TypographyElementType) || 'p'
    return (
      <Component
        className={cn(typographyVariants({ variant, tone, className }))}
        ref={ref as React.Ref<never>}
        {...(htmlFor ? { htmlFor } : {})}
        {...props}
      />
    )
  }
)
Typography.displayName = "Typography"

export { Typography, typographyVariants }

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-mx-xs whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mx-indigo-500/10 disabled:pointer-events-none disabled:opacity-30 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-95 font-black uppercase tracking-mx-wide',
    {
        variants: {
            variant: {
                default: 'bg-brand-secondary text-mx-white shadow-mx-md hover:bg-brand-secondary-hover hover:shadow-mx-lg',
                primary: 'bg-brand-primary text-mx-white shadow-mx-md hover:bg-brand-primary-hover hover:shadow-mx-lg',
                destructive: 'bg-status-error text-mx-white shadow-mx-sm hover:opacity-90',
                outline: 'border-2 border-border-strong bg-transparent text-text-primary hover:bg-mx-slate-50',
                secondary: 'bg-brand-primary-surface text-brand-primary border border-mx-indigo-100 hover:bg-mx-indigo-100',
                ghost: 'text-text-secondary hover:bg-mx-slate-50 hover:text-text-primary',
                link: 'text-brand-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-mx-14 px-8 text-mx-tiny rounded-mx-full',
                sm: 'h-mx-10 px-6 text-mx-micro rounded-mx-xl',
                lg: 'h-mx-header px-12 text-xs rounded-mx-full',
                icon: 'h-mx-xl w-mx-xl rounded-mx-2xl',
            },
        },
        defaultVariants: { variant: 'default', size: 'default' },
    },
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button'
        return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    },
)
Button.displayName = 'Button'

export { Button, buttonVariants }

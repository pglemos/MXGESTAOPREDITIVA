import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-mx-md border px-2.5 py-0.5 text-xs font-black transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15 focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-brand-primary text-text-on-brand shadow-mx-sm hover:bg-brand-primary-hover",
                secondary:
                    "border-transparent bg-brand-primary-surface text-brand-primary hover:bg-mx-indigo-100",
                destructive:
                    "border-transparent bg-status-error text-text-on-brand shadow-mx-sm hover:bg-status-error/90",
                outline: "border-border-default text-text-primary bg-transparent",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }

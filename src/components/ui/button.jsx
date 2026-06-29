import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-medium transition-all duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mx-action focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-mx-bg disabled:text-mx-muted disabled:opacity-100 active:scale-[0.98] active:duration-[80ms] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-mx-action text-white shadow-action hover:bg-mx-action-hover",
        brand:
          "bg-mx-teal text-white shadow-sm hover:bg-mx-teal/90",
        default:
          "bg-mx-action text-white shadow-action hover:bg-mx-action-hover",
        destructive:
          "bg-mx-danger text-white shadow-sm hover:bg-mx-danger/90",
        outline:
          "border border-mx-border bg-white text-mx-text shadow-sm hover:bg-mx-bg",
        secondary:
          "border border-mx-border bg-white text-mx-text shadow-sm hover:bg-mx-bg hover:border-mx-action/40",
        ghost: "text-mx-muted hover:bg-mx-bg hover:text-mx-text",
        link: "text-mx-action underline-offset-4 hover:underline",
        danger: "bg-mx-danger text-white shadow-sm hover:bg-mx-danger/90",
        success: "bg-mx-success text-white shadow-sm hover:bg-mx-success/90",
        whatsapp: "bg-whatsapp text-white shadow-sm hover:bg-whatsapp/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-[12px] px-3 text-xs",
        md: "h-10 rounded-[12px] px-4",
        lg: "h-11 rounded-[16px] px-6",
        xl: "h-12 rounded-[16px] px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }

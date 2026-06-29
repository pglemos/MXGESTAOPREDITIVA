import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-[12px] border border-mx-border bg-white px-3 py-2 text-base text-mx-text shadow-sm transition-colors duration-[120ms] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-mx-text placeholder:text-mx-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mx-action disabled:cursor-not-allowed disabled:bg-mx-bg disabled:text-mx-muted disabled:opacity-100 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }

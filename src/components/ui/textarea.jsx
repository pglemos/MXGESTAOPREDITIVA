import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    (<textarea
      className={cn(
        "flex min-h-[96px] w-full rounded-[16px] border border-mx-border bg-white px-3 py-2 text-base text-mx-text shadow-sm transition-colors duration-[120ms] placeholder:text-mx-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mx-action disabled:cursor-not-allowed disabled:bg-mx-bg disabled:text-mx-muted disabled:opacity-100 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }

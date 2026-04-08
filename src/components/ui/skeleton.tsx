import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-mx-slate-100/50 dark:bg-mx-slate-800/50", className)}
      {...props}
    />
  )
}

export { Skeleton }

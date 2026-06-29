import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    (<div
      aria-hidden="true"
      className={cn("motion-safe:animate-[pulse_1200ms_ease-in-out_infinite] rounded-[12px] bg-mx-bg border border-mx-border/60", className)}
      {...props} />)
  );
}

export { Skeleton }

import React from "react";

import { cn } from "@/lib/utils";

export default function PageHeader({
  icon,
  title,
  subtitle,
  dateLabel,
  actions,
  variant = "default",
  className,
  eyebrow,
  children,
  uppercase = false,
}) {
  const renderedActions = actions ?? children;
  const compact = variant === "compact";
  const hero = variant === "hero";

  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        compact && "gap-3",
        hero && "py-4",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mx-action-light text-mx-action"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1
              className={cn(
                "text-[28px] font-extrabold leading-tight tracking-tight text-mx-dark",
                compact && "text-[22px]",
                hero && "text-[32px]",
                uppercase && "uppercase"
              )}
            >
              {title}
            </h1>
            {dateLabel && (
              <span className="rounded-full border border-mx-border bg-white px-3 py-1 text-xs font-semibold text-mx-muted">
                {dateLabel}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-sm font-medium leading-5 text-mx-muted">{subtitle}</p>}
          {eyebrow && (
            <div className="mt-2 flex w-fit max-w-full items-center gap-1.5 rounded-[12px] border border-mx-border bg-mx-bg px-3 py-1.5 text-[13px] text-mx-text">
              {eyebrow}
            </div>
          )}
        </div>
      </div>
      {renderedActions && <div className="flex flex-wrap items-center gap-3 sm:justify-end">{renderedActions}</div>}
    </header>
  );
}

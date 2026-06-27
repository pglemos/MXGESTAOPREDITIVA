import React from "react";

export default function MxPageHeader({ title, subtitle, chip, action, className = "" }) {
  return (
    <header className={`relative z-40 shrink-0 border-b border-border-default/60 bg-surface-alt px-mx-sm pb-3 pt-2 shadow-[0_10px_24px_rgba(15,23,42,0.08)] sm:px-mx-md md:sticky md:top-0 md:pt-3 2xl:px-mx-lg ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-4">
          <div className="min-w-0">
            <h1 className="min-w-0 truncate text-[20px] font-extrabold tracking-tight text-[#111827] sm:text-[26px] uppercase leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-[12px] font-medium leading-normal text-[#64748B]">
                {subtitle}
              </p>
            )}
          </div>
          {chip && (
            <div className="inline-flex h-8 sm:h-9 max-w-full items-center gap-2 rounded-full border border-[#e5eaf2] bg-white px-3 sm:px-4 text-xs sm:text-sm font-semibold text-[#475569] shadow-sm">
              {chip}
            </div>
          )}
        </div>
        {action && (
          <div className="flex shrink-0 items-center gap-2.5">
            {action}
          </div>
        )}
      </div>
    </header>
  );
}


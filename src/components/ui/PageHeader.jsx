import React from "react";

export default function PageHeader({ title, subtitle, eyebrow, children, uppercase = false }) {
  return (
    <div className="flex min-h-[64px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
        <div className="min-w-0">
          <h1 className={`text-[22px] font-black leading-tight tracking-tight text-[#0F172A] ${uppercase ? "uppercase" : ""}`}>
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-[13px] font-medium leading-5 text-[#64748B]">{subtitle}</p>}
        </div>
        {eyebrow && (
          <div className="flex w-fit max-w-full items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-slate-50 px-3 py-1.5 text-[13px]">
            {eyebrow}
          </div>
        )}
      </div>
      {children && <div className="flex shrink-0 items-center gap-3">{children}</div>}
    </div>
  );
}

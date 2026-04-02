import type { PropsWithChildren } from 'react'

export default function LegacyModuleShell({ children }: PropsWithChildren) {
  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar relative text-[#1A1D20]">
      {/* Background Ornaments (standardized opacity to reduce visual noise) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/30 via-white/5 to-transparent z-0" />
      <div className="pointer-events-none absolute -right-16 top-12 h-44 w-44 rounded-full bg-indigo-100/40 blur-3xl z-0" />
      <div className="pointer-events-none absolute -left-12 bottom-10 h-36 w-36 rounded-full bg-orange-100/30 blur-3xl z-0" />
      
      {/* Main Content Wrapper (Using the same standard paddings as other pages) */}
      <div className="relative z-10 w-full h-full">
        {/* We remove padding constraints because the parent main tag already provides responsive padding implicitly or pages control it themselves.
            If pages depend on shell padding, we standardize it here without 'soft-card' which bloated background layers unexpectedly. */}
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

import type { PropsWithChildren } from 'react'

export default function LegacyModuleShell({ children }: PropsWithChildren) {
  return (
    <div className="soft-card h-full overflow-hidden relative text-[#1A1D20]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/50 via-white/10 to-transparent" />
      <div className="pointer-events-none absolute -right-16 top-12 h-44 w-44 rounded-full bg-indigo-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 bottom-10 h-36 w-36 rounded-full bg-orange-100/40 blur-3xl" />
      <div className="relative h-full overflow-y-auto no-scrollbar p-4 sm:p-6 md:p-10">
        {children}
      </div>
    </div>
  )
}

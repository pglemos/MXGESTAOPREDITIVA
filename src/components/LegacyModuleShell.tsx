import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

export default function LegacyModuleShell({ children }: PropsWithChildren) {
  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar relative text-text-primary bg-surface-alt/50">
      {/* Dynamic Background Ornaments */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/80 via-white/20 to-transparent z-0" />
      <div className="pointer-events-none absolute -right-24 top-12 h-64 w-64 rounded-full bg-electric-blue/5 blur-[100px] z-0 animate-float" />
      <div className="pointer-events-none absolute -left-24 bottom-20 h-64 w-64 rounded-full bg-mars-orange/5 blur-[100px] z-0 animate-float" style={{ animationDelay: '2s' }} />
      
      {/* Content Layer */}
      <div className="relative z-10 w-full min-h-full">
        <div className={cn(
          "p-4 sm:p-6 md:p-8 lg:p-10",
          "max-w-7xl mx-auto w-full",
          "transition-all duration-500 ease-in-out"
        )}>
          {children}
        </div>
      </div>
    </div>
  )
}

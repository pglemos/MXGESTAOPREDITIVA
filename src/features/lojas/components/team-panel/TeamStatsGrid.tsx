import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { Typography } from '@/components/atoms/Typography'
import { cn } from '@/lib/utils'

export type TeamStat = {
  label: string
  shortLabel: string
  value: number
  icon: LucideIcon
  tone: string
  color: string
}

export function TeamStatsGrid({ stats }: { stats: TeamStat[] }) {
  return (
    <div className="grid grid-cols-4 gap-2 md:gap-6 shrink-0 mt-4">
      {stats.map((item, idx) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="p-2 sm:p-6 rounded-2xl sm:rounded-2xl bg-white border border-gray-200 relative overflow-hidden group shadow-lg hover:shadow-xl transition-all h-16 sm:h-24 flex items-center"
        >
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-70 transition-opacity", item.color)} />
          <div className="flex items-center justify-between relative z-10 w-full">
            <div className="space-y-0.5 min-w-0">
              <Typography variant="tiny" tone="muted" className="block uppercase tracking-widest font-black text-[9px] opacity-60 truncate">
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Typography>
              <Typography variant="h1" className="text-2xl sm:text-3xl font-black tabular-nums leading-none font-mono tabular-nums">{item.value}</Typography>
            </div>
            <div className={cn(
              "hidden sm:flex w-12 h-12 rounded-2xl items-center justify-center bg-white shadow-md border border-gray-200 text-gray-500 transition-all group-hover:rotate-6 group-hover:border-emerald-600/20 group-hover:text-emerald-600",
              item.tone === 'brand' && "text-emerald-600"
            )}>
              <item.icon size={20} strokeWidth={2} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

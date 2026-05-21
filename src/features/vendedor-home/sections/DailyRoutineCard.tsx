import { Clock } from 'lucide-react'
import { Typography } from '@/components/atoms/Typography'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/molecules/Card'
import { DAILY_ROUTINE_SLOTS } from '../data/dailyRoutine'

/**
 * Card "Rotina MX" — 7 slots da agenda de alta performance.
 * Story 3.4 reconciliada (ADR-0050).
 */
export function DailyRoutineCard() {
  return (
    <Card className="p-mx-lg md:p-mx-xl border border-border-default shadow-mx-lg bg-white rounded-mx-4xl">
      <CardHeader className="flex flex-row items-center gap-mx-sm mb-12 p-mx-0 bg-transparent border-none">
        <div className="w-mx-12 h-mx-12 md:w-mx-14 md:h-mx-14 rounded-mx-xl bg-status-info-surface text-status-info border border-status-info/10 flex items-center justify-center shadow-mx-inner shrink-0">
          <Clock size={24} />
        </div>
        <div>
          <CardTitle className="text-2xl md:text-3xl uppercase tracking-tighter leading-none font-black">
            Rotina MX
          </CardTitle>
          <CardDescription className="uppercase font-black text-mx-tiny tracking-mx-widest">
            AGENDA DE ALTA PERFORMANCE
          </CardDescription>
        </div>
      </CardHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-md">
        {DAILY_ROUTINE_SLOTS.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-mx-md p-mx-md rounded-mx-2xl bg-surface-alt border border-border-default hover:bg-white hover:shadow-mx-sm transition-all group/task"
          >
            <Typography
              variant="mono"
              tone="brand"
              className="text-sm font-black shrink-0 font-mono-numbers"
            >
              {r.time}
            </Typography>
            <div className="w-px h-mx-lg bg-border-strong opacity-30 group-hover/task:bg-brand-primary/30 transition-colors" />
            <div className="min-w-0">
              <Typography
                variant="h3"
                className="text-sm block mb-0.5 uppercase font-black truncate"
              >
                {r.task}
              </Typography>
              <Typography
                variant="tiny"
                tone="muted"
                className="lowercase tracking-normal italic opacity-60 line-clamp-1 text-mx-tiny"
              >
                "{r.desc}"
              </Typography>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default DailyRoutineCard

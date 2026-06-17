import { motion } from 'motion/react'
import { TrendingUp, Zap } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Card, CardHeader } from '@/components/molecules/Card'

interface WeeklySprintAsideProps {
  vendasSemana: number
  weeklyProgressPct: number
}

/**
 * Aside "Weekly Sprint" — performance da semana com barra de progresso animada.
 * Story 3.4 reconciliada (ADR-0050).
 */
export function WeeklySprintAside({
  vendasSemana,
  weeklyProgressPct,
}: WeeklySprintAsideProps) {
  return (
    <aside className="lg:col-span-4 h-full">
      <Card className="bg-mx-black text-white p-mx-lg md:p-mx-xl h-full border-none shadow-mx-xl relative overflow-hidden group min-h-mx-96 rounded-mx-4xl">
        <div
          className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 via-transparent to-transparent z-0 opacity-50 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -right-20 -bottom-20 opacity-5 group-hover:rotate-12 transition-transform duration-700 pointer-events-none"
          aria-hidden="true"
        >
          <Zap size={400} fill="currentColor" />
        </div>

        <CardHeader className="flex flex-row items-center justify-between mb-16 relative z-10 p-mx-0 bg-transparent border-none">
          <div className="w-mx-14 h-mx-14 rounded-mx-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-mx-inner group-hover:bg-brand-primary transition-colors shrink-0">
            <TrendingUp size={24} />
          </div>
          <Badge
            variant="outline"
            className="text-white border-white/20 px-4 font-bold text-mx-nano h-mx-md uppercase tracking-mx-widest"
          >
            WEEKLY SPRINT
          </Badge>
        </CardHeader>

        <div className="relative z-10 space-y-mx-2xl">
          <div className="space-y-mx-lg">
            <Typography
              variant="tiny"
              tone="brand"
              className="tracking-mx-widest font-bold uppercase"
            >
              PERFORMANCE DA SEMANA
            </Typography>
            <div className="flex items-baseline gap-mx-sm">
              <Typography
                variant="h1"
                tone="white"
                className="text-6xl sm:text-8xl font-bold font-mono-numbers leading-none tracking-tighter"
              >
                {vendasSemana}
              </Typography>
              <Typography
                variant="tiny"
                tone="white"
                className="uppercase font-bold text-mx-tiny opacity-40"
              >
                UNIDADES
              </Typography>
            </div>
            <div className="h-mx-xs w-full bg-white/5 rounded-mx-full overflow-hidden border border-white/5 p-mx-tiny shadow-mx-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${weeklyProgressPct}%` }}
                transition={{ duration: 2 }}
                className="h-full bg-gradient-to-r from-brand-primary to-brand-primary/50 rounded-mx-full shadow-mx-glow-brand"
              />
            </div>
          </div>
          <Typography
            variant="p"
            tone="white"
            className="text-base md:text-lg italic opacity-60 leading-relaxed uppercase tracking-tight font-bold italic"
          >
            "O sucesso é a soma de pequenos esforços repetidos dia após dia."
          </Typography>
        </div>
      </Card>
    </aside>
  )
}

export default WeeklySprintAside

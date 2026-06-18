import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Zap } from 'lucide-react'
import { CHECKIN_DEADLINE_LABEL, CHECKIN_EDIT_LIMIT_LABEL } from '@/hooks/useCheckins'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'

interface DailyCheckinBannerProps {
  referenceDateLabel: string
}

/**
 * Banner promovendo o Fechamento Diário pendente.
 * Story 3.4 reconciliada (ADR-0050).
 */
export function DailyCheckinBanner({ referenceDateLabel }: DailyCheckinBannerProps) {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="shrink-0"
      aria-labelledby="daily-checkin-title"
    >
      <Link
        to="/vendedor/terminal-mx"
        className="group relative grid w-full min-w-0 gap-mx-lg overflow-hidden rounded-mx-3xl bg-brand-primary p-mx-md text-white shadow-mx-xl transition-all hover:-translate-y-0.5 hover:shadow-mx-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/30 md:grid-cols-[1fr_auto] md:items-center md:p-mx-lg"
      >
        <div
          className="absolute inset-y-mx-0 right-mx-0 w-1/2 bg-gradient-to-l from-white/15 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative z-10 flex min-w-0 flex-col gap-mx-md sm:flex-row sm:items-center">
          <div className="flex h-mx-16 w-mx-16 shrink-0 items-center justify-center rounded-mx-2xl border border-white/15 bg-white/10 shadow-mx-lg transition-transform group-hover:rotate-3">
            <Zap size={28} className="fill-white/20" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-mx-xs">
            <div className="flex flex-wrap items-center gap-mx-xs">
              <Badge
                variant="outline"
                className="border-white/20 bg-white/15 px-3 py-1 text-white shadow-none"
              >
                Pendente
              </Badge>
              <Typography
                variant="tiny"
                tone="white"
                className="font-bold tracking-mx-widest opacity-75"
              >
                Prazo {CHECKIN_DEADLINE_LABEL} · Edição até {CHECKIN_EDIT_LIMIT_LABEL}
              </Typography>
            </div>
            <Typography
              id="daily-checkin-title"
              variant="h2"
              tone="white"
              className="text-xl leading-tight sm:text-3xl"
            >
              Fechamento Diário
            </Typography>
            <Typography variant="p" tone="white" className="max-w-3xl text-sm opacity-85">
              Etapa 1: produção de {referenceDateLabel}. Etapa 2: Central de Execução de hoje. As datas ficam
              separadas para evitar troca no início do expediente.
            </Typography>
          </div>
        </div>
        <div className="relative z-10 flex min-w-0 items-center justify-between gap-mx-md rounded-mx-2xl bg-white px-mx-md py-mx-sm text-brand-secondary shadow-mx-lg md:min-w-mx-64">
          <div className="min-w-0">
            <Typography variant="tiny" className="block text-brand-secondary/60">
              Ação obrigatória
            </Typography>
            <Typography variant="caption" className="block truncate text-brand-secondary">
              Abrir Fechamento
            </Typography>
          </div>
          <div className="flex h-mx-12 w-mx-12 shrink-0 items-center justify-center rounded-mx-xl bg-brand-primary text-white transition-transform group-hover:translate-x-1">
            <ArrowRight size={20} strokeWidth={3} aria-hidden="true" />
          </div>
        </div>
      </Link>
    </motion.section>
  )
}

export default DailyCheckinBanner

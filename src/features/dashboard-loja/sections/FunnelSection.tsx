import { useCallback } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { MotionCard, MotionList, MotionRow, duration, easing } from '@/design/motion'

type FunnelData = {
  tx_lead_agd: number
  tx_agd_visita: number
  tx_visita_vnd: number
}

type FunnelBenchmarks = {
  leadAgd: number
  agdVisita: number
  visitaVnd: number
}

type FunnelSectionProps = {
  funilData: FunnelData
  funnelBenchmarks: FunnelBenchmarks
}

/**
 * Fluxo de Escoamento — taxas de conversão lead→agd→visita→venda contra benchmarks.
 * Extraído de DashboardLoja.tsx (Story 2.5).
 */
export function FunnelSection({ funilData, funnelBenchmarks }: FunnelSectionProps) {
  const reduceMotion = useReducedMotion()
  const funnelInterpretation = useCallback((value: number, benchmark: number) => {
    if (value >= benchmark) return 'Dentro ou acima do benchmark; mantenha a cadência e monitore volume.'
    const gap = Math.max(benchmark - value, 0)
    return `Abaixo do benchmark em ${gap} p.p.; priorize ação nesta etapa antes da próxima reunião.`
  }, [])

  const steps = [
    { from: 'Leads', to: 'Agendamentos', val: funilData.tx_lead_agd, bench: funnelBenchmarks.leadAgd },
    { from: 'Agendamentos', to: 'Visitas', val: funilData.tx_agd_visita, bench: funnelBenchmarks.agdVisita },
    { from: 'Visitas', to: 'Vendas', val: funilData.tx_visita_vnd, bench: funnelBenchmarks.visitaVnd },
  ]

  return (
    <MotionCard className="w-full">
      <Card className="w-full rounded-mx-lg border border-border-subtle bg-white overflow-hidden shadow-mx-sm">
      <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-md">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg md:text-xl uppercase tracking-tighter">Fluxo de Escoamento</CardTitle>
            <CardDescription className="uppercase tracking-widest font-black mt-1 text-mx-tiny">TAXAS DE CONVERSÃO & BENCHMARKS MX</CardDescription>
          </div>
          <div className="hidden sm:flex items-baseline gap-mx-xs">
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Eficiência Global</Typography>
            <Typography
              variant="h2"
              tone={funilData.tx_visita_vnd >= funnelBenchmarks.visitaVnd ? 'success' : 'error'}
              className="tabular-nums"
            >
              {funilData.tx_visita_vnd}%
            </Typography>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-mx-md">
        <MotionList className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg md:gap-mx-14">
          {steps.map((step, idx) => (
            <MotionRow key={`${step.from}-${step.to}`} className="space-y-mx-md">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-mx-xs">
                  <div className="w-mx-8 h-mx-8 rounded-mx-lg bg-surface-alt flex items-center justify-center font-black text-text-tertiary text-xs border border-border-default shadow-sm">
                    0{idx + 1}
                  </div>
                  <Typography variant="tiny" className="font-black uppercase tracking-tight">
                    {step.from} <ArrowRight size={10} className="inline opacity-30" /> {step.to}
                  </Typography>
                </div>
                <div className="flex items-baseline gap-mx-xs">
                  <Typography variant="h2" tone={step.val >= step.bench ? 'success' : 'error'} className="text-2xl tabular-nums">
                    {step.val}%
                  </Typography>
                  <Typography variant="tiny" tone="muted" className="font-black text-mx-micro">
                    BENCH {step.bench}%
                  </Typography>
                </div>
              </div>
              <div className="h-mx-xs w-full bg-surface-alt rounded-mx-full overflow-hidden border border-border-default shadow-inner p-px">
                <motion.div
                  initial={reduceMotion ? false : { width: 0 }}
                  animate={{ width: `${Math.min(step.val, 100)}%` }}
                  transition={{ duration: reduceMotion ? 0 : duration.slow, ease: easing.standard as [number, number, number, number] }}
                  className={cn(
                    'h-full rounded-mx-full shadow-sm transition-colors duration-150',
                    step.val >= step.bench
                      ? 'bg-status-success shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'bg-status-error shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                  )}
                />
              </div>
              <Typography variant="p" tone="muted" className="text-sm">
                {funnelInterpretation(step.val, step.bench)}
              </Typography>
            </MotionRow>
          ))}
        </MotionList>
      </CardContent>
      </Card>
    </MotionCard>
  )
}

export default FunnelSection

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  Brain,
  CalendarDays,
  ClipboardList,
  Gauge,
  LineChart,
  Target,
} from 'lucide-react'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import {
  useCentralMxAlerts,
} from '@/features/dashboard-loja/hooks/useCentralMxAlerts'
import { useCentralMxPlanosAcao } from '@/features/dashboard-loja/hooks/useCentralMxPlanosAcao'
import { useCentralMxAgenda } from '@/features/dashboard-loja/hooks/useCentralMxAgenda'
import { useConsultorIa } from '../hooks/useConsultorIa'

/**
 * Central MX — Hub consultivo (Sprint 1, S1-T1).
 *
 * Único ponto de entrada que integra **alertas + planos + score + benchmark +
 * agenda + Consultor IA** em uma visão 360° (ata 2026-05-22 §00:25 "cérebro
 * consultivo"). Cada bloco tem CTA para a tela dedicada já existente.
 *
 * Lê apenas dados persistidos — não duplica engine TS. É leitura executiva
 * com drill-down — não BI tradicional.
 */

type Props = {
  storeId: string | null | undefined
  ownerPath: (section: string, extra?: Record<string, string>) => string
}

const TONE: Record<'success' | 'warning' | 'danger' | 'brand' | 'muted', string> = {
  success: 'border-status-success/30 bg-status-success-surface text-status-success',
  warning: 'border-status-warning/30 bg-status-warning-surface text-status-warning',
  danger: 'border-status-error/30 bg-status-error-surface text-status-error',
  brand: 'border-brand-primary/40 bg-mx-indigo-50 text-brand-primary',
  muted: 'border-border-default bg-surface-alt text-text-secondary',
}

export function CentralMxHub({ storeId, ownerPath }: Props) {
  const alerts = useCentralMxAlerts(storeId)
  const planos = useCentralMxPlanosAcao(storeId)
  const agenda = useCentralMxAgenda(storeId, { windowDays: 14 })
  const consultor = useConsultorIa(storeId)

  const headline = useMemo(() => {
    if (!storeId) return 'Selecione uma loja para abrir o hub consultivo.'
    const critical = alerts.counts.critical + alerts.counts.warning
    const overdue = planos.counts.atrasado
    const segments: string[] = []
    if (critical > 0) segments.push(`${critical} alerta(s) críticos/atenção`)
    if (overdue > 0) segments.push(`${overdue} plano(s) atrasado(s)`)
    if (consultor.solucoes.length > 0)
      segments.push(`${consultor.solucoes.length} sugestão(ões) do consultor`)
    if (agenda.todayCount > 0)
      segments.push(`${agenda.todayCount} compromisso(s) hoje`)
    if (!segments.length) return 'Nenhum sinal crítico ativo. Operação dentro do esperado.'
    return segments.join(' • ')
  }, [
    storeId,
    alerts.counts,
    planos.counts.atrasado,
    consultor.solucoes.length,
    agenda.todayCount,
  ])

  const tiles: Array<{
    title: string
    detail: string
    icon: typeof Bell
    value: string
    tone: keyof typeof TONE
    to: string
  }> = [
    {
      title: 'Alertas inteligentes',
      icon: Bell,
      detail: `${alerts.counts.critical} críticos • ${alerts.counts.warning} atenção`,
      value: (alerts.counts.critical + alerts.counts.warning).toString(),
      tone: alerts.counts.critical > 0 ? 'danger' : alerts.counts.warning > 0 ? 'warning' : 'success',
      to: ownerPath('alertas'),
    },
    {
      title: 'Plano de ação',
      icon: ClipboardList,
      detail: `${planos.counts.atrasado} atrasado(s) • ${planos.counts.pendente} pendente(s)`,
      value: planos.planos.length.toString(),
      tone: planos.counts.atrasado > 0 ? 'danger' : 'brand',
      to: ownerPath('plano-acao'),
    },
    {
      title: 'Score por departamento',
      icon: Gauge,
      detail: 'Métrica oficial — pesos do .docx §250',
      value: 'Ver',
      tone: 'brand',
      to: ownerPath('resultados'),
    },
    {
      title: 'Benchmark',
      icon: LineChart,
      detail: 'Compare a loja com região/porte/segmento',
      value: 'Abrir',
      tone: 'muted',
      to: ownerPath('benchmarking'),
    },
    {
      title: 'Agenda executiva',
      icon: CalendarDays,
      detail: `${agenda.todayCount} hoje • ${agenda.upcomingCount} próximos`,
      value: agenda.events.length.toString(),
      tone: agenda.upcomingCount > 0 ? 'brand' : 'muted',
      to: ownerPath('agenda'),
    },
    {
      title: 'Consultor IA',
      icon: Bot,
      detail: `${consultor.counts.critica} críticas • ${consultor.counts.alta} altas`,
      value: consultor.solucoes.length.toString(),
      tone:
        consultor.counts.critica > 0
          ? 'danger'
          : consultor.counts.alta > 0
            ? 'warning'
            : 'success',
      to: ownerPath('consultor'),
    },
    {
      title: 'Planejamento estratégico',
      icon: Target,
      detail: '5 cards + tabela anual',
      value: 'Abrir',
      tone: 'brand',
      to: ownerPath('planejamento'),
    },
    {
      title: 'Visitas',
      icon: Activity,
      detail: 'PMR, PMR Plus, PPA',
      value: 'Abrir',
      tone: 'muted',
      to: ownerPath('visitas'),
    },
  ]

  return (
    <section className="space-y-mx-lg" aria-label="Central MX">
      <header className="flex flex-col gap-mx-xs md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-mx-sm">
          <div className="rounded-mx-xl bg-brand-primary p-mx-sm text-pure-white shadow-mx-md">
            <Brain size={22} aria-hidden="true" />
          </div>
          <div>
            <Typography variant="h2" className="font-black uppercase tracking-tight">
              Central MX
            </Typography>
            <Typography variant="tiny" tone="muted" className="block font-bold normal-case tracking-normal">
              Cérebro consultivo da loja — `.docx` §120 + ata §00:25.
            </Typography>
          </div>
        </div>
        <Typography variant="p" tone="muted" className="font-bold normal-case tracking-normal">
          {headline}
        </Typography>
      </header>

      <div className="grid grid-cols-1 gap-mx-md md:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.title}
            to={tile.to}
            className={cn(
              'flex flex-col gap-mx-sm rounded-mx-2xl border p-mx-md transition-shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/30 hover:shadow-mx-md',
              TONE[tile.tone],
            )}
          >
            <div className="flex items-start justify-between gap-mx-xs">
              <div className="rounded-mx-xl bg-white/40 p-mx-xs">
                <tile.icon size={18} aria-hidden="true" />
              </div>
              <Typography variant="h3" className="font-black">
                {tile.value}
              </Typography>
            </div>
            <Typography variant="caption" className="font-black uppercase tracking-widest">
              {tile.title}
            </Typography>
            <Typography variant="tiny" className="font-bold normal-case tracking-normal">
              {tile.detail}
            </Typography>
            <span className="inline-flex items-center gap-mx-tiny text-mx-tiny font-black uppercase tracking-widest">
              Abrir <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>

      <Card className="rounded-mx-2xl border border-dashed border-brand-primary/40 bg-mx-indigo-50 p-mx-md text-brand-primary">
        <div className="flex items-start gap-mx-sm">
          <AlertTriangle size={20} aria-hidden="true" />
          <div>
            <Typography variant="h3" className="font-black">
              Sem LLM, sem IA preditiva
            </Typography>
            <Typography variant="tiny" className="block font-bold normal-case tracking-normal">
              A Central MX 2026 é rules-based. Engines e sugestões saem de regras determinísticas
              auditáveis (NFR-IA1). Aprovação para LLM/preditivo fica para roadmap posterior.
            </Typography>
          </div>
        </div>
      </Card>
    </section>
  )
}

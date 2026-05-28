import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { BarChart3, CalendarDays, Gauge, Target, TrendingUp, Zap } from 'lucide-react'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { GlossaryHint } from '@/components/molecules/GlossaryHint'
import { isPerfilInternoMx } from '@/hooks/useAuth'
import { calcularProjecao, getDiasInfo } from '@/lib/calculations'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database'

type Seller = { name: string; checkin_today?: boolean }

type LatestDRE = { net_profit: number } | null
type ManagerTone = 'brand' | 'success' | 'warning' | 'danger' | 'info'

type KpisSectionProps = {
  role: UserRole | null
  isOwner: boolean
  metrics: {
    goalValue: number
    attainment: number
    totalSales: number
    totalLeads: number
    totalAgd: number
    totalVis: number
    checkedInCount: number
  }
  funilData: {
    tx_lead_agd: number
    tx_agd_visita: number
    tx_visita_vnd: number
  }
  funnelBenchmarks: {
    leadAgd: number
    agdVisita: number
    visitaVnd: number
  }
  referenceDate: string
  sellers: Seller[] | null | undefined
  pendingDisciplineSellers: Seller[]
  latestDRE: LatestDRE
}

/**
 * 5 cards de KPI da loja (meta, vendido, leads, visitas, disciplina) + DRE
 * para perfis internos/dono. Extraído de DashboardLoja.tsx (Story 2.5).
 */
export function KpisSection({
  role,
  isOwner,
  metrics,
  funilData,
  funnelBenchmarks,
  referenceDate,
  sellers,
  pendingDisciplineSellers,
  latestDRE,
}: KpisSectionProps) {
  const navigate = useNavigate()
  const sellersTotal = (sellers || []).length
  const dias = getDiasInfo(referenceDate, 'calendar')
  const projection = calcularProjecao(metrics.totalSales, dias.decorridos, dias.total)
  const disciplinePct = sellersTotal > 0 ? Math.round((metrics.checkedInCount / sellersTotal) * 100) : 0
  const conversionScore = funnelBenchmarks.visitaVnd > 0
    ? Math.min(100, Math.round((funilData.tx_visita_vnd / funnelBenchmarks.visitaVnd) * 100))
    : 0
  const mxScore = Math.round((Math.min(metrics.attainment, 100) * 0.45) + (conversionScore * 0.35) + (disciplinePct * 0.2))

  if (role === 'gerente' && !isOwner) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-mx-md md:gap-mx-lg shrink-0">
        <ManagerMetricCard
          title="Meta"
          value={metrics.goalValue || '--'}
          detail={`${metrics.attainment}% atingido`}
          icon={<Target size={22} />}
          tone="brand"
        />
        <ManagerMetricCard
          title="Realizado"
          value={metrics.totalSales}
          detail="vendas no período"
          icon={<BarChart3 size={22} />}
          tone={metrics.attainment >= 80 ? 'success' : 'warning'}
        />
        <ManagerMetricCard
          title="Projeção"
          value={projection || '--'}
          detail="ritmo de fechamento"
          icon={<Zap size={22} />}
          tone={projection >= metrics.goalValue && metrics.goalValue > 0 ? 'success' : 'warning'}
        />
        <ManagerMetricCard
          title="Agendamentos Hoje"
          value={metrics.totalAgd}
          detail="agenda comercial"
          icon={<CalendarDays size={22} />}
          tone="info"
        />
        <ManagerMetricCard
          title="Conversão"
          value={`${funilData.tx_visita_vnd}%`}
          detail={`visita > venda · meta ${funnelBenchmarks.visitaVnd}%`}
          icon={<TrendingUp size={22} />}
          tone={funilData.tx_visita_vnd >= funnelBenchmarks.visitaVnd ? 'success' : 'danger'}
        />
        <ManagerMetricCard
          title="MX Score"
          value={mxScore}
          detail={`${disciplinePct}% disciplina`}
          icon={<Gauge size={22} />}
          tone={mxScore >= 75 ? 'success' : mxScore >= 60 ? 'warning' : 'danger'}
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-mx-md md:gap-mx-lg shrink-0">
      <Card className="p-mx-lg border-none bg-brand-secondary text-white shadow-mx-xl">
        <Typography variant="tiny" tone="white" className="opacity-50 mb-2 block font-black uppercase tracking-widest text-mx-tiny">Meta de Vendas</Typography>
        <Typography variant="h1" tone="white" className="text-4xl sm:text-5xl tabular-nums leading-none mb-2 tracking-tighter font-mono-numbers">{metrics.goalValue}</Typography>
        <Badge variant="outline" className="bg-white text-brand-secondary border-white font-black h-mx-md uppercase text-mx-tiny shadow-mx-sm">{metrics.attainment}% ATINGIDO</Badge>
      </Card>

      <Card className="p-mx-lg border-none shadow-mx-lg bg-white">
        <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny">Vendido Período</Typography>
        <Typography variant="h1" className="text-4xl sm:text-5xl tabular-nums leading-none mb-2 tracking-tighter font-mono-numbers">{metrics.totalSales}</Typography>
        <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest text-mx-tiny">REFERÊNCIA REAL-TIME</Typography>
      </Card>

      <Card className="p-mx-lg border-none shadow-mx-lg bg-white">
        <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny">Leads Gerados</Typography>
        <div className="flex items-baseline gap-mx-xs mb-2">
          <Typography variant="h1" className="text-4xl sm:text-5xl tabular-nums leading-none tracking-tighter font-mono-numbers">{metrics.totalLeads}</Typography>
          <Typography variant="h3" tone="muted" className="text-xl font-black uppercase opacity-20">LEADS</Typography>
        </div>
        <Typography variant="tiny" tone="info" className="font-black uppercase tracking-widest text-mx-tiny">ENTRADA DO FUNIL</Typography>
      </Card>

      <Card className="p-mx-lg border-none shadow-mx-lg bg-white">
        <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny">Visitas Realizadas</Typography>
        <div className="flex items-baseline gap-mx-xs mb-2">
          <Typography variant="h1" className="text-4xl sm:text-5xl tabular-nums leading-none tracking-tighter font-mono-numbers">{metrics.totalVis}</Typography>
          <Typography variant="h3" tone="muted" className="text-xl font-black uppercase opacity-20">VIS</Typography>
        </div>
        <Typography variant="tiny" tone="warning" className="font-black uppercase tracking-widest text-mx-tiny">MEIO DO FUNIL</Typography>
      </Card>

      <Card className="p-mx-lg border-none shadow-mx-lg bg-white">
        <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny">
          <GlossaryHint term="Saúde Disciplinar" definition="Percentual da equipe que realizou o lançamento diário obrigatório." />
        </Typography>
        <Typography
          variant="h1"
          tone={metrics.checkedInCount < sellersTotal ? 'error' : 'success'}
          className="text-4xl sm:text-5xl tabular-nums leading-none mb-2 tracking-tighter font-mono-numbers"
        >
          {metrics.checkedInCount}
          <span className="text-text-tertiary text-2xl font-black">/{sellersTotal}</span>
        </Typography>
        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-mx-tiny">REGISTROS SINCRONIZADOS</Typography>
        {pendingDisciplineSellers.length > 0 && (
          <div className="mt-mx-sm rounded-mx-xl border border-status-warning/20 bg-status-warning-surface p-mx-sm">
            <Typography variant="tiny" className="block font-black uppercase tracking-widest text-status-warning">Pendentes</Typography>
            <Typography variant="p" className="mt-mx-tiny text-sm text-status-warning line-clamp-2">
              {pendingDisciplineSellers.slice(0, 3).map(seller => seller.name).join(', ')}
              {pendingDisciplineSellers.length > 3 ? ` +${pendingDisciplineSellers.length - 3}` : ''}
            </Typography>
            {role === 'gerente' && (
              <Button type="button" variant="outline" size="sm" onClick={() => navigate('/rotina')} className="mt-mx-sm h-mx-9 rounded-mx-lg bg-white text-status-warning">
                Resolver na rotina
              </Button>
            )}
          </div>
        )}
      </Card>

      {(isPerfilInternoMx(role) || role === 'dono') && latestDRE && (
        <Card className="p-mx-lg bg-white shadow-mx-lg border-none animate-in slide-in-from-right duration-500 delay-300">
          <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny text-brand-primary">Lucratividade Preditiva (DRE)</Typography>
          <div className="flex items-baseline gap-mx-xs mb-mx-xs">
            <Typography variant="tiny" tone="muted" className="font-black text-mx-nano">R$</Typography>
            <Typography variant="h1" tone={latestDRE.net_profit >= 0 ? 'success' : 'error'} className="text-4xl sm:text-5xl tabular-nums leading-none tracking-tighter font-mono-numbers">
              {Math.round(latestDRE.net_profit).toLocaleString('pt-BR')}
            </Typography>
          </div>
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-mx-tiny">RESULTADO LÍQUIDO MÊS</Typography>
        </Card>
      )}
      {(isPerfilInternoMx(role) || role === 'dono') && !latestDRE && (
        <Card className="p-mx-lg bg-white shadow-mx-lg border-none">
          <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny text-brand-primary">Lucratividade Preditiva (DRE)</Typography>
          <Typography variant="h3" className="mb-mx-xs uppercase">DRE pendente</Typography>
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-mx-tiny">
            {isOwner ? 'SOLICITE CADASTRO AO ADMIN MX' : 'RESULTADO INDISPONÍVEL'}
          </Typography>
        </Card>
      )}
    </div>
  )
}

function managerToneClasses(tone: ManagerTone) {
  return {
    brand: 'bg-mx-indigo-50 text-brand-primary border-mx-indigo-100',
    success: 'bg-status-success-surface text-status-success border-status-success/20',
    warning: 'bg-status-warning-surface text-status-warning border-status-warning/20',
    danger: 'bg-status-error-surface text-status-error border-status-error/20',
    info: 'bg-status-info-surface text-status-info border-status-info/20',
  }[tone]
}

function ManagerMetricCard({
  title,
  value,
  detail,
  icon,
  tone,
}: {
  title: string
  value: string | number
  detail: string
  icon: ReactNode
  tone: ManagerTone
}) {
  return (
    <Card className="min-h-[144px] border-none bg-white p-mx-lg shadow-mx-lg">
      <div className="flex items-start justify-between gap-mx-sm">
        <div className="min-w-0">
          <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny">
            {title}
          </Typography>
          <Typography variant="h1" className="text-3xl sm:text-4xl tabular-nums leading-none tracking-tighter font-mono-numbers">
            {value}
          </Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-black uppercase tracking-tight">
            {detail}
          </Typography>
        </div>
        <div className={cn('h-mx-12 w-mx-12 rounded-mx-xl border flex shrink-0 items-center justify-center shadow-mx-inner', managerToneClasses(tone))}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

export default KpisSection

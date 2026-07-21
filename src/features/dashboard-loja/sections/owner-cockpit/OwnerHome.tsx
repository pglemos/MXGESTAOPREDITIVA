import { Box, CalendarCheck2, DollarSign, ShoppingCart } from 'lucide-react'
import type { OwnerPerformanceAlert } from '../PerformanceAlerts'
import type { ActionRow, DashboardData, DepartmentScore } from './types'
import { formatCurrency, formatInteger, formatPercent } from './format'
import { MXScoreCompact, OwnerKpiCard } from './primitives'
import {
  ConsultantMxCard,
  NextActionsCard,
  OwnerAlertList,
  OwnerDepartmentScoreGrid,
  PriorityIntervention,
  SalesGoalCard,
} from './OwnerHomeWidgets'

export function OwnerHome({
  data,
  alerts,
  actions,
  departments,
  mxScore,
  marginPercent,
  onOpenConsultant,
}: {
  data: DashboardData
  alerts: OwnerPerformanceAlert[]
  actions: ActionRow[]
  departments: DepartmentScore[]
  mxScore: number | null
  marginPercent: number | null
  onOpenConsultant: () => void
}) {
  const grossProfit = data.latestDRE?.gross_profit
  const confirmedAppointments = (data.checkins || [])
    .filter(checkin => checkin.reference_date === data.referenceDate)
    .reduce(
      (total, checkin) => total + (checkin.agd_cart_today || 0) + (checkin.agd_net_today || 0),
      0,
    )
  const salesForecast = confirmedAppointments / 3
  const dailyNeed = data.metrics.goalValue > 0 ? data.metrics.goalValue / 25 : 0
  const forecastIsHealthy = dailyNeed <= 0 || salesForecast >= dailyNeed
  const forecastLabel = salesForecast.toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(salesForecast) ? 0 : 1,
    maximumFractionDigits: 1,
  })
  const dailyNeedLabel = dailyNeed.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  const priorityAlert = alerts.find(alert => alert.variant === 'danger') || alerts[0] || null

  return (
    <>
      <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_220px]">
        <OwnerKpiCard
          title="Previsão de Vendas Hoje"
          value={`${forecastLabel} ${salesForecast === 1 ? 'venda' : 'vendas'}`}
          detail={`${formatInteger(confirmedAppointments)} agendamentos do dia · necessidade ${dailyNeedLabel}`}
          icon={<CalendarCheck2 size={20} />}
          tone={forecastIsHealthy ? 'success' : 'warning'}
          chart="bars"
          seed={5}
        />
        <OwnerKpiCard
          title="Lucro Bruto"
          value={formatCurrency(grossProfit)}
          detail={grossProfit === undefined ? 'DRE pendente' : marginPercent === null ? '▲ vs mês anterior' : `Margem ${formatPercent(marginPercent)}`}
          icon={<DollarSign size={20} />}
          tone={grossProfit === undefined ? 'muted' : 'success'}
          chart="line"
          seed={1}
          showStatusDot={grossProfit !== undefined}
        />
        <OwnerKpiCard
          title="Volume de Vendas"
          value={`${formatInteger(data.metrics.totalSales)} ${data.metrics.totalSales === 1 ? 'veículo' : 'veículos'}`}
          detail={data.metrics.goalValue > 0 ? `${data.metrics.attainment}% da meta` : '▲ vs mês anterior'}
          icon={<ShoppingCart size={20} />}
          tone="purple"
          statusTone={data.metrics.attainment >= 100 ? 'success' : data.metrics.attainment >= 60 ? 'warning' : 'danger'}
          chart="bars"
          seed={3}
        />
        {/* TODO: sem pipeline de dado de estoque/veículos parados no app — nenhuma tabela/hook expõe idade de estoque hoje */}
        <OwnerKpiCard
          title="Estoque (Unid.)"
          value="--"
          detail="Dados indisponíveis"
          icon={<Box size={20} />}
          tone="muted"
          chart="line"
          seed={4}
          showStatusDot={false}
        />
        <MXScoreCompact score={mxScore} />
      </div>

      <PriorityIntervention alert={priorityAlert} onOpenConsultant={onOpenConsultant} />

      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)_minmax(340px,0.9fr)]">
        <SalesGoalCard data={data} />
        <OwnerAlertList alerts={alerts} />
        <NextActionsCard actions={actions} />
      </div>

      <OwnerDepartmentScoreGrid departments={departments} />

      <ConsultantMxCard onOpenConsultant={onOpenConsultant} />
    </>
  )
}

import { Box, DollarSign, Gauge, ShoppingCart } from 'lucide-react'
import type { OwnerPerformanceAlert } from '../PerformanceAlerts'
import type { ActionRow, DashboardData, DepartmentScore } from './types'
import { formatCurrency, formatInteger, formatPercent } from './format'
import { MXScoreCompact, OwnerKpiCard } from './primitives'
import {
  NextActionsCard,
  OwnerActionPlanSummary,
  OwnerAlertList,
  OwnerDepartmentScoreGrid,
  OwnerPanoramaChart,
  SalesGoalCard,
} from './OwnerHomeWidgets'

export function OwnerHome({
  data,
  alerts,
  actions,
  departments,
  panoramaData,
  mxScore,
  marginPercent,
}: {
  data: DashboardData
  alerts: OwnerPerformanceAlert[]
  actions: ActionRow[]
  departments: DepartmentScore[]
  panoramaData: Array<{ label: string; planejado: number; realizado: number }>
  mxScore: number | null
  marginPercent: number | null
}) {
  const grossProfit = data.latestDRE?.gross_profit
  return (
    <>
      <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_220px]">
        <OwnerKpiCard
          title="Lucro Bruto"
          value={formatCurrency(grossProfit)}
          detail={grossProfit === undefined ? 'DRE pendente' : '▲ vs mês anterior'}
          icon={<DollarSign size={20} />}
          tone={grossProfit === undefined ? 'muted' : 'success'}
          chart="line"
          seed={1}
        />
        <OwnerKpiCard
          title="% Margem"
          value={formatPercent(marginPercent)}
          detail={marginPercent === null ? 'DRE pendente' : '▲ 1,9 p.p.'}
          icon={<Gauge size={20} />}
          tone={marginPercent === null ? 'muted' : 'info'}
          chart="line"
          seed={2}
        />
        <OwnerKpiCard
          title="Volume de Vendas"
          value={`${formatInteger(data.metrics.totalSales)} ${data.metrics.totalSales === 1 ? 'veículo' : 'veículos'}`}
          detail={data.metrics.goalValue > 0 ? `${data.metrics.attainment}% da meta` : '▲ vs mês anterior'}
          icon={<ShoppingCart size={20} />}
          tone="purple"
          chart="bars"
          seed={3}
        />
        <OwnerKpiCard
          title="Estoque (Unid.)"
          value="Pendente"
          detail="Aguardando fonte"
          icon={<Box size={20} />}
          tone="warning"
          chart="line"
          seed={4}
        />
        <MXScoreCompact score={mxScore} />
      </div>

      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)_minmax(340px,0.9fr)]">
        <SalesGoalCard data={data} />
        <OwnerAlertList alerts={alerts} />
        <NextActionsCard actions={actions} />
      </div>

      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1.35fr)_340px]">
        <OwnerPanoramaChart data={panoramaData} goalValue={data.metrics.goalValue} attainment={data.metrics.attainment} />
        <OwnerActionPlanSummary actions={actions} />
      </div>

      <OwnerDepartmentScoreGrid departments={departments} />
    </>
  )
}

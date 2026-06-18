import { CalendarDays, History, Target, Zap } from 'lucide-react'
import { MXScoreCard } from '@/components/molecules/MXScoreCard'

interface MetricsCardsGridProps {
  vendasOntem: number
  agendamentosHoje: number
  projecao: number
  meta: number | string
  atingimento: number
}

/**
 * Grid de 4 KPIs principais do vendedor: produção ontem, execução, projeção, meta.
 * Story 3.4 reconciliada (ADR-0050).
 */
export function MetricsCardsGrid({
  vendasOntem,
  agendamentosHoje,
  projecao,
  meta,
  atingimento,
}: MetricsCardsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-md md:gap-mx-lg shrink-0">
      <MXScoreCard
        label="Produção Ontem"
        value={vendasOntem}
        sub="CONSOLIDADO"
        icon={History}
        tone="success"
        description="Total de unidades vendidas no dia anterior"
      />
      <MXScoreCard
        label="Execução Hoje"
        value={agendamentosHoje}
        sub="COMPROMISSOS"
        icon={CalendarDays}
        tone="brand"
        description="Quantidade de atendimentos agendados para hoje"
      />
      <MXScoreCard
        label="Projeção MX"
        value={projecao}
        sub="PREDICTIVE"
        icon={Zap}
        tone="brand"
        description="Estimativa de vendas para o fechamento do mês baseada no ritmo atual"
        isHighlight
      />
      <MXScoreCard
        label="Meta do Mês"
        value={meta || '--'}
        sub={`${atingimento}% ATG`}
        icon={Target}
        tone="warning"
        description="Objetivo de vendas definido para o mês vigente"
      />
    </div>
  )
}

export default MetricsCardsGrid

import type {
  ConsultingMetricResult,
  ConsultingMetricTarget,
} from '@/lib/schemas/consulting-client.schema'

export type PmrMvpIndicatorDefinition = {
  metric_key: string
  group: string
  description: string
  source: string
  frequency: string
  visible_to: Array<'admin_mx' | 'dono' | 'gerente'>
  mvp_status: 'available' | 'partial' | 'backlog'
}

export const PMR_MVP_INDICATORS: PmrMvpIndicatorDefinition[] = [
  {
    metric_key: 'sales_total',
    group: 'Vendas',
    description: 'Volume total de vendas no periodo.',
    source: 'entradas_vendas_consultoria, marketing mensal ou financeiro consultoria',
    frequency: 'Mensal / sob demanda',
    visible_to: ['admin_mx', 'dono', 'gerente'],
    mvp_status: 'available',
  },
  {
    metric_key: 'sales_goal',
    group: 'Vendas',
    description: 'Meta planejada de vendas.',
    source: 'metas_metricas_cliente ou metas da loja',
    frequency: 'Mensal',
    visible_to: ['admin_mx', 'dono', 'gerente'],
    mvp_status: 'partial',
  },
  {
    metric_key: 'goal_achievement_rate',
    group: 'Vendas',
    description: 'Percentual de realizacao contra meta planejada.',
    source: 'sales_total / sales_goal',
    frequency: 'Mensal',
    visible_to: ['admin_mx', 'dono', 'gerente'],
    mvp_status: 'partial',
  },
  {
    metric_key: 'leads_received',
    group: 'Funil',
    description: 'Leads recebidos no periodo.',
    source: 'marketing_mensal_consultoria ou lancamento diario',
    frequency: 'Mensal / diario',
    visible_to: ['admin_mx', 'dono', 'gerente'],
    mvp_status: 'available',
  },
  {
    metric_key: 'appointments',
    group: 'Funil',
    description: 'Agendamentos registrados no periodo.',
    source: 'financeiro_consultoria.volume_agendamentos ou lancamento diario',
    frequency: 'Mensal / diario',
    visible_to: ['admin_mx', 'dono', 'gerente'],
    mvp_status: 'partial',
  },
  {
    metric_key: 'visits',
    group: 'Funil',
    description: 'Comparecimentos/visitas comerciais no periodo.',
    source: 'lancamento diario ou importacao futura de fechamento',
    frequency: 'Mensal / diario',
    visible_to: ['admin_mx', 'dono', 'gerente'],
    mvp_status: 'partial',
  },
  {
    metric_key: 'lead_to_appointment_rate',
    group: 'Funil',
    description: 'Conversao de lead para agendamento.',
    source: 'appointments / leads_received',
    frequency: 'Mensal',
    visible_to: ['admin_mx', 'dono', 'gerente'],
    mvp_status: 'available',
  },
  {
    metric_key: 'appointment_to_visit_rate',
    group: 'Funil',
    description: 'Conversao de agendamento para visita.',
    source: 'visits / appointments',
    frequency: 'Mensal',
    visible_to: ['admin_mx', 'dono', 'gerente'],
    mvp_status: 'partial',
  },
  {
    metric_key: 'visit_to_sale_rate',
    group: 'Funil',
    description: 'Conversao de visita para venda.',
    source: 'sales_total / visits',
    frequency: 'Mensal',
    visible_to: ['admin_mx', 'dono', 'gerente'],
    mvp_status: 'partial',
  },
  {
    metric_key: 'internet_investment',
    group: 'Marketing',
    description: 'Investimento em internet no periodo.',
    source: 'marketing_mensal_consultoria.investment',
    frequency: 'Mensal',
    visible_to: ['admin_mx', 'dono', 'gerente'],
    mvp_status: 'available',
  },
  {
    metric_key: 'internet_cost_per_sale',
    group: 'Marketing',
    description: 'Custo por venda originada da internet.',
    source: 'internet_investment / sales_internet',
    frequency: 'Mensal',
    visible_to: ['admin_mx', 'dono', 'gerente'],
    mvp_status: 'available',
  },
  {
    metric_key: 'stock_total',
    group: 'Estoque',
    description: 'Quantidade total de carros em estoque.',
    source: 'snapshots_estoque_consultoria.total_stock',
    frequency: 'Mensal',
    visible_to: ['admin_mx', 'dono', 'gerente'],
    mvp_status: 'available',
  },
  {
    metric_key: 'stock_turnover',
    group: 'Estoque',
    description: 'Giro de estoque calculado por vendas sobre estoque total.',
    source: 'sales_total / stock_total',
    frequency: 'Mensal',
    visible_to: ['admin_mx', 'dono', 'gerente'],
    mvp_status: 'available',
  },
  {
    metric_key: 'stock_over_90_rate',
    group: 'Estoque',
    description: 'Percentual do estoque acima de 90 dias.',
    source: 'snapshots_estoque_consultoria.percent_over_90_days',
    frequency: 'Mensal',
    visible_to: ['admin_mx', 'dono', 'gerente'],
    mvp_status: 'available',
  },
  {
    metric_key: 'trade_in_volume',
    group: 'Troca',
    description: 'Volume de carros de troca no periodo.',
    source: 'campo/importador pendente',
    frequency: 'Mensal',
    visible_to: ['admin_mx', 'dono', 'gerente'],
    mvp_status: 'backlog',
  },
  {
    metric_key: 'avg_margin',
    group: 'Rentabilidade',
    description: 'Margem media por veiculo vendido.',
    source: 'financeiro_consultoria ou entradas_vendas_consultoria',
    frequency: 'Mensal',
    visible_to: ['admin_mx', 'dono'],
    mvp_status: 'available',
  },
]

const MVP_ORDER = new Map(PMR_MVP_INDICATORS.map((indicator, index) => [indicator.metric_key, index]))

export function isPmrMvpIndicator(metricKey: string) {
  return MVP_ORDER.has(metricKey)
}

export function sortByPmrMvpOrder<T extends { metric_key: string }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const aOrder = MVP_ORDER.get(a.metric_key) ?? Number.MAX_SAFE_INTEGER
    const bOrder = MVP_ORDER.get(b.metric_key) ?? Number.MAX_SAFE_INTEGER
    return aOrder - bOrder || a.metric_key.localeCompare(b.metric_key)
  })
}

export function getPmrMvpIndicator(metricKey: string) {
  return PMR_MVP_INDICATORS.find((indicator) => indicator.metric_key === metricKey) || null
}

export function buildLatestTargetByMetric(targets: ConsultingMetricTarget[]) {
  const sorted = [...targets].sort((a, b) => String(b.reference_month).localeCompare(String(a.reference_month)))
  const map = new Map<string, ConsultingMetricTarget>()
  for (const target of sorted) {
    if (!map.has(target.metric_key)) map.set(target.metric_key, target)
  }
  return map
}

export function buildPreviousYearResultByMetric(results: ConsultingMetricResult[]) {
  const latestByMetric = new Map<string, ConsultingMetricResult>()
  const sorted = [...results].sort((a, b) => String(b.reference_date).localeCompare(String(a.reference_date)))

  for (const result of sorted) {
    if (!latestByMetric.has(result.metric_key)) latestByMetric.set(result.metric_key, result)
  }

  const previousByMetric = new Map<string, ConsultingMetricResult>()
  for (const [metricKey, latest] of latestByMetric) {
    const latestMonthDay = String(latest.reference_date).slice(5, 10)
    const latestYear = Number(String(latest.reference_date).slice(0, 4))
    const previousDate = `${latestYear - 1}-${latestMonthDay}`
    const previous = sorted.find((result) => result.metric_key === metricKey && String(result.reference_date).slice(0, 10) === previousDate)
    if (previous) previousByMetric.set(metricKey, previous)
  }

  return previousByMetric
}

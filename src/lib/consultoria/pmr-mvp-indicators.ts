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
  ['sales_goal', 'Vendas', 'Meta planejada de vendas.', 'metas_metricas_cliente', 'Mensal', 'partial'],
  ['sales_total', 'Vendas', 'Volume total de vendas no periodo.', 'entradas_vendas_consultoria', 'Mensal / sob demanda', 'available'],
  ['goal_achievement_rate', 'Vendas', 'Percentual de realizacao contra meta planejada.', 'sales_total / sales_goal', 'Mensal', 'partial'],
  ['sales_door_flow', 'Vendas', 'Vendas originadas do fluxo de porta.', 'entradas_vendas_consultoria', 'Mensal', 'available'],
  ['sales_referral', 'Vendas', 'Vendas originadas de indicacao.', 'entradas_vendas_consultoria', 'Mensal', 'available'],
  ['sales_company_wallet', 'Vendas', 'Vendas originadas da carteira da empresa.', 'entradas_vendas_consultoria', 'Mensal', 'available'],
  ['sales_seller_wallet', 'Vendas', 'Vendas originadas da carteira do vendedor.', 'entradas_vendas_consultoria', 'Mensal', 'available'],
  ['sales_internet', 'Vendas', 'Vendas originadas da internet.', 'entradas_vendas_consultoria', 'Mensal', 'available'],
  ['sales_other', 'Vendas', 'Vendas de outras origens.', 'entradas_vendas_consultoria', 'Mensal', 'available'],
  ['seller_count', 'Equipe', 'Quantidade de vendedores ativos na loja.', 'vinculos_loja / usuarios', 'Mensal', 'available'],
  ['avg_sales_per_seller', 'Equipe', 'Media de vendas por vendedor.', 'sales_total / seller_count', 'Mensal', 'partial'],
  ['active_sellers_rate', 'Equipe', 'Percentual de vendedores ativos no periodo.', 'rotina diaria / equipe', 'Mensal', 'partial'],
  ['leads_received', 'Funil', 'Leads recebidos no periodo.', 'marketing_mensal_consultoria ou lancamento diario', 'Mensal / diario', 'available'],
  ['avg_leads_per_seller', 'Funil', 'Media de leads por vendedor.', 'leads_received / seller_count', 'Mensal', 'partial'],
  ['appointments', 'Funil', 'Agendamentos registrados no periodo.', 'lancamento diario', 'Mensal / diario', 'available'],
  ['visits', 'Funil', 'Comparecimentos/visitas comerciais no periodo.', 'lancamento diario', 'Mensal / diario', 'available'],
  ['appointments_per_sale', 'Funil', 'Quantidade de agendamentos necessaria para gerar venda.', 'appointments / sales_internet', 'Mensal', 'partial'],
  ['lead_to_appointment_rate', 'Funil', 'Conversao de lead para agendamento.', 'appointments / leads_received', 'Mensal', 'available'],
  ['appointment_to_visit_rate', 'Funil', 'Conversao de agendamento para visita.', 'visits / appointments', 'Mensal', 'available'],
  ['visit_to_sale_rate', 'Funil', 'Conversao de visita para venda.', 'sales_total / visits', 'Mensal', 'available'],
  ['no_show_rate', 'Funil', 'Percentual de agendamentos que nao compareceram.', '(appointments - visits) / appointments', 'Mensal', 'partial'],
  ['crm_follow_up_rate', 'CRM', 'Taxa de clientes com retorno/follow-up executado.', 'rotina diaria / CRM', 'Semanal / Mensal', 'partial'],
  ['internet_investment', 'Marketing', 'Investimento em internet no periodo.', 'marketing_mensal_consultoria.investment', 'Mensal', 'available'],
  ['internet_cost_per_sale', 'Marketing', 'Custo por venda originada da internet.', 'internet_investment / sales_internet', 'Mensal', 'available'],
  ['cost_per_lead', 'Marketing', 'Custo por lead recebido.', 'internet_investment / leads_received', 'Mensal', 'partial'],
  ['instagram_followers', 'Marketing', 'Volume de seguidores do Instagram.', 'manual / marketing', 'Mensal', 'available'],
  ['google_rating', 'Marketing', 'Nota no Google Meu Negocio.', 'manual / reputacao', 'Mensal', 'available'],
  ['content_quality', 'Marketing', 'Qualidade do conteudo publicado.', 'diagnostico PMR', 'Mensal', 'available'],
  ['stock_total', 'Estoque', 'Quantidade total de carros em estoque.', 'snapshots_estoque_consultoria', 'Mensal', 'available'],
  ['active_stock', 'Estoque', 'Estoque ativo disponivel para venda.', 'snapshots_estoque_consultoria', 'Mensal', 'available'],
  ['stock_turnover', 'Estoque', 'Giro de estoque calculado por vendas sobre estoque.', 'sales_total / stock_total', 'Mensal', 'available'],
  ['stock_over_90_rate', 'Estoque', 'Percentual do estoque acima de 90 dias.', 'snapshots_estoque_consultoria', 'Mensal', 'available'],
  ['avg_stock_age_days', 'Estoque', 'Idade media do estoque em dias.', 'snapshots_estoque_consultoria', 'Mensal', 'partial'],
  ['trade_in_volume', 'Troca', 'Volume de carros de troca no periodo.', 'lancamento manual / fechamento', 'Mensal', 'available'],
  ['trade_in_to_sales_rate', 'Troca', 'Participacao da troca no volume vendido.', 'trade_in_volume / sales_total', 'Mensal', 'partial'],
  ['trade_in_avg_margin', 'Troca', 'Margem media dos carros de troca.', 'financeiro / fechamento', 'Mensal', 'partial'],
  ['gross_revenue', 'Financeiro', 'Receita bruta do periodo.', 'DRE financeiro', 'Mensal', 'available'],
  ['net_revenue', 'Financeiro', 'Receita liquida do periodo.', 'DRE financeiro', 'Mensal', 'available'],
  ['net_profit', 'Financeiro', 'Lucro liquido do periodo.', 'DRE financeiro', 'Mensal', 'available'],
  ['avg_margin', 'Financeiro', 'Margem media por veiculo vendido.', 'financeiro_consultoria ou DRE', 'Mensal', 'available'],
  ['gross_margin_rate', 'Financeiro', 'Percentual de margem bruta.', 'gross_margin / gross_revenue', 'Mensal', 'partial'],
  ['preparation_cost', 'Financeiro', 'Custo de preparacao dos veiculos.', 'DRE financeiro', 'Mensal', 'available'],
  ['post_sale_cost', 'Financeiro', 'Custo de pos-venda.', 'DRE financeiro', 'Mensal', 'available'],
  ['fixed_expense_rate', 'Financeiro', 'Percentual de despesas fixas sobre receita liquida.', 'fixed_expenses / net_revenue', 'Mensal', 'partial'],
  ['training_completion_rate', 'Desenvolvimento', 'Percentual de conclusao dos treinamentos da equipe.', 'progresso_treinamentos', 'Semanal / Mensal', 'available'],
].map(([metric_key, group, description, source, frequency, mvp_status]) => ({
  metric_key,
  group,
  description,
  source,
  frequency,
  visible_to: group === 'Financeiro' ? ['admin_mx', 'dono'] : ['admin_mx', 'dono', 'gerente'],
  mvp_status,
} as PmrMvpIndicatorDefinition))

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

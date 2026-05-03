import type {
  ConsultingActionItem,
  ConsultingInventorySnapshot,
  ConsultingMarketingMonthly,
  ConsultingMetricCatalogItem,
  ConsultingMetricResult,
  ConsultingParameterValue,
  PmrFormResponse,
} from '@/lib/schemas/consulting-client.schema'

export type PmrInventorySnapshot = ConsultingInventorySnapshot & {
  source_payload?: Record<string, unknown>
}

export type PmrSalesEntry = {
  id?: string
  client_id?: string
  sale_date: string
  seller_name?: string | null
  channel?: string | null
  media?: string | null
  sale_value?: number | null
  purchase_value?: number | null
  preparation_expenses?: number | null
  margin?: number | null
}

export type PmrFinancialRow = {
  id?: string
  client_id?: string
  reference_date: string
  revenue_proprios?: number | null
  revenue_consignados?: number | null
  revenue_repasse?: number | null
  ded_preparacao?: number | null
  exp_marketing?: number | null
  exp_pos_venda?: number | null
  volume_vendas?: number | null
  volume_leads?: number | null
  volume_agendamentos?: number | null
  capital_proprio?: number | null
  net_profit?: number | null
}

export type PmrMetricView = {
  metric_key: string
  label: string
  area: string
  value_type: ConsultingMetricCatalogItem['value_type']
  direction: ConsultingMetricCatalogItem['direction']
  latest_result: number | null
  market_average: number | null
  best_practice: number | null
  status: PmrMetricStatus
}

export type PmrMetricStatus = 'success' | 'warning' | 'danger' | 'outline'

export type PmrActionRecommendation = {
  metric_key?: string | null
  action: string
  how: string
  owner_name: string
  due_date: string | null
  priority: 1 | 2 | 3
  efficacy: string
  visit_number: number | null
}

export type PmrStrategicPlanDraft = {
  title: string
  diagnosisSummary: string
  swot: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  metricRows: PmrMetricView[]
  criticalGaps: PmrMetricView[]
  actions: PmrActionRecommendation[]
  markdown: string
  payload: Record<string, unknown>
}

const SOURCE_PRIORITY: Record<string, number> = {
  manual: 100,
  dre: 90,
  monthly_close: 80,
  imported: 70,
  automatic: 60,
  derived: 50,
}

export const PMR_IMPLEMENTATION_SCHEDULE = [
  { visit: 1, objective: 'Diagnóstico', target: 'Todos', description: 'Formulários de dono, gerente, vendedores e processos, levantamento de indicadores base e evidências.' },
  { visit: 2, objective: 'Planejamento Estratégico, Metodologia Multicanal e Gestão à Vista', target: 'Todos', description: 'Validação do planejamento, treinamento do método vendedor profissional, acompanhamento diário e gestão à vista.' },
  { visit: 3, objective: 'Rotina do Gerente e Rotina do Vendedor', target: 'Gestão e Vendas', description: 'Rituais comerciais, cadência de follow-up, pauta de reunião, plano de remuneração quando aplicável e rotina de produtividade.' },
  { visit: 4, objective: 'Feedback Estruturado e Cultura de Resultado', target: 'Proprietário e Gerente', description: 'Feedback por dados, combinados individuais, ranking, gestão à vista e cultura de responsabilidade.' },
  { visit: 5, objective: 'Plano de Desenvolvimento Individual (PDI)', target: 'Vendedor e Gerente', description: 'PDI por vendedor e gerente, gaps de comportamento e técnica, metas 6/12/24 meses, treinamento e termo de compromisso.' },
  { visit: 6, objective: 'Posicionamento de Marketing, Estratégia de Conteúdo e Tráfego Pago', target: 'Proprietário e Marketing', description: 'Estratégia de conteúdo, responsáveis, datas, canais, tráfego pago, branding e qualidade dos anúncios.' },
  { visit: 7, objective: 'Análise das Implementações e Plano de Ação Trimestral', target: 'Proprietário', description: 'Análise de resultado, revisão de processos críticos, feedback, plano dos próximos 3 meses e acompanhamento online.' },
]

export const PMR_RISK_CONTINGENCIES = [
  {
    title: 'Priorização',
    detail: 'O objetivo não é vender apenas mais um carro; é colocar a empresa no caminho das melhores práticas. Ações combinadas não devem atrasar em dia de visita.',
  },
  {
    title: 'Comando',
    detail: 'O consultor direciona método e acompanhamento, mas a autoridade para cobrar execução é do dono ou gestor responsável.',
  },
  {
    title: 'Organização',
    detail: 'O plano envolve todas as áreas. A delegação precisa sair da gestão, com responsáveis, prazos e evidências.',
  },
  {
    title: 'Treinamento',
    detail: 'Em dia de treinamento, a equipe precisa estar focada para evitar dispersão e perda de resultado.',
  },
  {
    title: 'Comunicação',
    detail: 'A gestão precisa comunicar claramente o objetivo da consultoria para reduzir ruído e aumentar produtividade.',
  },
]

function numberValue(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value ?? '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function monthKey(date?: string | null) {
  return String(date || '').slice(0, 7)
}

function latestMonth<T>(rows: T[], getDate: (row: T) => string | null | undefined) {
  return rows
    .map((row) => monthKey(getDate(row)))
    .filter(Boolean)
    .sort()
    .at(-1) || ''
}

function sameMonth(date: string | null | undefined, month: string) {
  return Boolean(month && monthKey(date) === month)
}

function endOfReferenceMonth(month: string) {
  return month ? `${month}-01` : new Date().toISOString().slice(0, 10)
}

function resultId(metricKey: string, date: string) {
  let hash = 0
  const seed = `${metricKey}:${date}`
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }
  const tail = hash.toString(16).padStart(12, '0').slice(-12)
  return `00000000-0000-4000-8000-${tail}`
}

function buildResult(clientId: string, metricKey: string, referenceDate: string, value: number, sourcePayload: Record<string, unknown>, source = 'automatic'): ConsultingMetricResult {
  return {
    id: resultId(metricKey, referenceDate),
    client_id: clientId,
    metric_key: metricKey,
    reference_date: referenceDate,
    result_value: Math.round(value * 10000) / 10000,
    source,
    source_payload: sourcePayload,
  }
}

function isInternetSource(value?: string | null) {
  const text = normalizeText(value)
  return ['internet', 'digital', 'olx', 'webmotors', 'icarros', 'instagram', 'facebook', 'marketplace', 'meta', 'google', 'trafego'].some((token) => text.includes(token))
}

function isDoorFlow(value?: string | null) {
  const text = normalizeText(value)
  return text.includes('porta') || text.includes('loja') || text.includes('showroom')
}

function isReferral(value?: string | null) {
  return normalizeText(value).includes('indic')
}

function isCompanyWallet(value?: string | null) {
  const text = normalizeText(value)
  return text.includes('carteira empresa') || text.includes('base empresa') || text.includes('crm empresa')
}

function isSellerWallet(value?: string | null) {
  const text = normalizeText(value)
  return text.includes('carteira vendedor') || text.includes('base vendedor') || text.includes('whatsapp') || text.includes('status')
}

function getSourcePayloadNumber(row: ConsultingInventorySnapshot | undefined, key: string) {
  const payload = (row as PmrInventorySnapshot | undefined)?.source_payload
  return numberValue(payload?.[key])
}

function setIfMeaningful(map: Map<string, ConsultingMetricResult>, result: ConsultingMetricResult, allowZero = false) {
  if (!allowZero && result.result_value === 0) return
  map.set(result.metric_key, result)
}

export function computeDreLike(row?: PmrFinancialRow | null) {
  if (!row) {
    return {
      gross_margin: 0,
      net_profit: 0,
      margin_per_car: 0,
      prep_cost_per_car: 0,
      posvenda_per_car: 0,
      cac: 0,
      lead_to_agd_rate: 0,
      appointments_per_sale: 0,
    }
  }
  const sales = numberValue(row.volume_vendas)
  const leads = numberValue(row.volume_leads)
  const appointments = numberValue(row.volume_agendamentos)
  const grossMargin = numberValue(row.revenue_proprios) + numberValue(row.revenue_consignados) + numberValue(row.revenue_repasse)
  const netProfit = numberValue(row.net_profit)
  return {
    gross_margin: grossMargin,
    net_profit: netProfit,
    margin_per_car: sales > 0 ? grossMargin / sales : 0,
    prep_cost_per_car: sales > 0 ? numberValue(row.ded_preparacao) / sales : 0,
    posvenda_per_car: sales > 0 ? numberValue(row.exp_pos_venda) / sales : 0,
    cac: sales > 0 ? numberValue(row.exp_marketing) / sales : 0,
    lead_to_agd_rate: leads > 0 ? appointments / leads : 0,
    appointments_per_sale: sales > 0 ? appointments / sales : 0,
  }
}

export function derivePmrMetricResults(input: {
  clientId: string
  marketing?: ConsultingMarketingMonthly[]
  sales?: PmrSalesEntry[]
  inventory?: PmrInventorySnapshot[]
  financials?: PmrFinancialRow[]
  source?: string
}) {
  const source = input.source || 'automatic'
  const results = new Map<string, ConsultingMetricResult>()
  const marketing = input.marketing || []
  const sales = input.sales || []
  const inventory = input.inventory || []
  const financials = input.financials || []

  const latestMarketingMonth = latestMonth(marketing, (row) => row.reference_month)
  const latestSalesMonth = latestMonth(sales, (row) => row.sale_date)
  const latestInventoryMonth = latestMonth(inventory, (row) => row.reference_month)
  const latestFinancialMonth = latestMonth(financials, (row) => row.reference_date)
  const referenceMonth = [latestMarketingMonth, latestSalesMonth, latestInventoryMonth, latestFinancialMonth].filter(Boolean).sort().at(-1) || ''
  const referenceDate = endOfReferenceMonth(referenceMonth)

  const marketingRows = marketing.filter((row) => sameMonth(row.reference_month, latestMarketingMonth || referenceMonth))
  const salesRows = sales.filter((row) => sameMonth(row.sale_date, latestSalesMonth || referenceMonth))
  const inventoryRow = inventory
    .filter((row) => sameMonth(row.reference_month, latestInventoryMonth || referenceMonth))
    .sort((a, b) => String(b.reference_month).localeCompare(String(a.reference_month)))[0]
  const financialRow = financials
    .filter((row) => sameMonth(row.reference_date, latestFinancialMonth || referenceMonth))
    .sort((a, b) => String(b.reference_date).localeCompare(String(a.reference_date)))[0]

  const leads = marketingRows.reduce((sum, row) => sum + numberValue(row.leads_volume), 0)
  const marketingInvestment = marketingRows.reduce((sum, row) => sum + numberValue(row.investment), 0)
  const marketingSales = marketingRows.reduce((sum, row) => sum + numberValue(row.sales_volume), 0)

  const sellers = new Set(salesRows.map((row) => String(row.seller_name || '').trim()).filter(Boolean))
  const salesCount = salesRows.length || marketingSales || numberValue(financialRow?.volume_vendas)
  const internetSalesFromEntries = salesRows.filter((row) => isInternetSource(row.channel) || isInternetSource(row.media)).length
  const internetSales = internetSalesFromEntries || marketingSales
  const doorSales = salesRows.filter((row) => isDoorFlow(row.channel) || isDoorFlow(row.media)).length
  const referralSales = salesRows.filter((row) => isReferral(row.channel) || isReferral(row.media)).length
  const companyWalletSales = salesRows.filter((row) => isCompanyWallet(row.channel) || isCompanyWallet(row.media)).length
  const sellerWalletSales = salesRows.filter((row) => isSellerWallet(row.channel) || isSellerWallet(row.media)).length
  const classifiedSales = internetSalesFromEntries + doorSales + referralSales + companyWalletSales + sellerWalletSales
  const otherSales = Math.max(0, salesRows.length - classifiedSales)

  if (leads) setIfMeaningful(results, buildResult(input.clientId, 'leads_received', referenceDate, leads, { from: 'marketing_mensal_consultoria', rows: marketingRows.length }, source))
  if (marketingInvestment) setIfMeaningful(results, buildResult(input.clientId, 'internet_investment', referenceDate, marketingInvestment, { from: 'marketing_mensal_consultoria.investment' }, source))
  if (internetSales) setIfMeaningful(results, buildResult(input.clientId, 'sales_internet', referenceDate, internetSales, { from: 'marketing/sales_entries' }, source))
  if (marketingInvestment && internetSales) {
    setIfMeaningful(results, buildResult(input.clientId, 'internet_cost_per_sale', referenceDate, marketingInvestment / internetSales, { from: 'internet_investment/sales_internet' }, source))
  }
  if (salesCount) setIfMeaningful(results, buildResult(input.clientId, 'sales_total', referenceDate, salesCount, { from: salesRows.length ? 'entradas_vendas_consultoria' : 'marketing_mensal_consultoria' }, source))
  if (sellers.size) setIfMeaningful(results, buildResult(input.clientId, 'seller_count', referenceDate, sellers.size, { from: 'distinct seller_name' }, source))
  if (salesCount && sellers.size) {
    setIfMeaningful(results, buildResult(input.clientId, 'avg_sales_per_seller', referenceDate, salesCount / sellers.size, { from: 'sales_total/seller_count' }, source))
  }
  if (leads && sellers.size) setIfMeaningful(results, buildResult(input.clientId, 'avg_leads_per_seller', referenceDate, leads / sellers.size, { from: 'leads_received/seller_count' }, source))
  if (salesCount && internetSales) setIfMeaningful(results, buildResult(input.clientId, 'internet_sales_share', referenceDate, internetSales / salesCount, { from: 'sales_internet/sales_total' }, source))
  if (doorSales) setIfMeaningful(results, buildResult(input.clientId, 'sales_door_flow', referenceDate, doorSales, { from: 'channel/media classification' }, source))
  if (referralSales) setIfMeaningful(results, buildResult(input.clientId, 'sales_referral', referenceDate, referralSales, { from: 'channel/media classification' }, source))
  if (companyWalletSales) setIfMeaningful(results, buildResult(input.clientId, 'sales_company_wallet', referenceDate, companyWalletSales, { from: 'channel/media classification' }, source))
  if (sellerWalletSales) setIfMeaningful(results, buildResult(input.clientId, 'sales_seller_wallet', referenceDate, sellerWalletSales, { from: 'channel/media classification' }, source))
  if (otherSales) setIfMeaningful(results, buildResult(input.clientId, 'sales_other', referenceDate, otherSales, { from: 'channel/media classification' }, source))

  if (inventoryRow) {
    setIfMeaningful(results, buildResult(input.clientId, 'stock_total', referenceDate, numberValue(inventoryRow.total_stock), { from: 'snapshots_estoque_consultoria.total_stock' }, source))
    setIfMeaningful(results, buildResult(input.clientId, 'active_stock', referenceDate, numberValue(inventoryRow.active_stock), { from: 'snapshots_estoque_consultoria.active_stock' }, source))
    setIfMeaningful(results, buildResult(input.clientId, 'stock_over_90_rate', referenceDate, numberValue(inventoryRow.percent_over_90_days), { from: 'snapshots_estoque_consultoria.percent_over_90_days' }, source), true)
    setIfMeaningful(results, buildResult(input.clientId, 'avg_stock_price', referenceDate, numberValue(inventoryRow.avg_price), { from: 'snapshots_estoque_consultoria.avg_price' }, source))
    setIfMeaningful(results, buildResult(input.clientId, 'avg_stock_km', referenceDate, numberValue(inventoryRow.avg_km), { from: 'snapshots_estoque_consultoria.avg_km' }, source))
    const totalInvestment = getSourcePayloadNumber(inventoryRow, 'total_investment') || numberValue(inventoryRow.avg_price) * numberValue(inventoryRow.total_stock)
    setIfMeaningful(results, buildResult(input.clientId, 'inventory_investment', referenceDate, totalInvestment, { from: 'inventory.avg_price*total_stock' }, source))
    const fipeDelta = getSourcePayloadNumber(inventoryRow, 'avg_fipe_delta')
    setIfMeaningful(results, buildResult(input.clientId, 'avg_fipe_delta', referenceDate, fipeDelta, { from: 'inventory.sale_price-fipe_price' }, source), true)
    if (salesCount && numberValue(inventoryRow.total_stock)) {
      setIfMeaningful(results, buildResult(input.clientId, 'stock_turnover', referenceDate, salesCount / numberValue(inventoryRow.total_stock), { from: 'sales_total/stock_total' }, source))
    }
  }

  const dre = computeDreLike(financialRow)
  if (financialRow) {
    setIfMeaningful(results, buildResult(input.clientId, 'net_profit', endOfReferenceMonth(monthKey(financialRow.reference_date)), dre.net_profit, { from: 'financeiro_consultoria' }, 'dre'), true)
    setIfMeaningful(results, buildResult(input.clientId, 'avg_margin', endOfReferenceMonth(monthKey(financialRow.reference_date)), dre.margin_per_car, { from: 'financeiro_consultoria.margin_per_car' }, 'dre'))
    setIfMeaningful(results, buildResult(input.clientId, 'preparation_cost', endOfReferenceMonth(monthKey(financialRow.reference_date)), dre.prep_cost_per_car, { from: 'financeiro_consultoria.prep_cost_per_car' }, 'dre'))
    setIfMeaningful(results, buildResult(input.clientId, 'post_sale_cost', endOfReferenceMonth(monthKey(financialRow.reference_date)), dre.posvenda_per_car, { from: 'financeiro_consultoria.posvenda_per_car' }, 'dre'))
    setIfMeaningful(results, buildResult(input.clientId, 'lead_to_appointment_rate', endOfReferenceMonth(monthKey(financialRow.reference_date)), dre.lead_to_agd_rate, { from: 'financeiro_consultoria.volume_agendamentos/volume_leads' }, 'dre'))
    setIfMeaningful(results, buildResult(input.clientId, 'appointments_per_sale', endOfReferenceMonth(monthKey(financialRow.reference_date)), dre.appointments_per_sale, { from: 'financeiro_consultoria.volume_agendamentos/volume_vendas' }, 'dre'))
    if (!marketingInvestment && dre.cac) {
      setIfMeaningful(results, buildResult(input.clientId, 'internet_cost_per_sale', endOfReferenceMonth(monthKey(financialRow.reference_date)), dre.cac, { from: 'financeiro_consultoria.exp_marketing/volume_vendas' }, 'dre'))
    }
  }

  if (salesRows.length) {
    const margins = salesRows.map((row) => numberValue(row.margin) || numberValue(row.sale_value) - numberValue(row.purchase_value) - numberValue(row.preparation_expenses)).filter((value) => Number.isFinite(value))
    const preparations = salesRows.map((row) => numberValue(row.preparation_expenses)).filter((value) => value > 0)
    if (!results.has('avg_margin') && margins.length) {
      setIfMeaningful(results, buildResult(input.clientId, 'avg_margin', referenceDate, margins.reduce((sum, value) => sum + value, 0) / margins.length, { from: 'entradas_vendas_consultoria.margin' }, source))
    }
    if (!results.has('preparation_cost') && preparations.length) {
      setIfMeaningful(results, buildResult(input.clientId, 'preparation_cost', referenceDate, preparations.reduce((sum, value) => sum + value, 0) / preparations.length, { from: 'entradas_vendas_consultoria.preparation_expenses' }, source))
    }
  }

  return Array.from(results.values()).sort((a, b) => a.metric_key.localeCompare(b.metric_key))
}

export function mergeLatestPmrResults(persisted: ConsultingMetricResult[], derived: ConsultingMetricResult[]) {
  const sorted = [...persisted, ...derived].sort((a, b) => {
    const dateCompare = String(b.reference_date).localeCompare(String(a.reference_date))
    if (dateCompare !== 0) return dateCompare
    return (SOURCE_PRIORITY[b.source] || 0) - (SOURCE_PRIORITY[a.source] || 0)
  })
  const map = new Map<string, ConsultingMetricResult>()
  for (const result of sorted) {
    if (!map.has(result.metric_key)) map.set(result.metric_key, result)
  }
  return map
}

export function classifyPmrMetric(result: number | null | undefined, direction?: string, green?: number | null, yellow?: number | null): PmrMetricStatus {
  if (typeof result !== 'number' || !Number.isFinite(result)) return 'outline'
  if (green == null && yellow == null) return 'outline'
  if (direction === 'decrease') {
    if (green != null && result <= green) return 'success'
    if (yellow != null && result <= yellow) return 'warning'
    return 'danger'
  }
  if (green != null && result >= green) return 'success'
  if (yellow != null && result >= yellow) return 'warning'
  return 'danger'
}

export function buildPmrMetricViews(input: {
  catalog: ConsultingMetricCatalogItem[]
  latestResults: Map<string, ConsultingMetricResult>
  parameterByMetric: Map<string, ConsultingParameterValue>
}) {
  return input.catalog
    .map((metric) => {
      const result = input.latestResults.get(metric.metric_key)
      const params = input.parameterByMetric.get(metric.metric_key)
      return {
        metric_key: metric.metric_key,
        label: metric.label,
        area: metric.area,
        value_type: metric.value_type,
        direction: metric.direction,
        latest_result: result?.result_value ?? null,
        market_average: params?.market_average ?? null,
        best_practice: params?.best_practice ?? null,
        status: classifyPmrMetric(result?.result_value, metric.direction, params?.green_threshold, params?.yellow_threshold),
      }
    })
    .filter((row) => row.latest_result != null || row.market_average != null || row.best_practice != null)
}

function statusWord(status: PmrMetricStatus) {
  if (status === 'success') return 'superior'
  if (status === 'warning') return 'intermediário'
  if (status === 'danger') return 'abaixo do mercado'
  return 'sem dado'
}

function formatMetricValue(value: number | null, valueType: PmrMetricView['value_type']) {
  if (value == null) return 'sem dado'
  if (valueType === 'percent') return `${(value * 100).toFixed(1)}%`
  if (valueType === 'currency') return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

function responseRole(response: PmrFormResponse) {
  return normalizeText(response.template?.form_key || response.respondent_role || response.template?.target_role)
}

function fieldLabel(response: PmrFormResponse, key: string) {
  return response.template?.fields.find((field) => field.key === key)?.label || key.replace(/_/g, ' ')
}

function extractDiagnosticSignals(responses: PmrFormResponse[]) {
  const strengths: string[] = []
  const weaknesses: string[] = []
  const summaries: string[] = []

  for (const response of responses) {
    const role = responseRole(response)
    const roleLabel = role.includes('gerente') ? 'Gestão' : role.includes('vendedor') ? 'Vendas' : role.includes('process') ? 'Processos' : 'Dono'
    if (response.summary) summaries.push(`${roleLabel}: ${response.summary}`)

    for (const [key, rawValue] of Object.entries(response.answers || {})) {
      const value = numberValue(rawValue)
      if (!value || value < 1 || value > 5) continue
      const label = fieldLabel(response, key)
      if (value >= 4) strengths.push(`${label} avaliado como forte em ${roleLabel}`)
      if (value <= 2) weaknesses.push(`${label} abaixo do esperado em ${roleLabel}`)
    }
  }

  return {
    summaries,
    strengths: strengths.slice(0, 8),
    weaknesses: weaknesses.slice(0, 10),
  }
}

const METRIC_ACTIONS: Record<string, Omit<PmrActionRecommendation, 'due_date'>> = {
  leads_received: {
    metric_key: 'leads_received',
    action: 'Reforçar geração e qualificação de leads',
    how: 'Revisar mídia ativa, verba por canal, criativos, origem dos leads e rotina de higienização para garantir volume com qualidade.',
    owner_name: 'Marketing / Gestão',
    priority: 1,
    efficacy: 'Aumentar o volume de oportunidades qualificadas e sustentar a meta de vendas.',
    visit_number: 6,
  },
  internet_cost_per_sale: {
    metric_key: 'internet_cost_per_sale',
    action: 'Reduzir custo por venda da internet',
    how: 'Comparar investimento, leads, atendimento e vendas por canal; cortar origem improdutiva e reforçar canal com conversão superior.',
    owner_name: 'Marketing / Gerente',
    priority: 1,
    efficacy: 'Trazer CAC para a faixa de boa prática sem reduzir geração de demanda.',
    visit_number: 6,
  },
  avg_sales_per_seller: {
    metric_key: 'avg_sales_per_seller',
    action: 'Implantar rotina diária de produtividade por vendedor',
    how: 'Definir agenda de prospecção, follow-up, carteira, atendimento de leads e fechamento por vendedor com checagem diária.',
    owner_name: 'Gerente de Vendas',
    priority: 1,
    efficacy: 'Aumentar vendas médias por vendedor e reduzir dependência de poucos performers.',
    visit_number: 3,
  },
  lead_to_appointment_rate: {
    metric_key: 'lead_to_appointment_rate',
    action: 'Padronizar SLA e cadência de atendimento de leads',
    how: 'Criar regra de primeiro contato, segunda tentativa, recuperação e registro no CRM para todo lead recebido.',
    owner_name: 'Gerente / Vendedores',
    priority: 1,
    efficacy: 'Elevar conversão de lead em agendamento para a média de mercado ou melhor.',
    visit_number: 2,
  },
  appointment_to_visit_rate: {
    metric_key: 'appointment_to_visit_rate',
    action: 'Aumentar comparecimento dos agendamentos',
    how: 'Confirmar visita com mensagem, ligação, proposta objetiva e responsável definido antes do cliente chegar.',
    owner_name: 'Vendedores',
    priority: 2,
    efficacy: 'Reduzir perda entre agendamento e visita presencial.',
    visit_number: 3,
  },
  visit_to_sale_rate: {
    metric_key: 'visit_to_sale_rate',
    action: 'Padronizar atendimento presencial e negociação',
    how: 'Aplicar roteiro de sondagem, apresentação, proposta e fechamento com alçadas de desconto claras.',
    owner_name: 'Gerente / Vendedores',
    priority: 1,
    efficacy: 'Elevar conversão de visita em venda e reduzir cliente solto na loja.',
    visit_number: 2,
  },
  stock_turnover: {
    metric_key: 'stock_turnover',
    action: 'Executar plano de giro de estoque',
    how: 'Separar estoque por idade, margem e liquidez; definir ações comerciais por faixa e revisar preço semanalmente.',
    owner_name: 'Gestão / Compra',
    priority: 1,
    efficacy: 'Melhorar giro e liberar capital parado em veículos lentos.',
    visit_number: 7,
  },
  stock_over_90_rate: {
    metric_key: 'stock_over_90_rate',
    action: 'Reduzir veículos com mais de 90 dias',
    how: 'Criar campanha de desova, revisão de preço, proposta de repasse e gatilhos de decisão por idade de estoque.',
    owner_name: 'Gestão / Compra',
    priority: 1,
    efficacy: 'Aproximar estoque +90 dias da boa prática de mercado.',
    visit_number: 7,
  },
  avg_margin: {
    metric_key: 'avg_margin',
    action: 'Revisar margem média por veículo',
    how: 'Auditar precificação, descontos, repasse, preparação e financiamento para proteger margem por venda.',
    owner_name: 'Dono / Gerente',
    priority: 2,
    efficacy: 'Elevar margem média sem travar giro de estoque.',
    visit_number: 7,
  },
  preparation_cost: {
    metric_key: 'preparation_cost',
    action: 'Controlar custo e prazo de preparação',
    how: 'Implantar checklist, responsável, prazo limite e aprovação de gasto antes de liberar o veículo para venda.',
    owner_name: 'Gestão / Preparação',
    priority: 2,
    efficacy: 'Reduzir custo de preparação e aumentar disponibilidade real do estoque.',
    visit_number: 7,
  },
}

const DIAGNOSTIC_ACTIONS: Record<string, Omit<PmrActionRecommendation, 'due_date'>> = {
  trade_in_evaluation: {
    action: 'Formalizar avaliação de usado na troca',
    how: 'Criar fluxo com fotos, dados mínimos, prazo máximo de resposta e registro formal do valor apresentado.',
    owner_name: 'Gerente / Avaliador',
    priority: 1,
    efficacy: 'Reduzir lentidão na troca e perda de timing de negociação.',
    visit_number: 7,
  },
  pricing_autonomy_process: {
    action: 'Definir alçadas de negociação e autonomia de preço',
    how: 'Documentar faixas de desconto, aprovações necessárias e limite de decisão por vendedor e gerente.',
    owner_name: 'Dono / Gerente',
    priority: 1,
    efficacy: 'Diminuir dependência do dono e acelerar fechamento.',
    visit_number: 2,
  },
  vehicle_preparation: {
    action: 'Implantar checklist de preparação de veículos',
    how: 'Criar checklist de entrada, preparação, fotos, qualidade e liberação para anúncio e entrega.',
    owner_name: 'Preparação / Gestão',
    priority: 2,
    efficacy: 'Evitar carro anunciado ou entregue sem condição padrão.',
    visit_number: 7,
  },
  post_sale_process: {
    action: 'Organizar processo de pós-venda',
    how: 'Separar responsabilidade de pós-venda da rotina comercial e criar controle de recorrência por causa.',
    owner_name: 'Gestão / Administrativo',
    priority: 2,
    efficacy: 'Reduzir perda de foco do vendedor e retrabalho.',
    visit_number: 7,
  },
  daily_tracking_process: {
    action: 'Implantar gestão à vista diária',
    how: 'Acompanhar leads, agendamentos, visitas, vendas e próximos passos todos os dias com atualização no sistema.',
    owner_name: 'Gerente',
    priority: 1,
    efficacy: 'Dar previsibilidade e antecipar correções antes do fechamento do mês.',
    visit_number: 2,
  },
  team_training_process: {
    action: 'Estruturar treinamento contínuo da equipe',
    how: 'Definir trilha curta por semana, simulações de atendimento e devolutiva individual por vendedor.',
    owner_name: 'Gerente / Consultor',
    priority: 2,
    efficacy: 'Aumentar padrão técnico e reduzir improviso comercial.',
    visit_number: 5,
  },
}

function recommendationsFromDiagnostics(responses: PmrFormResponse[]) {
  const actions = new Map<string, PmrActionRecommendation>()
  for (const response of responses) {
    for (const [key, rawValue] of Object.entries(response.answers || {})) {
      const value = numberValue(rawValue)
      const base = DIAGNOSTIC_ACTIONS[key]
      if (!base || !value || value > 2) continue
      actions.set(key, { ...base, metric_key: null, due_date: null })
    }
  }
  return Array.from(actions.values())
}

function recommendationsFromMetrics(metrics: PmrMetricView[]) {
  return metrics
    .filter((metric) => metric.status === 'danger' || metric.status === 'warning')
    .map((metric) => METRIC_ACTIONS[metric.metric_key])
    .filter(Boolean)
    .map((action) => ({ ...action, due_date: null }))
}

function dedupeActions(actions: PmrActionRecommendation[]) {
  const map = new Map<string, PmrActionRecommendation>()
  for (const action of actions) {
    const key = `${action.metric_key || ''}:${normalizeText(action.action)}`
    if (!map.has(key)) map.set(key, action)
  }
  return Array.from(map.values())
    .sort((a, b) => a.priority - b.priority || (a.visit_number || 99) - (b.visit_number || 99))
    .slice(0, 12)
}

function defaultOpportunities() {
  return [
    'Expandir estoque com critério de giro, margem e liquidez.',
    'Desenvolver equipe de vendas com método, rotina e avaliação individual.',
    'Aumentar preço médio e margem por veículo sem perder velocidade de venda.',
    'Explorar carteira do vendedor, indicação e canais digitais com controle de origem.',
  ]
}

function defaultThreats() {
  return [
    'Atrasos de execução por falta de comando interno do gestor.',
    'Aumento de custos de marketing, preparação e pós-venda sem controle por indicador.',
    'Estoque envelhecido e compra sem critério em cenário de oferta limitada.',
    'Dispersão do time em períodos de feriados, eventos e volatilidade econômica.',
  ]
}

function metricWeakness(metric: PmrMetricView) {
  const current = formatMetricValue(metric.latest_result, metric.value_type)
  const best = formatMetricValue(metric.best_practice, metric.value_type)
  return `${metric.label}: realizado ${current}, boa prática ${best} (${statusWord(metric.status)}).`
}

function metricStrength(metric: PmrMetricView) {
  const current = formatMetricValue(metric.latest_result, metric.value_type)
  return `${metric.label}: ${current}, acima da referência configurada.`
}

function actionFromExisting(item: ConsultingActionItem): PmrActionRecommendation {
  return {
    metric_key: item.metric_key,
    action: item.action,
    how: item.how || 'Executar conforme combinado no plano de ação.',
    owner_name: item.owner_name || 'Responsável a definir',
    due_date: item.due_date,
    priority: item.priority,
    efficacy: item.efficacy || 'Eficácia será medida pelo indicador vinculado e evidências da visita.',
    visit_number: item.visit_number,
  }
}

function buildMarkdown(draft: Omit<PmrStrategicPlanDraft, 'markdown' | 'payload'> & { clientName: string }) {
  const metricLines = draft.metricRows.slice(0, 16).map((metric) => (
    `- ${metric.label}: realizado ${formatMetricValue(metric.latest_result, metric.value_type)} | mercado ${formatMetricValue(metric.market_average, metric.value_type)} | boa prática ${formatMetricValue(metric.best_practice, metric.value_type)} | status ${statusWord(metric.status)}`
  ))

  const actionLines = draft.actions.map((action, index) => (
    `${index + 1}. P${action.priority} - ${action.action}\n   - Como: ${action.how}\n   - Responsável: ${action.owner_name}\n   - Prazo: ${action.due_date || 'definir na visita'}\n   - Eficácia: ${action.efficacy}`
  ))

  return [
    `# PLANEJAMENTO ESTRATÉGICO PMR`,
    `**Cliente:** ${draft.clientName}`,
    `**Gerado em:** ${new Date().toLocaleDateString('pt-BR')}`,
    '',
    `## 1. Síntese Executiva`,
    draft.diagnosisSummary,
    '',
    `## 2. Comparativo com o Mercado`,
    ...metricLines,
    '',
    `## 3. Forças`,
    ...draft.swot.strengths.map((item) => `- ${item}`),
    '',
    `## 4. Fraquezas`,
    ...draft.swot.weaknesses.map((item) => `- ${item}`),
    '',
    `## 5. Oportunidades`,
    ...draft.swot.opportunities.map((item) => `- ${item}`),
    '',
    `## 6. Ameaças`,
    ...draft.swot.threats.map((item) => `- ${item}`),
    '',
    `## 7. Plano de Ação PMR`,
    ...actionLines,
    '',
    `## 8. Cronograma de Implementação`,
    ...PMR_IMPLEMENTATION_SCHEDULE.map((step) => `- Visita ${step.visit}: ${step.objective} (${step.target}) - ${step.description}`),
    '',
    `## 9. Riscos e Contingências`,
    ...PMR_RISK_CONTINGENCIES.map((risk) => `- ${risk.title}: ${risk.detail}`),
    '',
    `## 10. Acompanhamento e Controle`,
    `O acompanhamento deve cruzar lançamento diário, fechamento mensal, DRE, metas, plano de ação e evidências das visitas para manter o PMR vivo no sistema.`,
  ].join('\n')
}

export function buildPmrStrategicPlan(input: {
  clientName: string
  metricRows: PmrMetricView[]
  diagnostics?: PmrFormResponse[]
  existingActions?: ConsultingActionItem[]
  summaryOverride?: string
  swotOverride?: Partial<PmrStrategicPlanDraft['swot']>
}) {
  const metrics = input.metricRows
  const criticalGaps = metrics.filter((metric) => metric.status === 'danger').slice(0, 8)
  const warningGaps = metrics.filter((metric) => metric.status === 'warning').slice(0, 6)
  const healthyMetrics = metrics.filter((metric) => metric.status === 'success').slice(0, 6)
  const diagnosticSignals = extractDiagnosticSignals(input.diagnostics || [])
  const generatedActions = dedupeActions([
    ...(input.existingActions || []).map(actionFromExisting),
    ...recommendationsFromMetrics(metrics),
    ...recommendationsFromDiagnostics(input.diagnostics || []),
  ])

  const strengths = [
    ...healthyMetrics.map(metricStrength),
    ...diagnosticSignals.strengths,
  ].slice(0, 8)

  const weaknesses = [
    ...criticalGaps.map(metricWeakness),
    ...warningGaps.map(metricWeakness),
    ...diagnosticSignals.weaknesses,
  ].slice(0, 10)
  const finalSwot = {
    strengths: input.swotOverride?.strengths?.length
      ? input.swotOverride.strengths
      : strengths.length ? strengths : ['Operação com base de dados suficiente para gestão por indicadores PMR.'],
    weaknesses: input.swotOverride?.weaknesses?.length
      ? input.swotOverride.weaknesses
      : weaknesses.length ? weaknesses : ['Sem fraqueza crítica calculada nos dados disponíveis; manter coleta de diagnóstico e rotina diária.'],
    opportunities: input.swotOverride?.opportunities?.length
      ? input.swotOverride.opportunities
      : defaultOpportunities(),
    threats: input.swotOverride?.threats?.length
      ? input.swotOverride.threats
      : defaultThreats(),
  }

  const diagnosisSummary = input.summaryOverride?.trim()
    || [
      `${input.clientName}: planejamento gerado nativamente a partir de ${metrics.length} indicadores PMR, ${input.diagnostics?.length || 0} diagnósticos e ${generatedActions.length} ações priorizadas.`,
      criticalGaps.length ? `Gargalos críticos: ${criticalGaps.slice(0, 4).map((metric) => metric.label).join(', ')}.` : 'Sem gargalo crítico nos indicadores disponíveis.',
      diagnosticSignals.summaries[0] || 'Planejamento operacional inicial baseado nos indicadores disponíveis; novas respostas estruturadas refinam automaticamente as prioridades.',
    ].join(' ')
  const fallbackActions: PmrActionRecommendation[] = [
    {
      metric_key: null,
      action: 'Validar indicadores base e responsáveis do PMR',
      how: 'Revisar diagnóstico, metas, DRE, acompanhamento diário e evidências com dono e gerente.',
      owner_name: 'Consultor / Gestão',
      due_date: null,
      priority: 1,
      efficacy: 'Base completa para iniciar acompanhamento semanal e plano de ação.',
      visit_number: 2,
    },
  ]

  const draftBase = {
    title: `Planejamento Estratégico PMR - ${input.clientName}`,
    diagnosisSummary,
    swot: finalSwot,
    metricRows: metrics,
    criticalGaps,
    actions: generatedActions.length ? generatedActions : fallbackActions,
  }

  const markdown = buildMarkdown({ ...draftBase, clientName: input.clientName })
  const payload = {
    client_name: input.clientName,
    generated_at: new Date().toISOString(),
    metric_rows: metrics,
    critical_gaps: criticalGaps,
    swot: draftBase.swot,
    action_recommendations: draftBase.actions,
    implementation_schedule: PMR_IMPLEMENTATION_SCHEDULE,
    risk_contingencies: PMR_RISK_CONTINGENCIES,
    diagnostic_summaries: diagnosticSignals.summaries,
  }

  return { ...draftBase, markdown, payload }
}

export function mapRecommendationsToInsert(actions: PmrActionRecommendation[], strategicPlanId?: string | null) {
  return actions.map((action) => ({
    strategic_plan_id: strategicPlanId || null,
    metric_key: action.metric_key || null,
    action: action.action,
    how: action.how,
    owner_name: action.owner_name,
    due_date: action.due_date,
    status: 'nao_iniciado' as const,
    efficacy: action.efficacy,
    priority: action.priority,
    visit_number: action.visit_number,
  }))
}

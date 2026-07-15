export type StoreGoalDayWindow = {
  elapsed: number
  total: number
  remaining: number
}

export type StoreGoalMetrics = {
  proportionalGoal: number
  gap: number
  paceGap: number
  projection: number
  dailyPace: number
}

export type StoreGoalHorizon = 'hoje' | 'semana' | 'dezena' | 'mes'

export type StoreGoalClosing = {
  date: string
  sales: number
  appointments: number
  visits: number
}

export type StoreGoalClosingSource = {
  reference_date: string
  vnd_porta_prev_day?: unknown
  vnd_cart_prev_day?: unknown
  vnd_net_prev_day?: unknown
  agd_cart_today?: unknown
  agd_net_today?: unknown
  visit_prev_day?: unknown
}

export type StoreGoalRankingSource = {
  user_id: string
  user_name: string
  vnd_total: number
  meta: number
  routine_execution?: number | null
  discipline_score?: number | null
}

export type StoreGoalTeamRow = {
  sellerId: string
  sellerName: string
  realized: number
  proportionalGoal: number | null
  result: number | null
  gap: number | null
  projection: number | null
  consistency: number | null
}

export type StoreGoalChannelRow = {
  name: 'Showroom' | 'Internet' | 'Carteira' | 'Atend. anterior / Sem canal'
  opportunities: number | null
  sales: number
  conversion: number | null
  participation: number
  perSale: string | null
  situation: 'Bom' | 'Regular' | 'Ruim' | null
}

export type SustainabilityPlan = {
  horizonte: StoreGoalHorizon
  faltam: number
  ritmo: number
  ritmoLabel: string
  necessidadeOperacional: number | null
  tipoOperacional: 'agendamentos' | 'atendimentos' | null
  objectiveReached: boolean
  mensagemFoco: string
  hasStatisticalBase: boolean
}

function finiteOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function buildStoreGoalClosingRows(checkins: StoreGoalClosingSource[]): StoreGoalClosing[] {
  const byDate = new Map<string, StoreGoalClosing>()
  for (const checkin of checkins) {
    const current = byDate.get(checkin.reference_date) || { date: checkin.reference_date, sales: 0, appointments: 0, visits: 0 }
    current.sales += finiteOrZero(checkin.vnd_porta_prev_day) + finiteOrZero(checkin.vnd_cart_prev_day) + finiteOrZero(checkin.vnd_net_prev_day)
    current.appointments += finiteOrZero(checkin.agd_cart_today) + finiteOrZero(checkin.agd_net_today)
    current.visits += finiteOrZero(checkin.visit_prev_day)
    byDate.set(checkin.reference_date, current)
  }
  return Array.from(byDate.values())
}

/**
 * Adapta o ranking oficial para as mesmas colunas de contribuição exibidas no
 * Base44. Não cria metas individuais: uma coluna só aparece quando o ranking
 * canônico trouxe uma meta para o vendedor.
 */
export function buildStoreGoalTeamRows(
  ranking: StoreGoalRankingSource[],
  days: Pick<StoreGoalDayWindow, 'elapsed' | 'total'>,
): StoreGoalTeamRow[] {
  const elapsed = Number.isFinite(days.elapsed) && days.elapsed > 0 ? days.elapsed : 0
  const total = Number.isFinite(days.total) && days.total > 0 ? days.total : 0

  return ranking
    .map((seller) => {
      const realized = finiteOrZero(seller.vnd_total)
      const individualGoal = finiteOrZero(seller.meta)
      const proportionalGoal = individualGoal > 0 && total > 0
        ? individualGoal * elapsed / total
        : null
      const result = proportionalGoal !== null && proportionalGoal > 0
        ? Math.round(realized / proportionalGoal * 100)
        : null
      const projection = elapsed > 0 ? Math.round(realized / elapsed * total) : null
      const consistency = Number.isFinite(seller.routine_execution)
        ? seller.routine_execution as number
        : Number.isFinite(seller.discipline_score)
          ? seller.discipline_score as number
          : null

      return {
        sellerId: seller.user_id,
        sellerName: seller.user_name,
        realized,
        proportionalGoal: proportionalGoal === null ? null : Math.round(proportionalGoal),
        result,
        gap: individualGoal > 0 ? Math.max(individualGoal - realized, 0) : null,
        projection,
        consistency,
      }
    })
    .sort((left, right) => {
      const leftBelowPace = left.proportionalGoal !== null && left.realized < left.proportionalGoal ? 0 : 1
      const rightBelowPace = right.proportionalGoal !== null && right.realized < right.proportionalGoal ? 0 : 1
      if (leftBelowPace !== rightBelowPace) return leftBelowPace - rightBelowPace
      if ((left.projection ?? Number.POSITIVE_INFINITY) !== (right.projection ?? Number.POSITIVE_INFINITY)) {
        return (left.projection ?? Number.POSITIVE_INFINITY) - (right.projection ?? Number.POSITIVE_INFINITY)
      }
      return (left.consistency ?? Number.POSITIVE_INFINITY) - (right.consistency ?? Number.POSITIVE_INFINITY)
    })
}

/**
 * O MX registra vendas por canal, mas não possui oportunidade equivalente por
 * canal neste contrato. Os campos sem origem explícita permanecem indisponíveis.
 */
export function buildStoreGoalChannelRows(checkins: StoreGoalClosingSource[], officialTotalSales?: number): StoreGoalChannelRow[] {
  const sales = checkins.reduce((totals, checkin) => ({
    showroom: totals.showroom + finiteOrZero(checkin.vnd_porta_prev_day),
    internet: totals.internet + finiteOrZero(checkin.vnd_net_prev_day),
    carteira: totals.carteira + finiteOrZero(checkin.vnd_cart_prev_day),
  }), { showroom: 0, internet: 0, carteira: 0 })
  const identifiedSales = sales.showroom + sales.internet + sales.carteira
  const totalSales = Math.max(identifiedSales, finiteOrZero(officialTotalSales))
  const participation = (value: number) => totalSales > 0 ? Math.round(value / totalSales * 100) : 0

  const channels: StoreGoalChannelRow[] = [
    { name: 'Showroom' as const, opportunities: null, sales: sales.showroom, conversion: null, participation: participation(sales.showroom), perSale: null, situation: null },
    { name: 'Internet' as const, opportunities: null, sales: sales.internet, conversion: null, participation: participation(sales.internet), perSale: null, situation: null },
    { name: 'Carteira' as const, opportunities: null, sales: sales.carteira, conversion: null, participation: participation(sales.carteira), perSale: null, situation: null },
  ].filter((channel) => channel.sales > 0)
  const untrackedSales = Math.max(totalSales - identifiedSales, 0)
  if (untrackedSales > 0) {
    channels.push({
      name: 'Atend. anterior / Sem canal', opportunities: null, sales: untrackedSales,
      conversion: null, participation: participation(untrackedSales), perSale: null, situation: null,
    })
  }
  return channels
}

export function operationalDayPredicate(projectionMode: string | null | undefined): (date: Date) => boolean {
  return projectionMode === 'calendar' ? () => true : (date) => date.getDay() !== 0
}

type SustainabilityPlanInput = {
  horizon: StoreGoalHorizon
  goal: number
  realized: number
  referenceDate: string
  monthDays: StoreGoalDayWindow
  closings: StoreGoalClosing[]
  agendaPerSale?: number
  visitsPerSale?: number
  isOperationalDay?: (date: Date) => boolean
}

/**
 * Fórmulas oficiais da Meta da Loja.
 * O valor proporcional permanece fracionário para impedir erro de limiar;
 * arredondamento é responsabilidade exclusiva da camada de exibição.
 */
export function calculateStoreGoalMetrics(
  goal: number,
  realized: number,
  days: StoreGoalDayWindow,
): StoreGoalMetrics {
  const safeGoal = Number.isFinite(goal) && goal > 0 ? goal : 0
  const safeRealized = Number.isFinite(realized) && realized >= 0 ? realized : 0
  const elapsed = Number.isFinite(days.elapsed) && days.elapsed > 0 ? days.elapsed : 0
  const total = Number.isFinite(days.total) && days.total > 0 ? days.total : 0
  const remaining = Number.isFinite(days.remaining) && days.remaining > 0 ? days.remaining : 0

  const proportionalGoal = total > 0 ? safeGoal * elapsed / total : 0
  const gap = Math.max(safeGoal - safeRealized, 0)
  const paceGap = Math.max(proportionalGoal - safeRealized, 0)
  const projection = elapsed > 0 ? safeRealized / elapsed * total : 0
  const dailyPace = remaining > 0 ? gap / remaining : 0

  return { proportionalGoal, gap, paceGap, projection, dailyPace }
}

export function formatStoreGoalMetric(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function parseLocalDate(value: string): Date {
  return new Date(`${value}T12:00:00`)
}

function formatPace(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '—'
  if (value < 1) {
    const days = Math.round((1 / value) * 10) / 10
    return `1 venda a cada ${formatStoreGoalMetric(days)} dias úteis`
  }
  return `${formatStoreGoalMetric(value)} ${value === 1 ? 'venda' : 'vendas'} por dia útil`
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function startOfWeek(date: Date): Date {
  return addDays(date, -date.getDay())
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12)
}

function horizonRange(horizon: StoreGoalHorizon, referenceDate: Date): [Date, Date] {
  if (horizon === 'hoje') return [referenceDate, referenceDate]
  if (horizon === 'semana') {
    const start = startOfWeek(referenceDate)
    return [start, addDays(start, 6)]
  }
  if (horizon === 'dezena') {
    const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate() <= 10 ? 1 : referenceDate.getDate() <= 20 ? 11 : 21, 12)
    const endDay = start.getDate() === 1 ? 10 : start.getDate() === 11 ? 20 : endOfMonth(referenceDate).getDate()
    return [start, new Date(referenceDate.getFullYear(), referenceDate.getMonth(), endDay, 12)]
  }
  return [new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1, 12), endOfMonth(referenceDate)]
}

function countOperationalDays(start: Date, end: Date, isOperationalDay: (date: Date) => boolean): number {
  if (start > end) return 0
  let count = 0
  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    if (isOperationalDay(cursor)) count += 1
  }
  return count
}

function closingSalesBetween(closings: StoreGoalClosing[], start: Date, end: Date): number {
  const startKey = start.toISOString().slice(0, 10)
  const endKey = end.toISOString().slice(0, 10)
  return closings
    .filter((closing) => closing.date >= startKey && closing.date <= endKey)
    .reduce((total, closing) => total + (Number.isFinite(closing.sales) ? closing.sales : 0), 0)
}

export function calculateSustainabilityPlan({
  horizon,
  goal,
  realized,
  referenceDate,
  monthDays,
  closings,
  agendaPerSale,
  visitsPerSale,
  isOperationalDay = (date) => date.getDay() !== 0,
}: SustainabilityPlanInput): SustainabilityPlan {
  const safeGoal = Number.isFinite(goal) && goal > 0 ? goal : 0
  const safeRealized = Number.isFinite(realized) && realized >= 0 ? realized : 0
  const reference = parseLocalDate(referenceDate)
  const [rangeStart, rangeEnd] = horizonRange(horizon, reference)
  const remainingStart = horizon === 'mes' ? reference : reference > rangeStart ? reference : rangeStart
  const operationalDays = horizon === 'mes'
    ? Math.max(monthDays.remaining, 0)
    : countOperationalDays(remainingStart, rangeEnd, isOperationalDay)
  const monthDailyGoal = monthDays.total > 0 ? safeGoal / monthDays.total : 0
  const salesInHorizon = closingSalesBetween(closings, remainingStart, rangeEnd)

  let faltam: number
  let mensagemFoco: string
  if (horizon === 'mes') {
    faltam = Math.max(safeGoal - safeRealized, 0)
    mensagemFoco = faltam <= 0
      ? 'Meta do mês atingida. Mantenha o ritmo para sustentar o resultado.'
      : 'Foco do mês: manter o ritmo necessário até o fechamento da meta mensal.'
  } else {
    const objetivo = Math.ceil(monthDailyGoal * operationalDays)
    faltam = Math.max(objetivo - salesInHorizon, 0)
    const complemento = horizon === 'hoje' ? 'hoje' : horizon === 'semana' ? 'desta semana' : 'desta dezena'
    mensagemFoco = faltam <= 0
      ? `Objetivo ${horizon === 'hoje' ? 'de hoje' : horizon === 'semana' ? 'da semana' : 'da dezena'} atingido. Mantenha o ritmo para garantir a meta do mês.`
      : `Foco ${complemento}: ${faltam} ${faltam === 1 ? 'venda' : 'vendas'} para mantermos acima do ritmo e garantir a meta do mês.`
  }

  const ritmo = operationalDays > 0 ? faltam / operationalDays : 0
  const hasStatisticalBase = (agendaPerSale || 0) > 0 || (visitsPerSale || 0) > 0
  const useAgenda = (agendaPerSale || 0) > 0
  const factor = useAgenda ? agendaPerSale! : (visitsPerSale || 0) > 0 ? visitsPerSale! : null
  const tipoOperacional = useAgenda ? 'agendamentos' : (visitsPerSale || 0) > 0 ? 'atendimentos' : null

  return {
    horizonte: horizon,
    faltam,
    ritmo,
    ritmoLabel: formatPace(ritmo),
    necessidadeOperacional: factor === null ? null : Math.ceil(faltam * factor),
    tipoOperacional,
    objectiveReached: faltam <= 0,
    mensagemFoco,
    hasStatisticalBase,
  }
}

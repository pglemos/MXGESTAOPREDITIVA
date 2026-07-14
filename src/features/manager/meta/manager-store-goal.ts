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

export type SustainabilityPlan = {
  horizonte: StoreGoalHorizon
  faltam: number
  ritmo: number
  ritmoLabel: string
  necessidadeOperacional: number
  tipoOperacional: 'agendamentos' | 'atendimentos'
  objectiveReached: boolean
  mensagemFoco: string
  hasStatisticalBase: boolean
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
  if (!Number.isFinite(value)) return '0'
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
  const factor = useAgenda ? agendaPerSale! : (visitsPerSale || 0) > 0 ? visitsPerSale! : 3
  const tipoOperacional = useAgenda || !hasStatisticalBase ? 'agendamentos' : 'atendimentos'

  return {
    horizonte: horizon,
    faltam,
    ritmo,
    ritmoLabel: formatPace(ritmo),
    necessidadeOperacional: Math.ceil(faltam * factor),
    tipoOperacional,
    objectiveReached: faltam <= 0,
    mensagemFoco,
    hasStatisticalBase,
  }
}

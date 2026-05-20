import { endOfWeek, format, parseISO, startOfWeek, subWeeks } from 'date-fns'
import { calcularFunil } from '@/lib/calculations'
import type { DailyCheckin, WeeklyFeedbackReport } from '@/types/database'
import type { Feedback } from '@/lib/schemas/feedback.schema'

export type FeedbackListItem = Feedback & {
  seller_name?: string
  manager_name?: string
}

export type FeedbackTab = 'individual' | 'weekly'

export function getFeedbackSellerName(feedback: FeedbackListItem): string {
  return feedback.seller_name || 'Especialista'
}

export function getWeeklyAverageSales(report: Pick<WeeklyFeedbackReport, 'team_avg_json'>): number {
  const value = report.team_avg_json?.vnd
  return typeof value === 'number' ? value : 0
}

export function getPreviousWeekRange() {
  const now = new Date()
  const lastWeek = subWeeks(now, 1)
  const start = startOfWeek(lastWeek, { weekStartsOn: 1 })
  const end = endOfWeek(lastWeek, { weekStartsOn: 1 })
  return {
    start,
    end,
    startKey: format(start, 'yyyy-MM-dd'),
    endKey: format(end, 'yyyy-MM-dd'),
    label: `${format(start, 'dd/MM')} a ${format(end, 'dd/MM')}`,
  }
}

export function formatSafeDate(value?: string | null, pattern = 'dd/MM/yyyy') {
  if (!value) return '--/--'
  try {
    return format(parseISO(value), pattern)
  } catch {
    return '--/--'
  }
}

export function buildFeedbackMetricsPatch(
  checkins: DailyCheckin[],
  commitmentMode: 'actual' | 'suggested' = 'actual',
) {
  const funnel = calcularFunil(checkins)
  return {
    leads_week: funnel.leads,
    agd_week: funnel.agd_total,
    visit_week: funnel.visitas,
    vnd_week: funnel.vnd_total,
    tx_lead_agd: funnel.tx_lead_agd,
    tx_agd_visita: funnel.tx_agd_visita,
    tx_visita_vnd: funnel.tx_visita_vnd,
    meta_compromisso:
      commitmentMode === 'suggested' ? Math.ceil(funnel.vnd_total * 1.2) || 1 : funnel.vnd_total,
  }
}

import {
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'
import type { CheckinWithTotals } from '@/types/database'

export type LeadConferencePeriodType =
  | 'current_week'
  | 'previous_week'
  | 'current_month'
  | 'previous_month'
  | 'custom'

export interface LeadConferencePeriod {
  start: string
  end: string
}

export interface LeadConferenceSeller {
  id: string
  name: string
}

export interface LeadConferenceRow {
  sellerId: string
  sellerName: string
  internetMx: number
  internetOfficial: number | null
  carteiraMx: number
  carteiraOfficial: number | null
}

export interface LeadConferenceSummary {
  totalMx: number
  totalOfficial: number | null
  totalDifference: number | null
  divergentSellers: number | null
  complete: boolean
}

const iso = (date: Date) => format(date, 'yyyy-MM-dd')

export function getLeadConferencePeriod(
  type: LeadConferencePeriodType,
  anchorDate: string,
  custom?: LeadConferencePeriod,
): LeadConferencePeriod {
  const anchor = parseISO(anchorDate)
  if (type === 'custom' && custom) return custom
  if (type === 'current_week') {
    return { start: iso(startOfWeek(anchor, { weekStartsOn: 1 })), end: iso(endOfWeek(anchor, { weekStartsOn: 1 })) }
  }
  if (type === 'previous_week') {
    const previous = subWeeks(anchor, 1)
    return { start: iso(startOfWeek(previous, { weekStartsOn: 1 })), end: iso(endOfWeek(previous, { weekStartsOn: 1 })) }
  }
  if (type === 'previous_month') {
    const previous = subMonths(anchor, 1)
    return { start: iso(startOfMonth(previous)), end: iso(endOfMonth(previous)) }
  }
  return { start: iso(startOfMonth(anchor)), end: iso(endOfMonth(anchor)) }
}

export function buildLeadConferenceRows(
  sellers: LeadConferenceSeller[],
  checkins: CheckinWithTotals[],
): LeadConferenceRow[] {
  const totals = new Map<string, { internet: number; carteira: number }>()
  for (const checkin of checkins) {
    const current = totals.get(checkin.seller_user_id) || { internet: 0, carteira: 0 }
    current.internet += checkin.leads_net_prev_day || 0
    current.carteira += checkin.leads_prev_day || 0
    totals.set(checkin.seller_user_id, current)
  }
  return sellers.map(seller => ({
    sellerId: seller.id,
    sellerName: seller.name,
    internetMx: totals.get(seller.id)?.internet || 0,
    internetOfficial: null,
    carteiraMx: totals.get(seller.id)?.carteira || 0,
    carteiraOfficial: null,
  }))
}

export function summarizeLeadConference(rows: LeadConferenceRow[]): LeadConferenceSummary {
  const totalMx = rows.reduce((sum, row) => sum + row.internetMx + row.carteiraMx, 0)
  const complete = rows.length > 0 && rows.every(row => row.internetOfficial !== null && row.carteiraOfficial !== null)
  if (!complete) return { totalMx, totalOfficial: null, totalDifference: null, divergentSellers: null, complete }
  const totalOfficial = rows.reduce(
    (sum, row) => sum + (row.internetOfficial || 0) + (row.carteiraOfficial || 0),
    0,
  )
  const divergentSellers = rows.filter(row => getLeadConferenceRowDifference(row) !== 0).length
  return { totalMx, totalOfficial, totalDifference: totalOfficial - totalMx, divergentSellers, complete }
}

export function getLeadConferenceRowDifference(row: LeadConferenceRow) {
  if (row.internetOfficial === null || row.carteiraOfficial === null) return null
  return (row.internetOfficial - row.internetMx) + (row.carteiraOfficial - row.carteiraMx)
}

export function toLeadConferencePayload(rows: LeadConferenceRow[]) {
  return rows.map(row => ({
    seller_user_id: row.sellerId,
    internet_mx: row.internetMx,
    internet_official: row.internetOfficial,
    carteira_mx: row.carteiraMx,
    carteira_official: row.carteiraOfficial,
  }))
}

export const LEAD_CONFERENCE_PERIOD_LABELS: Record<LeadConferencePeriodType, string> = {
  current_week: 'Semana atual',
  previous_week: 'Semana anterior',
  current_month: 'Mês atual',
  previous_month: 'Mês anterior',
  custom: 'Período personalizado',
}

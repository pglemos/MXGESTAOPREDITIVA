import type { DailyCheckin } from '@/types/database'

export type PreviousClosingCard =
  | { type: 'previous_done'; date: string; checkin: DailyCheckin }
  | { type: 'previous_pending'; date: string; checkin: null }

export interface ActiveClosingContext {
  mainDate: string
  mainLabel: 'Hoje' | 'Ontem'
  mainCheckin: DailyCheckin | null
  isMainDateSubmitted: boolean
  canEditMainForm: boolean
  mode:
    | 'pending_previous_before_noon'
    | 'today_open_after_previous_done'
    | 'today_open'
    | 'today_submitted'
  previousCard: PreviousClosingCard | null
}

interface ResolveActiveClosingContextArgs {
  today: string
  yesterday: string
  now: Date
  yesterdayClosing: DailyCheckin | null
  todayClosing: DailyCheckin | null
}

function isSubmittedClosing(checkin: DailyCheckin | null) {
  if (!checkin?.submitted_at) return false
  const hasDeclaredMovement = [
    checkin.leads_prev_day,
    checkin.agd_cart_prev_day,
    checkin.agd_net_prev_day,
    checkin.agd_cart_today,
    checkin.agd_net_today,
    checkin.vnd_porta_prev_day,
    checkin.vnd_cart_prev_day,
    checkin.vnd_net_prev_day,
    checkin.visit_prev_day,
  ].some(value => Number(value || 0) > 0)
  const hasZeroJustification = Boolean(checkin.zero_reason?.trim())
  if (!hasDeclaredMovement && !hasZeroJustification) return false
  return String(checkin.submission_status || '') !== 'draft'
}

function getSaoPauloMinutes(now: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  })
  const parts = formatter.formatToParts(now)
  const byType = new Map(parts.map(part => [part.type, part.value]))
  return Number(byType.get('hour') || 0) * 60 + Number(byType.get('minute') || 0)
}

export function resolveActiveClosingContext({
  today,
  yesterday,
  now,
  yesterdayClosing,
  todayClosing,
}: ResolveActiveClosingContextArgs): ActiveClosingContext {
  const afterNoon = getSaoPauloMinutes(now) >= 12 * 60
  const yesterdaySubmitted = isSubmittedClosing(yesterdayClosing)
  const todaySubmitted = isSubmittedClosing(todayClosing)

  if (!afterNoon && !yesterdaySubmitted) {
    return {
      mainDate: yesterday,
      mainLabel: 'Ontem',
      mainCheckin: yesterdayClosing,
      isMainDateSubmitted: false,
      canEditMainForm: true,
      mode: 'pending_previous_before_noon',
      previousCard: null,
    }
  }

  const previousCard: PreviousClosingCard | null = yesterdaySubmitted && yesterdayClosing
    ? { type: 'previous_done', date: yesterday, checkin: yesterdayClosing }
    : afterNoon
      ? { type: 'previous_pending', date: yesterday, checkin: null }
      : null

  return {
    mainDate: today,
    mainLabel: 'Hoje',
    mainCheckin: todayClosing,
    isMainDateSubmitted: todaySubmitted,
    canEditMainForm: !todaySubmitted,
    mode: todaySubmitted ? 'today_submitted' : afterNoon ? 'today_open' : 'today_open_after_previous_done',
    previousCard,
  }
}

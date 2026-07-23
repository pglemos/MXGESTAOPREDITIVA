export type OwnerPeriod = 'month' | 'quarter' | 'year' | 'custom'

export type OwnerPeriodRange = {
  start: string
  end: string
}

export type OwnerProjectionMode = 'calendar' | 'business'

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function toOwnerDateOnly(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseOwnerDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
  return toOwnerDateOnly(date) === value ? date : null
}

export function countOwnerProjectionDays(
  start: string,
  end: string,
  mode: OwnerProjectionMode = 'calendar',
) {
  const first = parseOwnerDateOnly(start)
  const last = parseOwnerDateOnly(end)
  if (!first || !last || first > last) return 0

  let count = 0
  const cursor = new Date(first)
  while (cursor <= last) {
    if (mode === 'calendar' || cursor.getDay() !== 0) count += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

export function resolveOwnerPeriodGoal(
  monthlyGoal: number,
  period: OwnerPeriod = 'month',
  range?: OwnerPeriodRange,
  mode: OwnerProjectionMode = 'calendar',
) {
  if (!Number.isFinite(monthlyGoal) || monthlyGoal <= 0) return 0
  if (period === 'quarter') return monthlyGoal * 3
  if (period === 'year') return monthlyGoal * 12
  if (period !== 'custom' || !range) return monthlyGoal

  const first = parseOwnerDateOnly(range.start)
  const last = parseOwnerDateOnly(range.end)
  if (!first || !last || first > last) return monthlyGoal

  let proportionalGoal = 0
  const monthCursor = new Date(first.getFullYear(), first.getMonth(), 1, 12)
  const finalMonth = new Date(last.getFullYear(), last.getMonth(), 1, 12)
  while (monthCursor <= finalMonth) {
    const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1, 12)
    const monthEnd = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0, 12)
    const overlapStart = first > monthStart ? first : monthStart
    const overlapEnd = last < monthEnd ? last : monthEnd
    const selectedDays = countOwnerProjectionDays(toOwnerDateOnly(overlapStart), toOwnerDateOnly(overlapEnd), mode)
    const monthDays = countOwnerProjectionDays(toOwnerDateOnly(monthStart), toOwnerDateOnly(monthEnd), mode)
    proportionalGoal += monthDays > 0 ? monthlyGoal * (selectedDays / monthDays) : 0
    monthCursor.setMonth(monthCursor.getMonth() + 1)
  }

  return Math.round(proportionalGoal * 100) / 100
}

/**
 * Builds the date-only range used by every Dono query.
 * Date parts are formatted in the browser's business timezone instead of UTC
 * so the first day of a month cannot roll back to the previous calendar day.
 */
export function resolveOwnerPeriodRange(
  period: OwnerPeriod = 'month',
  now = new Date(),
  customStart = '',
  customEnd = '',
): OwnerPeriodRange {
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = toOwnerDateOnly(now)

  if (period === 'custom' && customStart && customEnd && customStart <= customEnd) {
    return { start: customStart, end: customEnd }
  }

  if (period === 'quarter') {
    return {
      start: toOwnerDateOnly(new Date(year, month - (month % 3), 1, 12)),
      end: today,
    }
  }

  if (period === 'year') {
    return {
      start: toOwnerDateOnly(new Date(year, 0, 1, 12)),
      end: today,
    }
  }

  return {
    start: toOwnerDateOnly(new Date(year, month, 1, 12)),
    end: today,
  }
}

export type OwnerPeriod = 'month' | 'quarter' | 'year' | 'custom'

export type OwnerPeriodRange = {
  start: string
  end: string
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function toOwnerDateOnly(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
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

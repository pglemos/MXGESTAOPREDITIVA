import { parseISO } from 'date-fns'

export const START_HOUR = 7
export const END_HOUR = 20
export const HOUR_HEIGHT = 56
export const SNAP_MINUTES = 15

export type AgendaItemKind = 'visit' | 'event'

export interface LayoutInput {
  id: string
  startsAt: string
  durationHours: number
}

/** Duration falls back to 1h when missing/invalid so an event never collapses to a sliver. */
export function safeDurationHours(durationHours: number | null | undefined): number {
  return durationHours && durationHours > 0 ? durationHours : 1
}

export function getEventPosition(
  startsAt: string,
  durationHours: number | null | undefined,
  startHour = START_HOUR,
  hourHeight = HOUR_HEIGHT,
) {
  const start = parseISO(startsAt)
  const startDecimal = start.getHours() + start.getMinutes() / 60
  const rawTop = (startDecimal - startHour) * hourHeight
  const top = Math.max(4, rawTop)
  const height = Math.max(30, safeDurationHours(durationHours) * hourHeight - 6)
  return { top, height }
}

export function snapMinutes(minutes: number, step = SNAP_MINUTES): number {
  return Math.round(minutes / step) * step
}

export function pxToMinutes(px: number, hourHeight = HOUR_HEIGHT): number {
  return (px / hourHeight) * 60
}

export function minutesToPx(minutes: number, hourHeight = HOUR_HEIGHT): number {
  return (minutes / 60) * hourHeight
}

export function clampDuration(hours: number, kind: AgendaItemKind): number {
  const min = 0.5
  const max = kind === 'visit' ? 12 : 24
  return Math.min(max, Math.max(min, hours))
}

export interface LayoutColumnAssignment<T> {
  item: T
  columnIndex: number
  columnCount: number
}

/**
 * Greedy interval-column assignment so overlapping events render side by
 * side instead of stacking on top of each other. Events are grouped into
 * time clusters first; columnCount is scoped per cluster.
 */
export function layoutOverlappingEvents<T extends LayoutInput>(items: T[]): LayoutColumnAssignment<T>[] {
  if (items.length === 0) return []

  const withRange = items
    .map((item) => {
      const start = parseISO(item.startsAt).getTime()
      const end = start + safeDurationHours(item.durationHours) * 3_600_000
      return { item, start, end }
    })
    .sort((a, b) => a.start - b.start || a.end - b.end)

  const clusters: (typeof withRange)[] = []
  let currentCluster: typeof withRange = []
  let clusterEnd = -Infinity

  for (const entry of withRange) {
    if (currentCluster.length === 0 || entry.start < clusterEnd) {
      currentCluster.push(entry)
      clusterEnd = Math.max(clusterEnd, entry.end)
    } else {
      clusters.push(currentCluster)
      currentCluster = [entry]
      clusterEnd = entry.end
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster)

  const result: LayoutColumnAssignment<T>[] = []
  for (const cluster of clusters) {
    const columnEnds: number[] = []
    const assigned: { item: T; columnIndex: number }[] = []

    for (const entry of cluster) {
      let placedColumn = -1
      for (let col = 0; col < columnEnds.length; col++) {
        if (entry.start >= columnEnds[col]) {
          columnEnds[col] = entry.end
          placedColumn = col
          break
        }
      }
      if (placedColumn === -1) {
        columnEnds.push(entry.end)
        placedColumn = columnEnds.length - 1
      }
      assigned.push({ item: entry.item, columnIndex: placedColumn })
    }

    const columnCount = columnEnds.length
    for (const entry of assigned) {
      result.push({ item: entry.item, columnIndex: entry.columnIndex, columnCount })
    }
  }

  return result
}

type SortableCentralAction = {
  due_at: string
  priority_rank: number
}

function toSortableTimestamp(value: string): number {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY
}

/**
 * Ordem operacional da Central:
 * 1. registros vencidos ou com data inválida, para não ficarem invisíveis;
 * 2. menor priority_rank;
 * 3. menor data/hora;
 * 4. ordem original, garantida pelo sort estável do ECMAScript atual.
 */
export function sortCentralActions<T extends SortableCentralAction>(items: readonly T[], now = new Date()): T[] {
  const nowTimestamp = now.getTime()

  return [...items].sort((left, right) => {
    const leftTimestamp = toSortableTimestamp(left.due_at)
    const rightTimestamp = toSortableTimestamp(right.due_at)
    const leftLate = leftTimestamp < nowTimestamp
    const rightLate = rightTimestamp < nowTimestamp

    if (leftLate !== rightLate) return leftLate ? -1 : 1
    if (left.priority_rank !== right.priority_rank) return left.priority_rank - right.priority_rank
    if (leftTimestamp !== rightTimestamp) return leftTimestamp - rightTimestamp
    return 0
  })
}

export function isCentralActionOverdue(action: Pick<SortableCentralAction, 'due_at'>, now = new Date()): boolean {
  return toSortableTimestamp(action.due_at) < now.getTime()
}

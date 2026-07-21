export const SELLER_SIMULATION_CONTEXT_KEY = 'mx_seller_simulation_context'

export type SimulationExecutionContext = {
  role: 'vendedor'
  userId: string
  storeId: string
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function defaultStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function readSimulationContext(
  storage: StorageLike | null = defaultStorage(),
): SimulationExecutionContext | null {
  if (!storage) return null

  const raw = storage.getItem(SELLER_SIMULATION_CONTEXT_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<SimulationExecutionContext>
    if (
      parsed.role !== 'vendedor'
      || !isNonEmptyString(parsed.userId)
      || !isNonEmptyString(parsed.storeId)
    ) return null

    return {
      role: 'vendedor',
      userId: parsed.userId,
      storeId: parsed.storeId,
    }
  } catch {
    return null
  }
}

export function writeSimulationContext(
  context: SimulationExecutionContext,
  storage: StorageLike | null = defaultStorage(),
) {
  if (!storage) return
  storage.setItem(SELLER_SIMULATION_CONTEXT_KEY, JSON.stringify(context))
}

export function clearSimulationContext(
  storage: StorageLike | null = defaultStorage(),
) {
  storage?.removeItem(SELLER_SIMULATION_CONTEXT_KEY)
}

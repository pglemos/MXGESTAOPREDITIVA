export const SELLER_SIMULATION_CONTEXT_KEY = 'mx_seller_simulation_context'
export const SELLER_SIMULATION_CONTEXT_CHANGED_EVENT = 'mx:seller-simulation-context-changed'

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

function isBrowserSessionStorage(storage: StorageLike | null): boolean {
  return typeof window !== 'undefined' && storage === window.sessionStorage
}

function notifySimulationContextChanged(storage: StorageLike | null) {
  if (!isBrowserSessionStorage(storage)) return
  window.dispatchEvent(new Event(SELLER_SIMULATION_CONTEXT_CHANGED_EVENT))
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

/**
 * Aguarda a resolução assíncrona do vendedor/loja quando a aplicação é
 * recarregada durante uma simulação. Sem isso, a tela da Carteira pode iniciar
 * uma consulta como o administrador antes de o hook de autenticação publicar
 * a identidade efetiva do vendedor.
 */
export function waitForSimulationContext(
  timeoutMs = 5_000,
): Promise<SimulationExecutionContext | null> {
  const immediate = readSimulationContext()
  if (immediate || typeof window === 'undefined') return Promise.resolve(immediate)

  return new Promise(resolve => {
    let settled = false
    const finish = (context: SimulationExecutionContext | null) => {
      if (settled) return
      settled = true
      window.removeEventListener(SELLER_SIMULATION_CONTEXT_CHANGED_EVENT, handleChange)
      window.clearTimeout(timeoutId)
      resolve(context)
    }
    const handleChange = () => finish(readSimulationContext())
    const timeoutId = window.setTimeout(() => finish(readSimulationContext()), timeoutMs)

    window.addEventListener(SELLER_SIMULATION_CONTEXT_CHANGED_EVENT, handleChange)

    // Fecha a pequena janela entre a leitura inicial e o registro do listener.
    const afterSubscription = readSimulationContext()
    if (afterSubscription) finish(afterSubscription)
  })
}

export function writeSimulationContext(
  context: SimulationExecutionContext,
  storage: StorageLike | null = defaultStorage(),
) {
  if (!storage) return
  storage.setItem(SELLER_SIMULATION_CONTEXT_KEY, JSON.stringify(context))
  notifySimulationContextChanged(storage)
}

export function clearSimulationContext(
  storage: StorageLike | null = defaultStorage(),
) {
  storage?.removeItem(SELLER_SIMULATION_CONTEXT_KEY)
  notifySimulationContextChanged(storage)
}

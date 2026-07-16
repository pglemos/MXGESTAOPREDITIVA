type KeyFactory = (scope: string) => string

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    )
  }
  return value
}

function defaultKeyFactory(scope: string): string {
  const suffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${scope}:${suffix}`
}

export function createCarteiraMutationCoordinator(
  keyFactory: KeyFactory = defaultKeyFactory,
  retryTtlMs = 60_000,
) {
  const inFlight = new Map<string, Promise<unknown>>()
  const recentKeys = new Map<string, { key: string; expiresAt: number }>()

  return {
    run<T>(scope: string, fingerprint: unknown, operation: (idempotencyKey: string) => Promise<T>): Promise<T> {
      const logicalKey = `${scope}:${JSON.stringify(canonicalize(fingerprint))}`
      const active = inFlight.get(logicalKey) as Promise<T> | undefined
      if (active) return active

      const now = Date.now()
      for (const [key, value] of recentKeys) {
        if (value.expiresAt <= now) recentKeys.delete(key)
      }
      const recent = recentKeys.get(logicalKey)
      const idempotencyKey = recent && recent.expiresAt > now
        ? recent.key
        : keyFactory(scope)

      recentKeys.set(logicalKey, { key: idempotencyKey, expiresAt: now + retryTtlMs })
      let operationPromise: Promise<T>
      try {
        operationPromise = operation(idempotencyKey)
      } catch (error) {
        operationPromise = Promise.reject(error)
      }
      const request = operationPromise
        .then(result => {
          if (recentKeys.get(logicalKey)?.key === idempotencyKey) {
            recentKeys.delete(logicalKey)
          }
          return result
        })
        .catch(error => {
          recentKeys.set(logicalKey, {
            key: idempotencyKey,
            expiresAt: Date.now() + retryTtlMs,
          })
          throw error
        })
        .finally(() => {
          inFlight.delete(logicalKey)
        })
      inFlight.set(logicalKey, request)
      return request
    },
  }
}

export const carteiraMutationCoordinator = createCarteiraMutationCoordinator()

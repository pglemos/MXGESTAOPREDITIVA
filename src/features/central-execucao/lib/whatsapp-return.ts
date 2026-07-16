export const CENTRAL_WHATSAPP_RETURN_KEY = 'ce_whatsapp_saida'
const MAX_RETURN_AGE_MS = 12 * 60 * 60 * 1_000

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface WhatsappDeparture {
  actionId: string
  leftAt: number
}

function isDeparture(value: unknown): value is WhatsappDeparture {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.actionId === 'string'
    && candidate.actionId.trim().length > 0
    && typeof candidate.leftAt === 'number'
    && Number.isFinite(candidate.leftAt)
}

export function saveWhatsappDeparture(storage: StorageLike, departure: WhatsappDeparture) {
  storage.setItem(CENTRAL_WHATSAPP_RETURN_KEY, JSON.stringify(departure))
}

export function consumeWhatsappReturn(storage: StorageLike, now = Date.now()): WhatsappDeparture | null {
  const raw = storage.getItem(CENTRAL_WHATSAPP_RETURN_KEY)
  if (!raw) return null

  storage.removeItem(CENTRAL_WHATSAPP_RETURN_KEY)

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isDeparture(parsed)) return null
    const age = now - parsed.leftAt
    if (age < 0 || age > MAX_RETURN_AGE_MS) return null
    return parsed
  } catch {
    return null
  }
}

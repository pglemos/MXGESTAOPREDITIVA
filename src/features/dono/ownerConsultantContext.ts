export type OwnerConsultantContext = {
  origin: string | null
  title: string | null
  status: string | null
  contextType: string
  contextId: string | null
  snapshot: Record<string, string>
}

const CONTEXT_ID_KEYS = ['id', 'indicador', 'acao', 'decisao']

export function parseOwnerConsultantContext(search: string): OwnerConsultantContext {
  const params = new URLSearchParams(search)
  const snapshot: Record<string, string> = {}

  for (const [key, value] of params.entries()) {
    const normalized = value.trim()
    if (normalized) snapshot[key] = normalized
  }

  const origin = params.get('origem')?.trim() || null
  const title = params.get('titulo')?.trim() || null
  const status = params.get('status')?.trim() || null
  const contextId = CONTEXT_ID_KEYS
    .map(key => params.get(key)?.trim())
    .find(Boolean) || null

  return {
    origin,
    title,
    status,
    contextType: origin || 'geral',
    contextId,
    snapshot,
  }
}

export function buildOwnerConsultantInitialSubject(context: OwnerConsultantContext): string {
  return context.title ? `Analisar: ${context.title}` : 'Solicitação ao Consultor MX'
}

export function buildOwnerConsultantInitialMessage(context: OwnerConsultantContext): string {
  if (!context.title) return ''
  const status = context.status ? `, que está com status ${context.status}` : ''
  return `Quero analisar ${context.title}${status}.`
}

export function ownerConsultantContextSummary(context: OwnerConsultantContext): string[] {
  return Object.entries(context.snapshot).map(([key, value]) => `${key}: ${value}`)
}

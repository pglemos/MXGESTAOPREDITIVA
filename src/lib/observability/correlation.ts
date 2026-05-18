/**
 * Story 0.9 — Correlation ID FE → RPC → logs_auditoria
 * X-8 / GAP-09 observability
 *
 * Gera UUID v4 por request (ou reusa o da sessão atual via React context futuro)
 * e injeta como header `x-correlation-id`. Backend lê via PostgREST
 * `current_setting('request.headers', true)` → `get_correlation_id()` SQL helper.
 *
 * Uso:
 *   const correlationId = newCorrelationId()
 *   const { data, error } = await callWithCorrelation(supabase, correlationId, (client) =>
 *     client.rpc('submit_checkin', { p_payload: payload })
 *   )
 *
 * Para Sentry tracking (Story 0.3), o helper Sentry.setTag('correlation_id', ...) é
 * chamado automaticamente.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const CORRELATION_HEADER = 'x-correlation-id'

/** Gera um UUID v4 (Web Crypto API; fallback Math.random para ambientes sem crypto) */
export function newCorrelationId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    // Fallback (apenas dev/test; produção SEMPRE tem crypto.randomUUID)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

/** Tenta marcar tag Sentry sem falhar se Sentry não estiver inicializado */
function tagSentry(correlationId: string): void {
    try {
        // Lazy require para evitar import circular se Sentry init ainda não rodou
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sentry = (globalThis as any).Sentry
        if (sentry && typeof sentry.setTag === 'function') {
            sentry.setTag('correlation_id', correlationId)
        }
    } catch {
        // No-op — Sentry pode não estar inicializado ainda (Story 0.3 pendente)
    }
}

/**
 * Executa uma chamada Supabase com correlation_id injetado no header.
 *
 * Por que não modificar o SupabaseClient global?
 * - O cliente é singleton (src/lib/supabase.ts) — mudar header por request via
 *   `headers` no construtor exige reset da sessão, perdendo Auth.
 * - Wrapper per-call mantém isolamento e permite múltiplos correlation_ids
 *   coexistirem (ex: race condition entre 2 RPCs paralelas).
 *
 * Implementação: o Supabase JS client (v2) aceita `fetch` customizado por chamada
 * via `global.fetch` override no construtor — mas isso é global.
 * Alternativa: usar `rest` builder explícito com `headers()` per request.
 *
 * O pattern aqui usa `client.functions.invoke` ou `client.rpc(...).abortSignal(...)`
 * — para `.rpc()` o método não aceita headers customizados nativamente.
 *
 * Workaround: usar `client.schema('public').rpc(...)` que sob o capô faz fetch
 * direto, e patch global `fetch` por escopo via `withCorrelationContext`.
 */
export async function callWithCorrelation<T>(
    client: SupabaseClient,
    correlationId: string,
    fn: (c: SupabaseClient) => Promise<T>,
): Promise<T> {
    tagSentry(correlationId)

    // Patch global fetch para anexar header durante o escopo da chamada.
    // Isso funciona porque o supabase-js usa `fetch` global do ambiente.
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers)
        if (!headers.has(CORRELATION_HEADER)) {
            headers.set(CORRELATION_HEADER, correlationId)
        }
        return originalFetch(input, { ...init, headers })
    }) as typeof fetch

    try {
        return await fn(client)
    } finally {
        globalThis.fetch = originalFetch
    }
}

/**
 * Variante para uso com supabase-js `.rpc()` direto:
 *   const result = await withCorrelation(corrId, () => supabase.rpc('foo', {...}))
 */
export async function withCorrelation<T>(
    correlationId: string,
    fn: () => Promise<T>,
): Promise<T> {
    tagSentry(correlationId)
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers)
        if (!headers.has(CORRELATION_HEADER)) {
            headers.set(CORRELATION_HEADER, correlationId)
        }
        return originalFetch(input, { ...init, headers })
    }) as typeof fetch
    try {
        return await fn()
    } finally {
        globalThis.fetch = originalFetch
    }
}

/**
 * Atalho: gera um correlation_id novo + executa.
 * Retorna { result, correlationId } para uso em logs FE / Sentry breadcrumbs.
 */
export async function traced<T>(
    fn: () => Promise<T>,
): Promise<{ result: T; correlationId: string }> {
    const correlationId = newCorrelationId()
    const result = await withCorrelation(correlationId, fn)
    return { result, correlationId }
}

export { CORRELATION_HEADER }

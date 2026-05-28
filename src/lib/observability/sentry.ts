/**
 * Story 0.3 — Sentry init (FE)
 * Integra com Story 0.9 correlation_id via tag automática.
 *
 * Env vars necessárias (configurar no Vercel/Supabase Dashboard):
 *   VITE_SENTRY_DSN          — DSN do projeto Sentry (obtido em sentry.io)
 *   VITE_SENTRY_ENVIRONMENT  — staging | production (default: import.meta.env.MODE)
 *   VITE_RELEASE             — git SHA ou versão (default: 'dev')
 *   VITE_SENTRY_TRACES_SAMPLE_RATE — 0.0-1.0 (default 0.1)
 *
 * Se VITE_SENTRY_DSN não estiver definido, init vira no-op (dev local).
 */

import * as Sentry from '@sentry/react'

export interface SentryConfig {
    dsn?: string
    environment?: string
    release?: string
    tracesSampleRate?: number
}

let initialized = false

export function initSentry(config?: SentryConfig): void {
    if (initialized) return

    const dsn = config?.dsn ?? import.meta.env.VITE_SENTRY_DSN
    if (!dsn) {
        if (import.meta.env.PROD) {
            console.warn('[sentry] VITE_SENTRY_DSN ausente em produção — observabilidade DESABILITADA (SYS-017)')
        }
        return
    }

    const environment =
        config?.environment ??
        import.meta.env.VITE_SENTRY_ENVIRONMENT ??
        import.meta.env.MODE ??
        'development'

    const release =
        config?.release ??
        import.meta.env.VITE_RELEASE ??
        'dev'

    const tracesSampleRate =
        config?.tracesSampleRate ??
        Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0.1')

    Sentry.init({
        dsn,
        environment,
        release,
        tracesSampleRate,
        // Não capturamos Session Replay nesta fase (UX-030 backlog)
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        // Ignora ruído conhecido
        ignoreErrors: [
            'ResizeObserver loop limit exceeded',
            'ResizeObserver loop completed with undelivered notifications',
            'Network request failed', // ofuscado por design — verdadeiro problema vem de RPCs
        ],
        beforeSend(event) {
            // Sanitização: nunca enviar tokens/secrets em headers
            if (event.request?.headers) {
                const sanitized: Record<string, string> = {}
                for (const [k, v] of Object.entries(event.request.headers)) {
                    if (/authorization|cookie|apikey|token/i.test(k)) {
                        sanitized[k] = '[REDACTED]'
                    } else {
                        sanitized[k] = String(v)
                    }
                }
                event.request.headers = sanitized
            }
            return event
        },
    })

    // Expõe globalmente para correlation.ts integrar via globalThis.Sentry
    if (typeof globalThis !== 'undefined') {
        ;(globalThis as unknown as { Sentry: typeof Sentry }).Sentry = Sentry
    }

    initialized = true
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
    if (!initialized) return
    Sentry.captureException(error, { extra: context })
}

export function setCorrelationTag(correlationId: string): void {
    if (!initialized) return
    Sentry.setTag('correlation_id', correlationId)
}

export { Sentry }

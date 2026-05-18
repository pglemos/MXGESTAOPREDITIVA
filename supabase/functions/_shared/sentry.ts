/**
 * Story 0.3 — Sentry para Edge Functions Deno
 *
 * Edge Functions Supabase usam Deno; Sentry tem SDK Deno via JSR.
 * Este helper centraliza init para reuso.
 *
 * Env vars necessárias (Supabase Dashboard → Functions → Secrets):
 *   SENTRY_DSN
 *   SENTRY_ENVIRONMENT (default: 'production')
 *   SENTRY_RELEASE (default: 'edge-dev')
 *
 * Uso em uma edge function:
 *
 *   import { initSentryForEdge, withSentry } from "../_shared/sentry.ts";
 *
 *   initSentryForEdge();
 *
 *   Deno.serve(async (req) => withSentry(req, async () => {
 *     // ... handler logic
 *   }));
 */

// @ts-expect-error — Deno runtime imports
import * as Sentry from "https://deno.land/x/sentry@7.94.1/index.mjs";

let initialized = false;

export function initSentryForEdge(): void {
    if (initialized) return;

    // @ts-expect-error — Deno globals
    const dsn = Deno.env.get("SENTRY_DSN");
    if (!dsn) {
        // No-op silencioso — DSN ausente é comum em dev local
        return;
    }

    Sentry.init({
        dsn,
        // @ts-expect-error — Deno globals
        environment: Deno.env.get("SENTRY_ENVIRONMENT") ?? "production",
        // @ts-expect-error — Deno globals
        release: Deno.env.get("SENTRY_RELEASE") ?? "edge-dev",
        tracesSampleRate: 0.1,
    });

    initialized = true;
}

/**
 * Wrapper que captura erros não tratados em handler Deno e propaga ao Sentry com
 * tag correlation_id (se cliente enviou header).
 */
export async function withSentry(
    req: Request,
    handler: () => Promise<Response>,
): Promise<Response> {
    const correlationId = req.headers.get("x-correlation-id") ?? undefined;

    if (correlationId && initialized) {
        Sentry.setTag("correlation_id", correlationId);
    }

    try {
        return await handler();
    } catch (error) {
        if (initialized) {
            Sentry.captureException(error, {
                tags: { correlation_id: correlationId ?? "n/a" },
                extra: {
                    url: req.url,
                    method: req.method,
                },
            });
            // Garante flush antes de retornar (Edge Functions têm lifecycle curto)
            await Sentry.flush(2000);
        }

        // Não vazar SQLERRM / stack — Story 1.5 pattern
        const traceId = crypto.randomUUID();
        console.error(`[edge-error] trace_id=${traceId}`, error);

        return new Response(
            JSON.stringify({
                ok: false,
                error: `Erro interno na edge function. trace_id=${traceId}`,
                trace_id: traceId,
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}

export { Sentry };

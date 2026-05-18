# Sentry Setup — FE + Edge Functions

**Story:** 0.3
**Débito:** SYS-017 / X-8 (observabilidade)
**Status:** Código pronto, falta configurar DSN

---

## O que está implementado

### Frontend (`src/main.tsx`)
- `initSentry()` chamado antes de qualquer renderização
- No-op silencioso se `VITE_SENTRY_DSN` ausente (dev local)
- Helper em `src/lib/observability/sentry.ts`:
  - `initSentry(config?)`
  - `captureError(error, extra?)`
  - `setCorrelationTag(correlationId)` — integra com Story 0.9
- `globalThis.Sentry` exposto para que `correlation.ts` aplique tag automaticamente

### Build (`vite.config.ts`)
- `sentryVitePlugin` ativo se `SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT` definidos
- Source maps gerados + uploadados + **deletados do output público** (`filesToDeleteAfterUpload`)
- Release name via `VITE_RELEASE`

### Edge Functions (`supabase/functions/_shared/sentry.ts`)
- `initSentryForEdge()` — chamar no topo do módulo
- `withSentry(req, handler)` — wrapper que captura exceptions + flush + retorna 500 com `trace_id` (Story 1.5 pattern)
- Auto-tag `correlation_id` se header presente

---

## Setup operacional (DevOps)

### 1. Criar projeto Sentry

- Acessar https://sentry.io → Create Project
- Platform: **React** (FE) — gera DSN
- Repetir para Edge Functions: platform **Deno** (ou usar mesmo projeto com tag `runtime`)
- Anotar o DSN

### 2. Gerar Auth Token para upload de source maps

- Sentry → Settings → Auth Tokens → Create
- Scopes mínimos: `project:releases`, `org:read`
- Anotar o token

### 3. Configurar no Vercel (FE)

Settings → Environment Variables:

```
VITE_SENTRY_DSN=<dsn_publico_do_sentry>
VITE_SENTRY_ENVIRONMENT=production
VITE_RELEASE=$VERCEL_GIT_COMMIT_SHA   # via Vercel preset
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1

# Build-time (apenas em build, não exposto no bundle)
SENTRY_AUTH_TOKEN=<token>
SENTRY_ORG=<slug-da-org>
SENTRY_PROJECT=mx-gestao-preditiva
```

### 4. Configurar no Supabase Dashboard (Edge Functions)

Project → Settings → Edge Functions → Secrets:

```
SENTRY_DSN=<dsn_edge_functions>
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=<git_sha_ou_versao>
```

### 5. Smoke test

#### FE
Adicionar rota oculta temporária:
```tsx
// src/pages/__SentrySmoke.tsx
import { captureError } from '@/lib/observability'

export function SentrySmoke() {
    return (
        <button onClick={() => { throw new Error('sentry-smoke-test FE') }}>
            Disparar erro Sentry
        </button>
    )
}
```
Deploy preview → clicar → verificar evento no Sentry com stack trace **de-minificado**.

#### Edge Function
```typescript
import { initSentryForEdge, withSentry } from "../_shared/sentry.ts";
initSentryForEdge();
Deno.serve((req) => withSentry(req, async () => {
    throw new Error('sentry-smoke-test edge');
}));
```
Invocar via `supabase functions invoke ...` → verificar evento Sentry.

### 6. Validar source maps

No evento Sentry FE, ver "stacktrace" — deve mostrar:
- ✅ Nomes de funções legíveis (`MorningReport.tsx:45`)
- ❌ Não: `s.handle is not a function at u (main-abc123.js:42:13)`

Se ofuscado, conferir:
- `SENTRY_AUTH_TOKEN/ORG/PROJECT` corretos no build
- `VITE_RELEASE` matches o release no evento (auto-sync via plugin)
- `.map` files removidos do `/assets/*.map` em produção (security)

---

## Integração com Story 0.9 (Correlation ID)

`src/lib/observability/correlation.ts` chama `globalThis.Sentry.setTag('correlation_id', ...)` automaticamente em todo `withCorrelation()` / `traced()`. Quando ocorrer erro:

```
Sentry event:
  tags:
    correlation_id: <uuid>
  stacktrace: <de-minificado>
```

Query SQL paralela:
```sql
SELECT * FROM rpc_error_log WHERE correlation_id = '<uuid>';
SELECT * FROM logs_auditoria WHERE correlation_id = '<uuid>';
```

→ postmortem completo em <30s.

---

## Performance

- `tracesSampleRate: 0.1` — amostra 10% das transactions (custo controlado)
- `replaysSessionSampleRate: 0` — Session Replay desabilitado (UX-030 backlog)
- `ignoreErrors` filtra ruído conhecido (ResizeObserver, Network failed)
- `beforeSend` redacta headers sensíveis (Authorization, Cookie, apikey, token)

---

## Pendente (não-escopo desta story)

- Session Replay (UX-030 — Sprint 3)
- Alertas Slack via Sentry webhook (Sprint 1)
- "Issue ownership rules" no dashboard Sentry — atribui issues por path
- Performance Monitoring p99 detalhado (UX-030)

---

## Referências

- `src/main.tsx` (init)
- `src/lib/observability/sentry.ts` (FE helper)
- `supabase/functions/_shared/sentry.ts` (Edge Functions)
- `vite.config.ts` (sourcemaps upload)
- `.env.example` (vars necessárias)
- `docs/dev/observability.md` (Story 0.9 correlation ID — integração)
- Story 0.3: `docs/stories/sprint-0/story-0.3-sentry-source-maps-init.md`

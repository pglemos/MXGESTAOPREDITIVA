# Observability — Correlation ID FE → RPC → Logs

**Story:** 0.9
**Migration:** `supabase/migrations/20260518130000_correlation_id_observability.sql`
**Helper FE:** `src/lib/observability/correlation.ts`

---

## Por que

GAP-09 (qa-review §2) e X-8: hoje **não é possível** correlacionar um clique no FE → erro Sentry → linha de `logs_auditoria` ou `rpc_error_log`. Em incidente de produção (Sprint 1.4 canary DB-016, por exemplo) o postmortem fica preso em "erro X aconteceu — qual fluxo de usuário?".

Esta story implementa **correlation ID end-to-end**:

```
FE: traced(() => supabase.rpc('submit_checkin', {...}))
      ↓ header x-correlation-id: <uuid>
Supabase PostgREST → request.headers
      ↓ get_correlation_id() lê o setting
RPC: log_rpc_error(...)  →  rpc_error_log.correlation_id = <uuid>
        |
        ↓ Sentry.setTag('correlation_id', <uuid>) (Story 0.3)
        ↓ logs_auditoria.correlation_id = <uuid> (via append_audit_log)
```

Postmortem: `SELECT * FROM rpc_error_log WHERE correlation_id = '<uuid>'` → resolve incidente em <30s.

---

## Componentes implementados

### DB (esta migration)

- `logs_auditoria.correlation_id text` (+ index parcial)
- `rpc_error_log.correlation_id text` (+ index parcial)
- `public.get_correlation_id()` — extrai header da request PostgREST
- `public.log_rpc_error(...)` — atualizada para capturar correlation_id automaticamente (transparente para callers Story 1.5)
- `public.append_audit_log(entity, action, details)` — helper para gravar em logs_auditoria com correlation

### FE

- `src/lib/observability/correlation.ts`
  - `newCorrelationId()` — UUID v4 via crypto.randomUUID
  - `withCorrelation(id, fn)` — patcha `globalThis.fetch` por escopo, injeta header
  - `traced(fn)` — atalho que gera + retorna o ID junto com o resultado
  - `callWithCorrelation(client, id, fn)` — wrapper recebendo cliente

---

## Uso prático

### Pattern 1: gerar ID, executar, recuperar para logging FE

```ts
import { traced } from '@/lib/observability'
import { supabase } from '@/lib/supabase'

const { result, correlationId } = await traced(() =>
    supabase.rpc('submit_checkin', { p_payload: payload }),
)

console.info('[checkin]', { correlationId, ok: result.data?.ok })

if (!result.data?.ok) {
    // trace_id da RPC + correlation_id do FE → ambos no Sentry tag
    captureSentryError(result.error, { correlationId, traceId: result.data?.trace_id })
}
```

### Pattern 2: passar correlationId entre chamadas correlacionadas

```ts
import { newCorrelationId, withCorrelation } from '@/lib/observability'

const corrId = newCorrelationId()

const checkinResult = await withCorrelation(corrId, () =>
    supabase.rpc('submit_checkin', { p_payload: checkinPayload }),
)

const reportResult = await withCorrelation(corrId, () =>
    supabase.rpc('get_lancamentos_referencia_dia', { p_reference_date: today }),
)

// Ambas as chamadas têm o MESMO correlation_id nos logs server-side
```

### Pattern 3: server-side (RPC chamando RPC) — sem header

`get_correlation_id()` retorna `NULL` quando chamado fora do contexto PostgREST (ex: cron, trigger). Isso é esperado — o caller pode passar explicitamente o correlation_id se quiser linkar.

---

## Performance

- `get_correlation_id()` é `STABLE` — single call por query, sem overhead repetido
- Index parcial (`WHERE correlation_id IS NOT NULL`) mantém tabela leve
- Sem efeito mensurável em RPCs já testadas (1.5/1.6/1.10)

---

## Privacidade / LGPD

`correlation_id` é UUID **opaco**. Não contém PII. Logs com correlation_id podem ser retidos seguindo política geral de `rpc_error_log` (90 dias — Story 1.5).

---

## Validação rápida

```bash
# Após aplicar migration
psql "$DATABASE_URL" -c "SELECT public.get_correlation_id();"
# → NULL (esperado em chamada direta, sem PostgREST)

# Via PostgREST simulando header
curl -X POST "$SUPABASE_URL/rest/v1/rpc/get_correlation_id" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $JWT" \
  -H "x-correlation-id: test-abc-123"
# → "test-abc-123"
```

---

## Pendente (não-escopo desta story)

- Aplicar `traced()` nos callsites principais (Story 1.2 — migrar consumers) — pode ser feito em paralelo
- Integração com Sentry tag automática (Story 0.3 — Sentry init)
- Session Replay correlation (UX-030 backlog)

---

## Referências

- `supabase/migrations/20260518130000_correlation_id_observability.sql`
- `src/lib/observability/correlation.ts`
- `supabase/migrations/20260517120000_rpc_error_log_wrap_sqlerrm.sql` (Story 1.5 origem)
- `docs/reviews/qa-review.md` §2 GAP-09
- `docs/prd/technical-debt-assessment.md` X-8
- Story 0.9: `docs/stories/sprint-0/story-0.9-correlation-id-fe-rpc.md`

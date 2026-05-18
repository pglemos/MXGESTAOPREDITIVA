# Story 0.9 — Correlation ID FE → RPC → logs_auditoria

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 0
**Prioridade:** P0
**Severidade do débito:** Alta
**Débito relacionado:** X-8 (observabilidade) / GAP-09 (qa-review §2)
**Esforço estimado:** 6h
**Owner sugerido:** @dev
**RACI:** R=@dev, A=Tech Lead, C=@data-engineer, @devops, I=squad
**Created:** 2026-05-17

## File List
- `supabase/migrations/20260518130000_correlation_id_observability.sql` (correlation_id col + get_correlation_id() + log_rpc_error update + append_audit_log helper)
- `src/lib/observability/correlation.ts` (FE helpers: newCorrelationId/withCorrelation/traced)
- `src/lib/observability/index.ts` (barrel export)
- `docs/dev/observability.md` (runbook completo)

## Change Log (Implementação)
- 2026-05-18 | @aiox-master (Orion) | Status: Ready → InReview | Migration + FE helpers + runbook. Aplicação aos callsites fica para Story 1.2 (migrar consumers).

## Problem Statement
GAP-09 do qa-review §2 aponta observabilidade FE fragmentada: Sentry (SYS-017) cobre erros, mas falta correlation ID amarrando uma ação do usuário no FE → chamada RPC → registro em `logs_auditoria` server-side. Sem isso, postmortem do rollout DB-016 (Sprint 1) é impossível ("erro X aconteceu — qual fluxo de usuário?").

## Business Value
Possibilita rastrear cada incidente de produção do clique no FE até a linha do log server-side em <30s. Pré-requisito para SLO/SLA reais e para confiança em rollouts canary de Sprint 1.

## Acceptance Criteria
1. **AC1:** Given uma ação do usuário no FE que dispara RPC crítica (lista inicial: `submit_checkin`, `register_meta`, e 1 RPC de leitura), When a request sai, Then o header `x-correlation-id` (UUID v4) é enviado e o mesmo ID aparece no `logs_auditoria.correlation_id` do registro server-side gerado.
2. **AC2:** Given Sentry está ativo (Story 0.3), When um erro ocorre em uma dessas RPCs, Then o evento Sentry tem tag `correlation_id` com o mesmo valor.
3. **AC3:** Given coluna `correlation_id text` em `logs_auditoria` (migration nova com `-- DOWN`), When `npm run test:rls` (Story 0.5) roda, Then nenhuma regressão é introduzida.

## Scope IN
- Helper FE `withCorrelationId(rpcCall)` em `src/lib/observability/correlation.ts`.
- Migration `supabase/migrations/{ts}_add_correlation_id_to_logs_auditoria.sql` com UP+DOWN.
- Atualização de trigger/função que escreve em `logs_auditoria` para capturar `current_setting('request.headers')::json->>'x-correlation-id'`.
- Wrapper aplicado a 3 RPCs piloto (1 escrita crítica + 1 leitura + `submit_checkin`).
- Tag `correlation_id` no Sentry via `Sentry.setTag` no helper.
- Validação end-to-end documentada em `docs/dev/observability.md`.

## Scope OUT
- Aplicar wrapper a todas as RPCs (Sprint 1+).
- Session Replay / RUM (UX-030 Sprint 3).
- PostHog/Amplitude business events (backlog).
- Persistência de correlation_id em estado React global (apenas per-request por enquanto).

## Tasks
- [ ] Adicionar coluna `correlation_id text` em `logs_auditoria` (migration `critical` com `-- DOWN`).
- [ ] Implementar helper `withCorrelationId(rpc, args)` que injeta header e UUID.
- [ ] Atualizar função/trigger que popula `logs_auditoria` para ler header.
- [ ] Aplicar wrapper às 3 RPCs piloto.
- [ ] Integrar `Sentry.setTag('correlation_id', id)` no helper.
- [ ] Smoke test end-to-end: clique FE → confirmar header + linha em `logs_auditoria` + tag Sentry.
- [ ] Documentar em `docs/dev/observability.md`.

## Dependências
- **Bloqueada por:** Story 0.3 (Sentry init), Story 0.7 (gate de migration reversibility — esta migration é `critical`).
- **Bloqueia:** Sprint 1 — habilita postmortem dos rollouts DB-016/DB-006/etc.

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Header não propagado em edge functions intermediárias | Alta | Validar via teste end-to-end real; documentar limitação |
| Overhead em p95 das RPCs | Baixa | Medir antes/depois; aceitar até +5ms |
| Migration quebra `logs_auditoria` ativo | Alta | DOWN validado em branch ephemeral (Story 0.7) |
| Cardinality alta em Sentry (UUID por evento) | Média | Usar tag, não searchable index; revisar quota |

## Testes Requeridos
- [ ] Smoke end-to-end: clique → header → log → Sentry tag (manual em staging).
- [ ] Migration UP/DOWN/UP em branch ephemeral verde.
- [ ] Suite RLS (Story 0.5) continua verde.
- [ ] Benchmark p95 antes/depois de 3 RPCs (delta documentado).
- [ ] `npm run typecheck` + `npm run lint` verdes.

## Definition of Done
- [ ] ACs verdes
- [ ] Testes passando + benchmark documentado
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] `docs/dev/observability.md` atualizado
- [ ] PR merged
- [ ] @qa gate PASS

## Rollback Plan
1. Helper FE: desativar via flag local (envia request sem header) → server aceita `NULL`.
2. Migration: rodar DOWN (remove coluna) — validado em Story 0.7.
3. Sentry: tags são opcionais, sem impacto se ausentes.
4. RTO: <10min (feature toggle FE) ou <30min (DOWN migration + redeploy).

## Referências
- `docs/prd/technical-debt-assessment.md` §X-8, §SYS-017
- `docs/reviews/qa-review.md` §2 GAP-09, §10 (X-8 Crítica)

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10)

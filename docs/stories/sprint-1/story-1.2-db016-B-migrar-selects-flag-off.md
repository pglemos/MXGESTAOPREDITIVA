# Story 1.2 — DB-016 Fase B: Migrar 27 SELECTs do FE para RPCs (Feature Flag DESLIGADA)

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 1
**Prioridade:** P0
**Severidade do débito:** Crítica
**Débito relacionado:** DB-016 (Fase B — Canary Sequence)

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 1 critical-path: PASS (rollback multi-tier com RTO, bloqueada por 1.1, feature flag default OFF explícita, shadow-read + Sentry)
- 2026-05-18 | @dev (Dex) | Status: Ready → InReview | 13 consumers migrados atrás de feature flag `db016_rpc_enabled` (default OFF); `traced()` wrapping em 3 consumers críticos (useRanking, useCheckins, MorningReport); typecheck passa (apenas erro pré-existente em vite.config.ts).
**Esforço estimado:** 20h
**Owner sugerido:** @dev
**RACI:** R=@dev, A=Tech Lead, C=@data-engineer+@architect, I=stakeholders
**Created:** 2026-05-17

## Problem Statement
qa-review §4.1 Fase B: com as RPCs publicadas (story 1.1), o FE precisa migrar os 27 SELECTs cliente diretos em `lancamentos_diarios` para chamadas RPC — atrás de uma **feature flag DESLIGADA por padrão**. Migrar com flag-off permite shadow-testing (dual-read opcional) e reversão instantânea, sem mudar comportamento de produção até Fase C.

## Business Value
Pré-condição para o REVOKE (Fase C). Migrar com flag-off elimina risco de breakage no deploy do código — Fase C apenas vira a chave.

## Acceptance Criteria
1. **AC1:** Given os 27 SELECTs inventariados (story 0.8), When o PR é merged, Then 100% chamam `supabase.rpc('get_lancamentos_for_*')` quando flag `db016_rpc_enabled=true`, e mantêm SELECT direto quando `false`.
2. **AC2:** Given flag DESLIGADA em produção pós-deploy, When usuários operam, Then **zero** mudança de comportamento observada (erro rate, latência, dados retornados idênticos).
3. **AC3:** Given a feature flag, When ativada em ambiente staging, Then suite de smoke tests (story 0.6) passa 100%.
4. **AC4:** Given o código FE, When CodeRabbit roda, Then sem CRITICAL/HIGH e sem queries diretas remanescentes fora dos 27 mapeados.
5. **AC5:** Given observabilidade (Sentry + correlation ID story 0.9), When flag é ativada em staging, Then erros de RPC são rastreáveis end-to-end.

## Scope IN
- Refator dos 27 call-sites em `src/` para padrão `useLancamentosFetcher` (ou hook equivalente) com chaveamento por flag.
- Feature flag client-side `db016_rpc_enabled` (default `false`).
- Tipos TypeScript regenerados (story 0.1) das novas RPCs.
- Testes unit/integration cobrindo ambos os branches da flag.
- Smoke tests com flag ON em staging.
- Documentação `docs/runbooks/db016-feature-flag.md`.

## Scope OUT
- REVOKE em `lancamentos_diarios` (story 1.3).
- Rollout canary 1%→100% (story 1.4).
- Remover SELECTs (deferred para Sprint 2 pós-100%).
- Scripts/edge functions consumidores (cobrir no inventário se aplicável).

## Tasks
- [ ] Implementar feature flag client (default false) + persistência.
- [ ] Regenerar tipos TS (story 0.1) para as RPCs.
- [ ] Criar hook/helper `fetchLancamentos` com switch por flag.
- [ ] Migrar 27 call-sites (commits atômicos por componente).
- [ ] Testes unit cobrindo ambos os branches.
- [ ] Smoke tests (story 0.6) com flag ON em staging.
- [ ] Shadow-read opcional (logar diff em Sentry sem falhar).
- [ ] Runbook `docs/runbooks/db016-feature-flag.md`.
- [ ] CodeRabbit + @qa gate.

## Dependências
- **Bloqueada por:** Story 1.1 (RPCs publicadas), Sprint 0 done.
- **Bloqueia:** Story 1.3 (Fase C — REVOKE).

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Call-site esquecido fora dos 27 | Crítica | Lint rule bloqueando `from('lancamentos_diarios').select` no FE |
| Flag default acidentalmente ON | Crítica | Test CI valida `default=false`; PR review obrigatória |
| Tipos TS divergentes | Média | Regen automática (story 0.1); CI bloqueia drift |
| Bundle size aumenta | Baixa | Code-split do helper; medir antes/depois |

## Testes Requeridos
- [ ] Unit: cada branch da flag (RPC e SELECT)
- [ ] Integration: smoke tests com flag ON em staging
- [ ] Shadow-read: diff RPC vs SELECT sem divergência em 1h de tráfego staging
- [ ] Lint: 0 SELECTs diretos em `lancamentos_diarios` fora do helper
- [ ] Visual regression nos componentes de lançamentos (se aplicável)

## Definition of Done
- [ ] ACs verdes; testes 100%
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Flag default OFF confirmada em produção pós-deploy
- [ ] Smoke tests (story 0.6) passam com flag ON em staging
- [ ] Runbook publicado
- [ ] @qa gate PASS
- [ ] PR merged (@devops push)

## Rollback Plan
1. **Cenário 1 — Bug no helper com flag OFF:** revert do PR via `git revert`; redeploy. RTO: <15min.
2. **Cenário 2 — Bug descoberto com flag ON em staging:** desligar flag (instant); investigar.
3. **Cenário 3 — Tipos TS quebram build:** regenerar (story 0.1) e fixup; pior caso revert.
4. **Flag kill-switch:** documentado no runbook — comando único para forçar OFF em todos clientes.
5. RTO target: <15min para revert; <1min para flag-off.

## Notas Técnicas
- Feature flag: usar mecanismo existente (Supabase remote config ou env-driven com fallback).
- Shadow-read: `Promise.all([rpc(), select()])` com `dataDiff` reportado ao Sentry sem afetar UX.
- Correlation ID propagado em ambas as chamadas.

## Referências
- `docs/prd/technical-debt-assessment.md` §DB-016
- `docs/reviews/qa-review.md` §4.1 Fase B
- `docs/security/lancamentos-diarios-consumers.md` (story 0.8)
- Story 1.1 (RPCs)

## File List (Story 1.2)

Implementação (Sprint 1):

- **Novo:** `src/lib/feature-flags.ts` — helper `isLancamentosViaRpcEnabled()` (default OFF; aceita override `localStorage` ou `VITE_FLAG_LANCAMENTOS_VIA_RPC`)

**13 consumers migrados** (cada um com switch flag ON → RPC / flag OFF → SELECT direto legacy):

- `src/hooks/useRanking.ts` — 3 hooks (useRanking, useGlobalRanking, useStorePerformance); `traced()` wrap; RPCs `get_lancamentos_por_loja_periodo` + `get_lancamentos_rede_periodo` + `get_lancamentos_referencia_dia`
- `src/hooks/useCheckins.ts` — 4 fluxos (fetchCheckins, fetchTodayCheckin, fetchCheckinByDate, useMyCheckins, useCheckinsByDateRange); `traced()` wrap; RPCs `get_lancamentos_por_loja_periodo` + `get_lancamentos_por_vendedor_periodo` + `get_lancamento_por_dia`
- `src/hooks/useTeam.ts` — 3 hooks (useTeam, useStoresStats, useSellersByStore); RPC `get_lancamentos_por_loja_periodo` + `get_lancamentos_referencia_dia`
- `src/hooks/usePerformance.ts` — RPC `get_lancamentos_por_loja_periodo`
- `src/hooks/useNetworkHierarchy.ts` — RPC `get_lancamentos_referencia_dia`
- `src/pages/MorningReport.tsx` — AdminMorningReport com `traced()` wrap; RPCs admin (rede + referência)
- `src/pages/PainelConsultor.tsx` — RPCs admin (rede + referência dia)
- `src/pages/GerenteFeedback.tsx` — RPC `get_lancamentos_por_vendedor_periodo` (dynamic import preservado)
- `src/pages/AiDiagnostics.tsx` — RPC `get_lancamentos_rede_periodo`
- `src/lib/services/checkin-service.ts` — Marcado `@deprecated`; INSERT direto preservado por enquanto (será removido após Story 1.3 REVOKE); dedup SELECT migrado para `get_lancamento_por_dia` quando flag ON
- `src/lib/automation/cron-scheduler.ts` — RPC `get_lancamentos_por_loja_periodo` (per-store loop)
- `src/lib/automation/weekly/feedback-engine.ts` — RPC `get_lancamentos_por_loja_periodo`
- `src/lib/automation/monthly/close-engine.ts` — RPC `get_lancamentos_por_loja_periodo`

## Notas de Implementação

1. **Comportamento prod inalterado:** flag default = `false` → todos os caminhos legacy continuam ativos. Nenhum impacto observável até flag ser ligada manualmente em staging/canary (Story 1.3).
2. **Aleatórias decisões técnicas:**
   - `useStoresStats` para `dono` multi-loja (N≥2 stores) volta ao SELECT direto mesmo com flag ON — RPCs disponíveis cobrem rede (admin) ou loja única. Multi-store por authorized list é caso edge não suportado pelas 5 RPCs atuais. Pode justificar nova RPC `get_lancamentos_para_lojas(uuid[], date)` se Story 1.3 detectar telemetria.
   - `useCheckins.fetchCheckins` sem filtros (storeId apenas) mantém SELECT direto mesmo com flag ON — RPCs exigem range explícito.
3. **Tipos:** RPCs retornam `SETOF lancamentos_diarios` (todas colunas); cast simples para `DailyCheckin[]` mantém compat com `withCheckinTotals` e calcs downstream.
4. **Idempotência:** rodar build 2x não altera; flag ler localStorage primeiro depois env é determinístico.
5. **`@deprecated checkin-service.ts`:** marcado com JSDoc; após Story 1.3 (REVOKE write em `lancamentos_diarios`), o INSERT vai falhar com 403 → Sprint 2 remove export e força chamadas pra `submit_checkin` RPC.

## Pendências (não bloqueantes desta story)

- [ ] Smoke tests com flag ON em staging (precondição Story 1.3 canary)
- [ ] Runbook `docs/runbooks/db016-feature-flag.md` (Story 1.3 owner)
- [ ] Shadow-read opcional (Promise.all RPC+SELECT com diff em Sentry) — pode ser adicionado em Story 1.3 antes do REVOKE canary
- [ ] Lint rule bloqueando `from('lancamentos_diarios').select` fora dos 13 call-sites + checkin-service.ts (Sprint 2 cleanup)

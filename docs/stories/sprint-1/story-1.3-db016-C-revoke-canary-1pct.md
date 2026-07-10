# Story 1.3 — DB-016 Fase C: REVOKE INSERT/UPDATE + Feature Flag 1%

**Status:** InReview (prep done — aguarda janela operacional 7 dias)

## File List (Implementação prep)
- `supabase/migrations/_archived/20260521130000_db016_revoke_lancamentos_diarios.sql` (SQL manual REVOKE idempotente)
- `supabase/migrations/_archived/20260521131000_db016_revoke_rollback.sql` (SQL manual de rollback)
- `scripts/db016-canary-controller.sh` (orquestrador canary stages 1→10→25→100)
- `docs/runbooks/sprint-1-story-1.3-1.4-db016-canary.md` (runbook 7 dias)

**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 1
**Prioridade:** P0
**Severidade do débito:** Crítica
**Débito relacionado:** DB-016 (Fase C — Canary Sequence)

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 1 critical-path: PASS (rollback 4 tiers com RTO específico + auto-rollback SLO breach 5min, bloqueada por 1.2 + 0.9 + Sprint 0, métricas observáveis SLO definidos error<0.5%/p95<1.2x/FP<0.1%, feature flag 1% sticky + kill-switch)
**Esforço estimado:** 12h
**Owner sugerido:** @data-engineer + @devops
**RACI:** R=@data-engineer+@devops, A=Tech Lead, C=@dev+@qa, I=stakeholders+CTO
**Created:** 2026-05-17

## Problem Statement
qa-review §4.1 Fase C: com RPCs publicadas (1.1) e FE migrado com flag-off (1.2), agora aplicamos `REVOKE INSERT, UPDATE ON lancamentos_diarios` para roles de aplicação **e** ativamos a flag em **1%** do tráfego. Esta é a primeira vez que o REVOKE entra em produção — janela de validação canary obrigatória.

## Business Value
Fecha o vetor de escrita direta em tabela crítica (rastreabilidade + auditoria via RPC). 1% canary contém blast radius para ≤50 usuários típicos enquanto valida em produção real.

## Acceptance Criteria
1. **AC1:** Given a migração de REVOKE pronta, When aplicada, Then `INSERT`/`UPDATE` direto em `lancamentos_diarios` por roles de app retorna 42501 (insufficient_privilege).
2. **AC2:** Given a flag `db016_rpc_enabled`, When configurada para 1% de tráfego (sticky por user_id), Then exatamente ~1% das sessões usa RPC (validar via Sentry breadcrumbs + correlation ID).
3. **AC3:** Given 1% rodando por 24h, When métricas são coletadas, Then error rate <0.5%, RPC latência p95 <1.2x baseline SELECT, false-positive 403 rate <0.1%.
4. **AC4:** Given rollback automático configurado, When error rate >0.5% por 5min consecutivos, Then flag volta automaticamente para 0% (kill-switch ativo).
5. **AC5:** Given a janela canary, When concluída, Then relatório de canary publicado em `docs/runbooks/db016-canary-fase-c.md` com go/no-go para Fase D.

## Scope IN
- Migração SQL `REVOKE INSERT, UPDATE ON lancamentos_diarios FROM <roles>`.
- Rollout de flag para 1% (sticky por user_id).
- Dashboards/alertas: error rate, RPC p95, false-positive 403 rate.
- Auto-rollback configurado (flag → 0% se SLO estourado por 5min).
- Janela de observação de 24h mínimo.
- Relatório canary fase C com decisão go/no-go.

## Scope OUT
- Rollout 10%/25%/100% (story 1.4 — Fase D).
- Remoção das colunas/SELECTs (Sprint 2).
- REVOKE de DELETE (fora de escopo DB-016).
- Refator de scripts/edge functions (cobrir se afetados — caso a caso).

## Tasks
- [ ] Migração SQL de REVOKE (reversível: GRANT pronto no rollback).
- [ ] Configurar flag rollout 1% sticky por user_id.
- [ ] Dashboards: error rate, RPC p95, 403 FP rate.
- [ ] Alertas Sentry: SLO breach → notify on-call + auto-flag-off.
- [ ] Configurar auto-rollback (script ou flag manager).
- [ ] Comunicar squad + stakeholders antes do REVOKE.
- [ ] Aplicar REVOKE; ativar flag 1%.
- [ ] Observar 24h; coletar métricas.
- [ ] Publicar `docs/runbooks/db016-canary-fase-c.md`.
- [ ] @qa gate go/no-go para Fase D.

## Dependências
- **Bloqueada por:** Story 1.2 (FE migrado flag-off), Sprint 0 done (especialmente 0.9 correlation ID, 0.5 RLS matrix, 0.6 smoke 403, 0.3 Sentry).
- **Bloqueia:** Story 1.4 (Fase D — rollout 10/25/100).

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Consumer não inventariado quebra | Crítica | Inventário story 0.8 + GRANT temporário a role de auditoria |
| Auto-rollback não dispara | Crítica | Teste em staging: simular erro e validar flag-off automático |
| 1% sticky enviesado (loja única) | Alta | Validar amostragem por loja/role no canary |
| Métricas insuficientes para go/no-go | Média | Critérios pré-definidos: error<0.5%, p95<1.2x, FP<0.1% |
| Squad não percebe alerta | Alta | Pager on-call + Slack + duplo destinatário |

## Testes Requeridos
- [ ] Staging: REVOKE aplicado; INSERT direto retorna 42501; RPC funciona normalmente.
- [ ] Staging: simular erro em RPC e validar auto-rollback de flag.
- [ ] Sticky por user_id: 100 sessions × 5 runs → mesma sessão sempre roteia para mesmo branch.
- [ ] Smoke tests (story 0.6) com flag 1% em staging por 1h sem regressão.
- [ ] False-positive 403 rate medível e <0.1% em staging.

## Definition of Done
- [ ] ACs verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] 24h de observação em produção sem SLO breach
- [ ] Relatório canary fase C publicado
- [ ] @qa gate PASS com verdict go/no-go para Fase D
- [ ] PR merged (@devops push)
- [ ] Stakeholders comunicados

## Rollback Plan
1. **Tier 1 — Auto-rollback (≤5min):** flag → 0% via alerta SLO breach.
2. **Tier 2 — Manual flag-off (≤2min):** comando único documentado no runbook.
3. **Tier 3 — Reverter REVOKE (≤10min):** `GRANT INSERT, UPDATE ON lancamentos_diarios TO <roles>` (migração reversa pré-escrita no PR).
4. **Tier 4 — Revert código:** `git revert` se bug no helper.
5. RTO total worst-case: <15min. Comunicação: Slack #incidents + on-call pager.
6. Pós-rollback: postmortem obrigatório antes de re-tentar Fase C.

## Notas Técnicas
- REVOKE não afeta SELECT (preservado para shadow-read e leitura de dashboards).
- Roles afetadas: `authenticated`, `service_role` (validar quais — depende do schema atual).
- Auto-rollback: webhook do alerta Sentry → endpoint que muda flag para 0%.
- Sticky bucketing: `hash(user_id) % 100 < 1`.

## Referências
- `docs/prd/technical-debt-assessment.md` §DB-016
- `docs/reviews/qa-review.md` §4.1 Fase C
- `docs/security/lancamentos-diarios-consumers.md` (story 0.8)
- Stories 1.1, 1.2 (pré-requisitos)

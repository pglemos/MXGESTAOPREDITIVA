# Story 1.1 — DB-016 Fase A: Publicar RPCs `get_lancamentos_for_*` (SECURITY DEFINER)

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 1
**Prioridade:** P0
**Severidade do débito:** Crítica
**Débito relacionado:** DB-016 (Fase A — Canary Sequence)

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 1 critical-path: PASS (rollback detalhado, sequencing bloqueada por 0.5/0.8/Sprint 0, métricas observáveis presentes)
- 2026-05-18 | @aiox-master (Orion) | Status: Ready → InReview | Migration `20260518110000_rpcs_get_lancamentos.sql` criada com 5 RPCs SECURITY DEFINER (`get_lancamentos_por_loja_periodo`, `_por_vendedor_periodo`, `_por_dia`, `_rede_periodo`, `_referencia_dia`) + helper `pode_ler_lancamentos_loja()` + wrap SQLERRM via `log_rpc_error()` (Story 1.5)

## File List (Story 1.1)
- `supabase/migrations/20260518110000_rpcs_get_lancamentos.sql` (new)
**Esforço estimado:** 16h
**Owner sugerido:** @data-engineer
**RACI:** R=@data-engineer, A=Tech Lead, C=@architect+@dev, I=stakeholders
**Created:** 2026-05-17

## Problem Statement
qa-review §4.1 mandata canary em 4 fases para DB-016 (revoke INSERT/UPDATE em `lancamentos_diarios`). Fase A é criar as RPCs `get_lancamentos_for_*` (SECURITY DEFINER) que preservam **exata** a semântica de SELECT atual antes de qualquer migração de consumer. Sem RPCs publicadas e testadas, fases B/C/D não podem rodar.

## Business Value
Estabelece a fundação para o deploy mais arriscado do roadmap. RPCs versionadas + assinatura estável protegem o frontend de mudanças no schema físico e habilitam observabilidade granular por role/operação.

## Acceptance Criteria
1. **AC1:** Given o inventário (story 0.8), When as RPCs são publicadas, Then existem `get_lancamentos_for_admin`, `get_lancamentos_for_gestor`, `get_lancamentos_for_vendedor` (mínimo) com SECURITY DEFINER e `search_path` fixo.
2. **AC2:** Given uma RPC nova, When executada por role autorizada com mesmo filtro do SELECT original, Then o resultado é **byte-identical** ao SELECT direto (validado por diff em ≥10 cenários).
3. **AC3:** Given role não autorizada, When tenta executar RPC, Then resposta 403 sem vazar metadados (usar pattern DB-002 — story 1.5).
4. **AC4:** Given as RPCs publicadas, When `pg_proc` é consultado, Then todas têm `GRANT EXECUTE` apenas para roles esperadas (sem `PUBLIC`).
5. **AC5:** Given métricas, When uma RPC é executada, Then latência p95 ≤ 1.2x do SELECT original em carga representativa.

## Scope IN
- Migração SQL com `CREATE OR REPLACE FUNCTION ... SECURITY DEFINER`.
- `GRANT EXECUTE` granular por role.
- Testes pgTAP de equivalência (≥10 cenários: filtros por loja, vendedor, período, status).
- Benchmark de latência (RPC vs SELECT direto).
- Atualização do RLS regression matrix (story 0.5) com as novas RPCs.
- Documentação em `docs/architecture/rpcs-lancamentos.md`.

## Scope OUT
- Migração dos 27 SELECTs cliente (Fase B — story 1.2).
- REVOKE em `lancamentos_diarios` (Fase C — story 1.3).
- Rollout canary (Fase D — story 1.4).
- RPCs para outras tabelas.

## Tasks
- [ ] Desenhar assinaturas a partir do inventário story 0.8.
- [ ] Implementar migração SQL com `SECURITY DEFINER` + `search_path = ''`.
- [ ] Aplicar pattern wrap-sqlerrm (story 1.5) em todas.
- [ ] Escrever testes pgTAP de equivalência (≥10 cenários).
- [ ] Benchmark p95 (RPC vs SELECT) sob carga representativa.
- [ ] GRANT EXECUTE por role; verificar ausência de PUBLIC.
- [ ] Atualizar `docs/architecture/rpcs-lancamentos.md`.
- [ ] Atualizar story 0.5 (RLS matrix) com as RPCs.
- [ ] CodeRabbit pré-PR; @qa gate.

## Dependências
- **Bloqueada por:** Story 0.8 (inventário), Story 0.5 (RLS matrix), Sprint 0 done.
- **Bloqueia:** Story 1.2 (Fase B), 1.3 (Fase C), 1.4 (Fase D).

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Semântica divergente (RPC ≠ SELECT) | Crítica | Diff byte-identical em ≥10 cenários; PR bloqueia se falhar |
| Latência degradada >20% | Alta | Benchmark obrigatório; rollback se p95 estourar |
| SECURITY DEFINER + search_path mutável | Crítica | `search_path = ''` fixo; CodeRabbit rule |
| GRANT muito permissivo | Alta | Verificação automatizada de ausência de PUBLIC |

## Testes Requeridos
- [ ] pgTAP ≥10 cenários de equivalência (admin, gestor, vendedor × filtros)
- [ ] Bench: p95 RPC ≤ 1.2x p95 SELECT
- [ ] Verificação `pg_proc` ausência de PUBLIC
- [ ] Teste de 403 para role não autorizada (sem vazamento)
- [ ] Smoke test integrado (story 0.6) cobrindo as RPCs

## Definition of Done
- [ ] ACs verdes; pgTAP passa
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Benchmark documentado no PR
- [ ] `docs/architecture/rpcs-lancamentos.md` publicado
- [ ] RLS matrix atualizada
- [ ] @qa gate PASS
- [ ] PR merged (@devops push)

## Rollback Plan
1. RPCs são aditivas — não quebram consumers existentes (Fase B ainda não migrou).
2. `DROP FUNCTION` se necessário (migração reversa preparada no PR).
3. RTO: <5min. Sem dependência de redeploy do FE.
4. Comunicar squad antes do drop (mesmo sendo seguro).

## Notas Técnicas
- Padrão: `CREATE OR REPLACE FUNCTION ... LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$ ... $$;`
- Logging interno (DB-002 pattern): registrar SQLSTATE + SQLERRM em tabela de auditoria, retornar trace_id genérico ao cliente.
- Correlation ID (story 0.9): propagar via `current_setting('app.correlation_id', true)`.

## Referências
- `docs/prd/technical-debt-assessment.md` §DB-016
- `docs/reviews/qa-review.md` §4.1 canary sequence
- `docs/reviews/db-specialist-review.md` (pattern SECURITY DEFINER)
- `docs/security/lancamentos-diarios-consumers.md` (story 0.8 output)

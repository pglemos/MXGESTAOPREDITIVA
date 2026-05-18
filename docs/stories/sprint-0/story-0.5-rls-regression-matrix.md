# Story 0.5 — RLS Regression Matrix Baseline (8×5 = 40 cenários)

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 0
**Prioridade:** P0
**Severidade do débito:** Crítica (rede de proteção mandatória)
**Débito relacionado:** T-01 (qa-review §6) / DB-016 / DB-019 / DB-013
**Esforço estimado:** 12h
**Owner sugerido:** @qa + @dev
**RACI:** R=@qa+@dev, A=Tech Lead, C=@data-engineer, I=squad
**Created:** 2026-05-17

## Problem Statement
T-01 do qa-review §6 estabelece como condição não-negociável: matriz de regressão RLS com **8 tabelas críticas × 5 roles = 40 cenários**, cobrindo SELECT+INSERT+UPDATE+DELETE = 160 assertions mínimas. Sem este baseline em `main`, qualquer P0 de Sprint 1 (DB-016/DB-019/DB-013) é deploy às cegas e dispara X-2/X-5 sem rede.

## Business Value
Detecta automaticamente regressões de RLS antes do merge — protege a receita inteira da plataforma contra DB-016 (fraude de check-ins) e variantes. ROI direto sobre os R$51M de exposição.

## Acceptance Criteria
1. **AC1:** Given a suite de regressão RLS, When `npm run test:rls` (ou equivalente) é executado, Then todos os 160 asserts passam em <5min em `main`.
2. **AC2:** Given uma migração que afrouxa indevidamente RLS em qualquer das 8 tabelas, When o PR é aberto, Then ao menos 1 cenário da suite falha vermelho com mensagem clara da role e operação que regrediu.
3. **AC3:** Given fixture factories e seed data reproduzível, When a suite roda em CI ou local, Then o resultado é determinístico (≥3 execuções consecutivas com mesmo resultado).

## Scope IN
- 8 tabelas críticas: `lancamentos_diarios`, `role_assignments_audit`, `store_meta_rules_history`, `usuarios`, `vendedores_loja`, `migration_backup_*`, `logs_auditoria`, `feature_flags` (placeholder se ainda não existe).
- 5 roles: `admin`, `dono`, `gerente`, `vendedor`, `anon`.
- Framework: pytest+supabase-py OU Deno test (decisão @qa em task 1).
- Fixture factories + seed reproduzível (mitiga GAP-05).
- Cenário negativo destacado para DB-016 (POST direto → 403 esperado APÓS o fix de Sprint 1; antes do fix, o cenário fica `xfail` documentado).
- Integração em CI como required check.

## Scope OUT
- Testes de RPC além de RLS direta (cobre Story 0.6 smoke).
- Mutation testing (backlog P3).
- Cobertura de tabelas não-críticas (Sprint 2).
- Coverage report bonito → backlog.

## Tasks
- [ ] @qa decide framework (pytest vs Deno) com ADR curto em `docs/adr/0001-rls-test-framework.md`.
- [ ] Criar fixture factories para usuarios+roles+lojas+vendedores.
- [ ] Implementar seed reproduzível (`tests/rls/seed.sql` ou factory).
- [ ] Implementar 40 cenários (8 tabelas × 5 roles) com 4 ops cada.
- [ ] Marcar cenário DB-016 `xfail` com referência à story Sprint 1 que vai removê-lo.
- [ ] Garantir <5min runtime; otimizar paralelismo se necessário.
- [ ] Integrar em workflow CI `rls-regression.yml`.
- [ ] Adicionar como required check em branch protection (coordenar Story 0.4).
- [ ] Documentar runbook em `docs/qa/rls-regression-guide.md`.

## Dependências
- **Bloqueada por:** Story 0.1 (types ajudam mas não bloqueiam), Story 0.2 (env válido p/ Supabase test instance).
- **Bloqueia:** todas P0 de Sprint 1 (DB-016/DB-019/DB-013) — gate de deploy.

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Flakiness por fixture instável (GAP-05) | Alta | Factory determinística + tear-down explícito + 3 runs consecutivos em CI |
| Tabela `feature_flags` não existe ainda | Média | Cenário com `xfail` + criar tabela em Sprint 1 |
| Runtime >5min trava CI | Média | Paralelizar por tabela; cache de seed |
| Service-role usado por engano em teste | Crítica | Cliente de teste validado por matcher; CI falha se `service_role` detectado |

## Testes Requeridos
- [ ] Suite verde em `main` (160 asserts).
- [ ] Suite roda 3× consecutivas com mesmo resultado.
- [ ] PR sintético que afrouxa RLS em `lancamentos_diarios` → vermelho com mensagem clara.
- [ ] Cenário `xfail` DB-016 documentado e linkado.
- [ ] Runtime <5min em CI.

## Definition of Done
- [ ] ACs verdes
- [ ] Testes passando + determinismo validado
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] ADR `0001-rls-test-framework.md` publicado
- [ ] `docs/qa/rls-regression-guide.md` publicado
- [ ] CI required check ativo (após Story 0.4 DONE)
- [ ] PR merged
- [ ] @qa gate PASS

## Rollback Plan
1. Remover required check em branch protection (mantém workflow rodando como advisory).
2. Marcar cenários flaky como `xfail` com TODO referenciando débito follow-up.
3. RTO: <10min.
4. Workflow permanece — só perde poder de bloqueio enquanto estabiliza.

## Referências
- `docs/prd/technical-debt-assessment.md` §1 Sprint 0 item 0.4
- `docs/reviews/qa-review.md` §6 T-01, §2 GAP-05

## File List
- `supabase/tests/rls-matrix/setup.sql` (novo)
- `supabase/tests/rls-matrix/_helpers.sql` (novo)
- `supabase/tests/rls-matrix/lancamentos_diarios.test.sql` (novo)
- `supabase/tests/rls-matrix/usuarios.test.sql` (novo)
- `supabase/tests/rls-matrix/vendedores_loja.test.sql` (novo)
- `supabase/tests/rls-matrix/vinculos_loja.test.sql` (novo)
- `supabase/tests/rls-matrix/lojas.test.sql` (novo)
- `supabase/tests/rls-matrix/metas.test.sql` (novo)
- `supabase/tests/rls-matrix/logs_auditoria.test.sql` (novo)
- `supabase/tests/rls-matrix/role_assignments_audit.test.sql` (novo)
- `supabase/tests/rls-matrix/feature_flags.test.sql` (novo)
- `supabase/tests/rls-matrix/runner.sql` (novo)
- `scripts/run_rls_matrix.sh` (novo, executável)
- `.github/workflows/rls-matrix.yml` (novo)
- `docs/dev/rls-matrix.md` (novo, runbook)

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10)
- 2026-05-18 | @aiox-master (Orion) | Status: Ready → InReview | Suite pgTAP criada com 8 tabelas × 5 roles. Setup baseado em fixtures isolados em BEGIN; ROLLBACK;. CI workflow ativo. Runbook publicado.

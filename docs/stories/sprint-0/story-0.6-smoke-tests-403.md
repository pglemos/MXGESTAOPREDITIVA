# Story 0.6 — Smoke Tests "POST Direto → 403"

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 0
**Prioridade:** P0
**Severidade do débito:** Alta
**Débito relacionado:** T-03 (qa-review §6) / DB-016 / DB-019
**Esforço estimado:** 4h
**Owner sugerido:** @qa

## File List
- `scripts/smoke_403_postgrest.mjs` (Node fetch nativo, 6 alvos)
- `.github/workflows/smoke-403.yml` (PR + schedule diário + workflow_dispatch)

## Change Log (Implementação)
- 2026-05-18 | @aiox-master (Orion) | Status: Ready → InReview | Script Node + CI workflow. Pendente: configurar secrets SUPABASE_STAGING_URL/ANON_KEY/TEST_JWT no GitHub Actions.
**RACI:** R=@qa, A=Tech Lead, C=@dev, I=@data-engineer
**Created:** 2026-05-17

## Problem Statement
T-03 do qa-review §6: smoke test rápido (~4h) garantindo que tentativas de `POST` direto via PostgREST contra tabelas sensíveis retornem **403** após o fix de DB-016/DB-019. Sem isso, regressões de RLS passam despercebidas mesmo com a suite completa (Story 0.5) se a integração PostgREST não for testada via HTTP real.

## Business Value
Camada complementar à matriz RLS — valida via HTTP (ponto de entrada real do atacante) que o vetor confirmado de DB-016 está bloqueado. Custo baixo (4h), proteção alta.

## Acceptance Criteria
1. **AC1:** Given um JWT de role `authenticated` (não-admin), When um POST direto é enviado para `/rest/v1/lancamentos_diarios`, Then a resposta é HTTP 403 com mensagem RLS clara (após DB-016 fix de Sprint 1; antes do fix, asserção é `xfail`).
2. **AC2:** Given a mesma role, When POSTs são feitos contra `role_assignments_audit`, `store_meta_rules_history`, `usuarios`, `vendedores_loja`, `migration_backup_*`, Then todas retornam 403.
3. **AC3:** Given a suite roda em CI no workflow `smoke-403.yml`, When ela é executada, Then runtime <60s e resultado é determinístico.

## Scope IN
- Script Deno test (preferido pelo qa-review) OU curl+bash chamando PostgREST de staging/CI Supabase test instance.
- 6 tabelas alvo, 1 POST cada (6 cenários mínimos).
- Cenários `xfail` enquanto fix DB-016 não está em Sprint 1.
- Workflow CI `smoke-403.yml`.

## Scope OUT
- UPDATE/DELETE direto (coberto por Story 0.5 RLS matrix).
- Tabelas não-críticas (Sprint 2).
- Bypass com service-role (proibido em teste — validado por matcher).

## Tasks
- [ ] Gerar JWT de teste para role `authenticated` (helper compartilhado com Story 0.5).
- [ ] Implementar 6 testes POST direto (Deno test).
- [ ] Marcar como `xfail` cenário DB-016 com link para story Sprint 1.
- [ ] Workflow `smoke-403.yml` rodando em `pull_request` e `main`.
- [ ] Validar runtime <60s.
- [ ] Documentar em `docs/qa/rls-regression-guide.md` (sessão "Smoke 403").

## Dependências
- **Bloqueada por:** Story 0.5 (compartilha fixture e helper de JWT).
- **Bloqueia:** deploy de DB-016 (Sprint 1) — após o fix, todos os `xfail` viram `pass`.

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Endpoint PostgREST diferente entre envs | Média | Variável `SUPABASE_URL` por env; doc em runbook |
| JWT helper duplica esforço de Story 0.5 | Baixa | Compartilhar via `tests/_shared/jwt.ts` |
| Falso-negativo se RLS retornar 200 vazio em vez de 403 | Alta | Asserção dupla: status code E `error.code === '42501'` ou equivalente |

## Testes Requeridos
- [ ] 6 cenários verdes (com `xfail` em DB-016 enquanto fix pendente).
- [ ] PR sintético que desabilita RLS em uma tabela → vermelho.
- [ ] Runtime <60s em CI.
- [ ] Após fix DB-016 (Sprint 1), remover `xfail` e cenário fica verde.

## Definition of Done
- [ ] ACs verdes
- [ ] Testes passando
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Workflow `smoke-403.yml` ativo em CI
- [ ] Doc atualizado em `docs/qa/rls-regression-guide.md`
- [ ] PR merged
- [ ] @qa gate PASS

## Rollback Plan
1. Desabilitar workflow `smoke-403.yml` via `gh workflow disable`.
2. Suite RLS (Story 0.5) continua cobrindo a maioria dos cenários.
3. RTO: <5min.

## Referências
- `docs/prd/technical-debt-assessment.md` §1 Sprint 0 item 0.5 (ref T-03)
- `docs/reviews/qa-review.md` §6 T-03

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10)

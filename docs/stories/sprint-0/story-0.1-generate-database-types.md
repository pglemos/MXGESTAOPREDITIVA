# Story 0.1 — Generate Database Types (Supabase CLI + CI Diff Gate)

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 0
**Prioridade:** P0
**Severidade do débito:** Alta (desbloqueio crítico)
**Débito relacionado:** DB-014 (ausência de types gerados) / UX-004 / X-1 (drift PT-BR↔EN)
**Esforço estimado:** 4h
**Owner sugerido:** @devops + @dev
**RACI:** R=@devops+@dev, A=Tech Lead, C=@data-engineer, I=squad FE
**Created:** 2026-05-17

## Problem Statement
O assessment FINAL §DB-014 confirma a ausência de `database.generated.ts` produzido por Supabase CLI. Hoje o frontend tipa Supabase com casts manuais ou `any`, criando drift PT-BR↔EN (risco X-1, blast radius 58 arquivos) e impedindo refactors seguros nas god-hooks/pages alvo de Sprint 1/2. Sem types autogerados confiáveis, qualquer mudança de schema reflete em produção como erro de runtime.

## Business Value
Destrava 58 arquivos para refactors futuros, elimina classe inteira de bugs por drift de schema, e habilita CI a bloquear PRs que alterem schema sem regenerar types — proteção primária contra X-1 que sustenta toda Sprint 1.

## Acceptance Criteria
1. **AC1:** Given um schema alterado em migração Supabase, When o PR é aberto, Then a pipeline executa `supabase gen types typescript --linked` e compara com `src/types/database.generated.ts`; se houver diff não commitado, o check falha bloqueando merge.
2. **AC2:** Given `src/types/database.generated.ts` existe e está versionado, When `npm run typecheck` roda, Then nenhum erro novo de tipo aparece (baseline preservado).
3. **AC3:** Given documentação em `docs/dev/database-types-workflow.md`, When um dev altera schema localmente, Then o passo "rodar `npm run gen:db-types` e commitar" está descrito com comando exato.

## Scope IN
- Adicionar script `gen:db-types` em `package.json`.
- Gerar e commitar `src/types/database.generated.ts` inicial.
- Workflow GitHub Actions `.github/workflows/db-types-diff.yml` com job de diff gate.
- Documentação `docs/dev/database-types-workflow.md`.

## Scope OUT
- Refactor de consumidores para usar os types novos (Sprint 1/2).
- Migração de `any` casts existentes (Sprint 2 UX-001/002).
- Integração com schema dump multi-schema (Sprint 1 prep).

## Tasks
- [x] Configurar Supabase CLI linked no projeto. (já linkado: fbhcmzzgwjdgkctlfvbo)
- [x] Rodar primeira geração e commitar baseline. (`src/types/database.generated.ts`, 6180 LOC)
- [x] Adicionar script `gen:db-types` e `verify:db-types` em `package.json`.
- [x] Criar workflow CI `db-types-diff.yml` com `actions/checkout` + `supabase/setup-cli` + diff check.
- [ ] Validar gate falhando em PR sintético com schema alterado sem regen. (aguarda secrets configurados no GitHub)
- [x] Escrever `docs/dev/database-types-workflow.md`.
- [x] EXTRA: ADR-0041 documentando plano de migração faseada dos 58 consumers.

## Dependências
- **Bloqueada por:** Story 0.2 (secrets Supabase válidos para CLI linked).
- **Bloqueia:** Story 0.5 (RLS suite usa types), Sprint 1 (DB-016, refactors FE).

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| CLI exige `SUPABASE_ACCESS_TOKEN` em CI | Alta | Configurar como repo secret antes do merge |
| Drift inicial massivo no baseline | Média | Aceitar baseline atual, abrir débito follow-up para drift residual |
| Build CI lento por download CLI | Baixa | Cache via `actions/cache` |

## Testes Requeridos
- [ ] PR sintético alterando schema sem regen → CI falha vermelho.
- [ ] PR alterando schema COM regen → CI passa verde.
- [ ] `npm run typecheck` continua verde após commit do baseline.
- [ ] Workflow documentado executado por um dev externo ao trio (validação de clareza).

## Definition of Done
- [ ] ACs verdes
- [ ] Testes passando
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Docs atualizadas (`docs/dev/database-types-workflow.md`)
- [ ] PR merged em `main`
- [ ] @qa gate PASS

## Rollback Plan
1. Desabilitar workflow `.github/workflows/db-types-diff.yml` via `gh workflow disable`.
2. Manter `database.generated.ts` no repo (não-destrutivo); reverter consumers se algum começou a usar.
3. RTO esperado: <10min.

## Referências
- `docs/prd/technical-debt-assessment.md` §DB-014, §1 Sprint 0 item 0.3
- `docs/reviews/qa-review.md` §1 item 0.3, §X-1

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10)
- 2026-05-17 | @dev (Dex) | Status: Ready → InReview | Baseline gerado, CI gate criado, ADR-0041 publicada. Pendente: configurar secrets SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_ID no GitHub para validação PR sintético.

## File List
- ADDED: `src/types/database.generated.ts` (6175 LOC, autogerado)
- ADDED: `scripts/gen_db_types.mjs` (helper para limpar banner/rodape da CLI)
- MODIFIED: `package.json` (+ scripts `gen:db-types`, `verify:db-types`)
- ADDED: `.github/workflows/db-types-diff.yml`
- ADDED: `docs/dev/database-types-workflow.md`
- ADDED: `docs/adr/0041-database-types-migration.md`

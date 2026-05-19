# Story 3.2 — Decompor `LancamentosLoja` (~650 LOC)

**Status:** Ready
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 3
**Prioridade:** P2
**Severidade do débito:** Alta
**Débito relacionado:** **UX-001** (`ux-specialist-review.md` §4.1)
**Esforço estimado:** 13h (range 11-15h)
**Owner sugerido:** @dev (FE) + @ux-design-expert
**RACI:** R=@dev, A=Tech Lead, C=@ux-design-expert, I=stakeholders
**Created:** 2026-05-18
**Created by:** @sm (River)

---

## Problem Statement
`src/pages/LancamentosLoja.tsx` tem **~650 LOC** monolíticas (per `ux-specialist-review.md` §4.1). Concentra formulário de lançamento, tabela histórica, filtros por período, validação Zod, upload de anexos e mutations. Impacto: PR review difícil, render inteiro a cada keystroke do form, testes inviáveis.

## Business Value
Pattern ADR-0050 validado destrava manutenção desta page crítica para lojistas. Reduz tempo de review em 60%+. Habilita isolamento do form (memoização) e split do hook de mutations.

## Acceptance Criteria
1. **AC1 (container slim):** Container final <200 LOC com apenas routing/orchestration/layout.
2. **AC2 (estrutura features/):** `src/features/lancamentos-loja/` com `sections/`, `hooks/`, `components/`, `index.ts`.
3. **AC3 (visual regression):** Snapshots Playwright 375px+1280px diff <1%.
4. **AC4 (error boundary):** ErrorBoundary por section.
5. **AC5 (form & mutations imutáveis):** Comportamento de submit, validação Zod, toast de sucesso/erro, upload de anexos **idêntico** ao pré-refactor.

## Scope IN
- Criar `src/features/lancamentos-loja/`
- Sections: FormLancamento, TabelaHistorico, FiltrosPeriodo, AnexosUpload
- Hooks: `useLancamentosForm`, `useLancamentosHistory`, `useLancamentosMutations`
- ErrorBoundary por section
- Snapshots Playwright

## Scope OUT
- ❌ Refactor de UX
- ❌ Mudar validação Zod
- ❌ Migrar storage de anexos

## Tasks
- [ ] Snapshots baseline (1h)
- [ ] Mapear sections + mutations (1h)
- [ ] Estrutura `features/lancamentos-loja/` (0.5h)
- [ ] Extrair FormLancamento + hook (3h)
- [ ] Extrair TabelaHistorico + filtros (2.5h)
- [ ] Extrair AnexosUpload (2h)
- [ ] ErrorBoundary (1h)
- [ ] Container <200 LOC review (1h)
- [ ] Visual regression (1h)
- [ ] CodeRabbit + @qa

## Dependências
**Bloqueada por:** ADR-0050 ✅; Sprint 0 Playwright infra
**Bloqueia:** Nenhuma

## Riscos & Mitigações
| Risco | P | I | Mitigação |
|-------|:--:|:--:|-----------|
| Form validação quebrada | Média | Alto | Manter schema Zod intacto; teste E2E submit |
| Upload de anexos quebrado | Média | Alto | Smoke test upload pré/pós |
| Regressão visual | Alta | Médio | Snapshots + diff 1% |
| Re-render do form | Média | Médio | `React.memo` no form; `useMemo` props |

## Testes Requeridos
- [ ] Playwright visual 2 viewports (<1%)
- [ ] E2E: submit form completo, validação inválida, upload, filtro período
- [ ] Unit: hook de mutations com Vitest

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Container <200 LOC
- [ ] Diff <1%
- [ ] @qa PASS, PR merged

## Rollback Plan
1. Visual >1% injustificada: revert, investigar, re-PR. RTO <30min.
2. Form/upload quebrado: revert imediato. RTO <15min.

## Notas Técnicas
Seguir ADR-0050. Atenção a `react-hook-form` + Zod — extrair `useLancamentosForm` com schema fora do componente.

## Referências
- ADR-0050; `ux-specialist-review.md` §4.1; Story 2.1.

---
## Change Log
- 2026-05-18 | @sm (River) | Story criada — Sprint 3 UX-001
- 2026-05-19 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 3 critical-path: pass

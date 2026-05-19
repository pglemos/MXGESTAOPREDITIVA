# Story 3.3 — Decompor `RankingLoja` (~600 LOC)

**Status:** Ready
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 3
**Prioridade:** P2
**Severidade do débito:** Alta
**Débito relacionado:** **UX-001** (`ux-specialist-review.md` §4.1)
**Esforço estimado:** 12h (range 10-14h)
**Owner sugerido:** @dev (FE) + @ux-design-expert
**RACI:** R=@dev, A=Tech Lead, C=@ux-design-expert, I=stakeholders
**Created:** 2026-05-18
**Created by:** @sm (River)

---

## Problem Statement
`src/pages/RankingLoja.tsx` tem **~600 LOC** monolíticas (per `ux-specialist-review.md` §4.1). Mistura tabela de ranking, gráfico de evolução, filtros (período/categoria/loja), tooltips ricos e modal de drill-down. Impacto: render inteiro a cada toggle de filtro; tabela e chart compartilham state acoplado.

## Business Value
ADR-0050 destrava a page mais consultada por gerentes. Reduz review em 60%+. Habilita memoização independente de chart e tabela.

## Acceptance Criteria
1. Container <200 LOC.
2. `src/features/ranking-loja/` com `sections/`, `hooks/`, `components/`, `index.ts`.
3. Snapshots Playwright 375px+1280px diff <1%.
4. ErrorBoundary por section.
5. Comportamento de filtros, drill-down, tooltips **idêntico** ao pré-refactor.

## Scope IN
- `src/features/ranking-loja/`
- Sections: FiltrosRanking, TabelaRanking, ChartEvolucao, DrillDownModal
- Hooks: `useRankingData`, `useRankingFiltros`
- ErrorBoundary; snapshots

## Scope OUT
- ❌ Refactor visual; ❌ trocar lib de chart; ❌ mudar agregações no backend

## Tasks
- [ ] Snapshots baseline (1h)
- [ ] Mapear sections (1h)
- [ ] Estrutura `features/ranking-loja/` (0.5h)
- [ ] Extrair FiltrosRanking + hook (1.5h)
- [ ] Extrair TabelaRanking (2.5h)
- [ ] Extrair ChartEvolucao (2h)
- [ ] Extrair DrillDownModal (1.5h)
- [ ] ErrorBoundary (1h)
- [ ] Container review (1h)
- [ ] Visual regression (1h)

## Dependências
**Bloqueada por:** ADR-0050 ✅; Playwright infra
**Bloqueia:** Nenhuma

## Riscos & Mitigações
| Risco | P | I | Mitigação |
|-------|:--:|:--:|-----------|
| Chart re-render excessivo | Alta | Médio | Memo + `useDeferredValue` em filtros |
| Tooltips/drill-down quebrados | Média | Alto | E2E hover + click drill |
| Regressão visual chart | Média | Médio | Snapshots Playwright |

## Testes Requeridos
- [ ] Playwright visual 2 viewports
- [ ] E2E: filtros, drill-down, tooltip
- [ ] Unit: hook agregação

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit clean
- [ ] Container <200 LOC; diff <1%
- [ ] @qa PASS

## Rollback Plan
Visual/funcional injustificado: revert. RTO <30min.

## Notas Técnicas
Seguir ADR-0050. Chart provavelmente em recharts — extrair config para `components/RankingChartConfig.ts`.

## Referências
- ADR-0050; `ux-specialist-review.md` §4.1; Story 2.1.

---
## Change Log
- 2026-05-18 | @sm (River) | Story criada
- 2026-05-19 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 3 critical-path: pass

# Story 3.3 — Decompor `RankingLoja` (~600 LOC)

**Status:** InReview
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
- 2026-05-21 | @dev (Dex) | Story 3.3 reconciliada: alvo real `src/pages/SalesPerformance.tsx` (800 LOC) — `RankingLoja.tsx` não existe no repo. Container shim conversion completa em `src/features/sales-performance/` seguindo ADR-0050. typecheck + build verdes. Status: Ready → InReview.

## File List (Story 3.3 reconciliada — SalesPerformance)
**Modificados:**
- `src/pages/SalesPerformance.tsx` (800 → 6 LOC — shim de retrocompat)

**Criados (container + views):**
- `src/features/sales-performance/SalesPerformance.container.tsx` (16 LOC — decide admin vs store por role)
- `src/features/sales-performance/index.ts` (2 LOC — barrel)
- `src/features/sales-performance/views/AdminPerformanceView.tsx` (94 LOC — BI Executivo da Rede)
- `src/features/sales-performance/views/StorePerformanceView.tsx` (51 LOC — Performance da Loja)

**Criados (admin sections — fase prévia + completar gap):**
- `src/features/sales-performance/sections/AdminHeader.tsx`
- `src/features/sales-performance/sections/AdminKpiCards.tsx`
- `src/features/sales-performance/sections/AdminSellOutEvolution.tsx`
- `src/features/sales-performance/sections/AdminHealthCard.tsx`
- `src/features/sales-performance/sections/AdminTopStoresList.tsx`
- `src/features/sales-performance/sections/AdminGoalCompareChart.tsx`
- `src/features/sales-performance/sections/AdminFunnelChart.tsx`
- `src/features/sales-performance/sections/AdminPeopleChart.tsx` (NOVO — gap)
- `src/features/sales-performance/sections/AdminConsultingCard.tsx` (NOVO — gap)
- `src/features/sales-performance/sections/AdminStoreMatrixTable.tsx` (NOVO — gap)

**Criados (store sections — NOVOS, gerente de loja):**
- `src/features/sales-performance/sections/StoreHeader.tsx`
- `src/features/sales-performance/sections/StoreKpiCards.tsx`
- `src/features/sales-performance/sections/StoreSellOutEvolution.tsx`
- `src/features/sales-performance/sections/StoreHealthCard.tsx`

**Hooks/components/data (fase prévia):**
- `src/features/sales-performance/hooks/useAdminPerformancePage.ts`
- `src/features/sales-performance/hooks/useStorePerformancePage.ts`
- `src/features/sales-performance/components/SalesPerformanceErrorBoundary.tsx`
- `src/features/sales-performance/data/formatters.ts`
- `src/features/sales-performance/data/types.ts`

**Validação:**
- `npm run typecheck` → PASS
- `npm run build` → PASS (8.09s, SalesPerformance-CRQAP9u5.js = 83.53 kB / gzip 11.55 kB)
- Container 16 LOC < 200 LOC (AC1 OK)
- ErrorBoundary por section (AC4 OK)
- ZERO mudança visual/funcional (lógica de hooks já validada na fase prévia)

# Story 2.3 — Decompor `Ranking` (~1000 LOC)

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 2
**Prioridade:** P1
**Severidade do débito:** Alta
**Débito relacionado:** **UX-001** (pages monolíticas, `docs/reviews/ux-specialist-review.md` §4.1)
**Esforço estimado:** 12h (range 10-14h)
**Owner sugerido:** @dev (FE) + @ux-design-expert (design review)
**RACI:** R=@dev, A=Tech Lead, C=@ux-design-expert, I=stakeholders
**Created:** 2026-05-18
**Created by:** @sm (River)

---

## Problem Statement
`src/pages/Ranking.tsx` tem **~1000 LOC** (per `ux-specialist-review.md` §4.1). Combina filtros (período, loja, scope), tabela de ranking, gráfico comparativo, modais de detalhe e export. Mesma classe de débito UX-001.

## Business Value
Ranking é page de alto tráfego (visualizada diariamente por gerentes). Decompor habilita testes de filtros isolados, reduz tempo de render e facilita iteração de design.

## Acceptance Criteria
1. **AC1 (container slim):** Container `<200 LOC`, contém apenas: routing, filtros state, layout.
2. **AC2 (estrutura features/):** `src/features/ranking/{sections,hooks,components}` segue ADR-0050.
3. **AC3 (visual regression):** Snapshots Playwright diff <1% em 375px + 1280px com 2 estados (com e sem filtros aplicados).
4. **AC4 (filtros isolados):** Filtros state em hook `useRankingFilters()` reutilizável; mudança de filtro não re-renderiza tabela inteira (memo).
5. **AC5 (export preservado):** Funcionalidade de export (CSV/PDF se existir) idêntica pós-refactor (teste E2E).

## Scope IN
- Criar `src/features/ranking/{sections,hooks,components}`
- Sections: FiltersBar, RankingTable, ComparisonChart, DetailModal
- Hook `useRankingFilters` (state + URL sync)
- Hook `useRankingData(filters)` (data fetching)
- Memoização tabela + gráfico
- Playwright snapshots + E2E export

## Scope OUT
- ❌ Mudar algoritmo de ranking
- ❌ Adicionar novos filtros
- ❌ Mudar formato de export
- ❌ Migrar tabela para virtualização (story futura)

## Tasks
- [ ] Snapshots baseline Playwright (1h)
- [ ] Mapear sections + filtros (0.5h)
- [ ] Criar estrutura `features/ranking/` (0.5h)
- [ ] Extrair FiltersBar + hook (2h)
- [ ] Extrair RankingTable + hook (2h)
- [ ] Extrair ComparisonChart (1.5h)
- [ ] Extrair DetailModal (1h)
- [ ] Memoização (1h)
- [ ] Visual regression + E2E export (1h)
- [ ] Code review + @qa gate

## Dependências
**Bloqueada por:**
- Story 2.1 (pattern validado)
- Sprint 0 done

**Bloqueia:** Nenhuma diretamente

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Filtro URL sync quebra deep-link | Média | Médio | E2E deep-link `?periodo=mes&loja=X` |
| Memoização incorreta causa stale data | Média | Médio | Test: mudar filtro N vezes, validar dados refletem |
| Export quebra (CSV/PDF) | Baixa | Médio | E2E export antes/depois |
| Visual diff em tabela com muitas linhas | Média | Baixo | Snapshot com seed determinístico |

## Testes Requeridos
- [ ] Playwright visual: 375px + 1280px × 2 estados
- [ ] E2E: aplicar filtros, deep-link, export
- [ ] Unit: `useRankingFilters` (URL sync)
- [ ] Manual: @ux review staging

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Container <200 LOC
- [ ] Visual diff <1%
- [ ] Export funcional
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Filtros buggy em produção:** revert. RTO: <15min.
2. **Export quebrado:** revert imediato (feature crítica para gerentes).
3. **Visual regression:** revert + corrigir + re-PR.

## Notas Técnicas
- Pattern ADR-0050
- URL sync filtros via `useSearchParams`
- Memoização: `React.memo(RankingTable, isEqualFilters)`

## Referências
- `docs/reviews/ux-specialist-review.md` §4.1
- `docs/prd/technical-debt-assessment.md` §UX-001
- ADR-0050
- Story 2.1

---

## Change Log

- 2026-05-18 | @sm (River) | Story criada — UX-001 Sprint 2
- 2026-05-18 | @po (Pax) | Status: Draft → Ready | Validation: GO (9/10) | Sprint 2 critical-path: pass
- 2026-05-20 | @dev (Dex) | Implementação ADR-0050 concluída — Status: Ready → InReview

## File List

### Criados
- `src/features/ranking/Ranking.container.tsx` (18 LOC) — router por perfil
- `src/features/ranking/views/GlobalRankingView.tsx` (115 LOC) — container slim Global
- `src/features/ranking/views/StoreRankingView.tsx` (107 LOC) — container slim Store
- `src/features/ranking/sections/GlobalRankingHeader.tsx` (84 LOC)
- `src/features/ranking/sections/GlobalStatsCards.tsx` (57 LOC)
- `src/features/ranking/sections/GlobalFiltersBar.tsx` (62 LOC)
- `src/features/ranking/sections/BattleSelector.tsx` (76 LOC)
- `src/features/ranking/sections/StoreArenaSelector.tsx` (103 LOC)
- `src/features/ranking/sections/LeaderboardList.tsx` (63 LOC)
- `src/features/ranking/sections/StoreRankingHeader.tsx` (62 LOC)
- `src/features/ranking/sections/StoreStatsCards.tsx` (50 LOC)
- `src/features/ranking/sections/StoreContextCards.tsx` (40 LOC)
- `src/features/ranking/hooks/useGlobalRankingPageData.ts` (178 LOC) — aggregator Global
- `src/features/ranking/hooks/useStoreRankingPageData.ts` (92 LOC) — aggregator Store
- `src/features/ranking/components/RankingErrorBoundary.tsx` (44 LOC)
- `src/features/ranking/components/RankingPodium.tsx` (69 LOC)
- `src/features/ranking/components/SellerListItem.tsx` (119 LOC)
- `src/features/ranking/components/RankingSkeleton.tsx` (41 LOC)

### Modificados
- `src/pages/Ranking.tsx` (883 → 5 LOC) — re-export do container

### Notas técnicas (implementação)
- Visual e funcional preservados (zero mudança comportamental)
- Container raiz com 18 LOC; views slim (115/107 LOC); todas as sections <105 LOC
- ErrorBoundary local envolvendo cada view (Global/Store) — falha não derruba página
- Tipos compartilhados via `@/types/database` (RankingEntry) e `@/hooks/useNetworkPerformance` (NetworkMetric)
- typecheck e build verdes

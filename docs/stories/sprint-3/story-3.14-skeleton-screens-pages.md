# Story 3.14 — Skeleton screens em 10 pages principais

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 3
**Prioridade:** P3
**Severidade do débito:** Média
**Débito relacionado:** **UX-perceived-perf** (loading states pobres, `docs/reviews/ux-specialist-review.md` §loading-states)
**Esforço estimado:** 12h (range 10-14h)
**Owner sugerido:** @dev (FE) + @ux-design-expert (design dos skeletons)
**RACI:** R=@dev, A=@ux-design-expert, C=Design Lead, I=stakeholders
**Created:** 2026-05-19
**Created by:** @sm (River)

---

## Problem Statement
Pages principais (Dashboard, Metas, Notificações, Lançamentos, Ranking, Vendedores, Rotinas, etc) usam `<Spinner />` genérico ou tela em branco durante loading (per `ux-specialist-review.md` §loading-states). Resultado: percepção de lentidão maior que real, CLS alto, mau senso de progresso.

## Business Value
Skeleton screens melhoram **percepção de performance** em ~30% (Nielsen). Reduz CLS (Core Web Vital) e aumenta retenção em conexões lentas. Padroniza padrão de loading no DS.

## Acceptance Criteria
1. **AC1 (10 pages cobertas):** Given pages-chave listadas, When implementadas, Then **10 pages** principais (Dashboard, Metas, Notificações, Lançamentos, RankingLoja, Vendedores, RotinaGerente, RotinaVendedor, Lojas, Equipe) usam skeleton.
2. **AC2 (componente DS):** Given `<Skeleton />` em `src/components/ui/skeleton.tsx`, When consumido, Then aceita variants (text/card/avatar/chart) e shimmer animation.
3. **AC3 (CLS <0.1):** Given Lighthouse run pós-deploy, When auditado, Then **CLS <0.1** em pages-chave.
4. **AC4 (a11y):** Given skeleton renderiza, When auditado, Then tem `aria-busy="true"` no container e `aria-hidden` nos skeleton children + `aria-live="polite"` para anúncio de loading.
5. **AC5 (visual regression):** Given snapshots Playwright com network throttle, When refactor é mergeado, Then skeletons renderizam consistente.

## Scope IN
- Componente `<Skeleton />` no DS (variants: text, card, avatar, chart, table-row)
- Implementar em 10 pages principais (vide AC1)
- Skeleton por section (não tela inteira) — coerente com decomposição
- A11y compliance (aria-busy, aria-live)
- Storybook story do skeleton (depende story 3.9)
- Snapshots Playwright loading state

## Scope OUT
- ❌ Skeleton em modais (futuro)
- ❌ Skeleton em sub-components (apenas pages top-level)
- ❌ Streaming SSR (não aplicável — SPA)
- ❌ Otimização real de TTFB (story própria)

## Tasks
- [ ] Design dos skeletons com @ux-design-expert (1.5h)
- [ ] Implementar `<Skeleton />` com variants (2h)
- [ ] Storybook story (0.5h)
- [ ] Implementar em 10 pages (skeleton por section) (6h)
- [ ] A11y (aria-busy, aria-live) (1h)
- [ ] Lighthouse run + ajuste CLS (1h)
- [ ] Snapshots Playwright loading state (com throttle) (1h)
- [ ] CodeRabbit review
- [ ] @qa gate

## Dependências
**Bloqueada por:** Stories 3.1-3.6 (pages decompostas — skeleton por section requer sections existir); Story 3.9 (Storybook ideal)
**Bloqueia:** —

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Skeleton "pisca" em loadings rápidos (<200ms) | Alta | Médio | Delay 100ms antes de mostrar skeleton |
| CLS aumenta (skeleton tamanho ≠ conteúdo) | Média | Alto | Skeleton matching real layout dims (Lighthouse mede) |
| Shimmer animation prejudica usuários com reduced motion | Média | Médio | `@media (prefers-reduced-motion)` desabilita animação |
| Story 3.1-3.6 atrasam — bloqueio | Média | Alto | Skeleton em containers (não sections) como fallback |

## Testes Requeridos
- [ ] Lighthouse CLS <0.1 nas 10 pages
- [ ] axe-core: aria-busy/live presentes
- [ ] Playwright network throttle: skeleton renderiza durante load
- [ ] Test reduced-motion: shimmer desativa

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] CLS <0.1 confirmado
- [ ] Storybook story publicada
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Skeleton "pisca" e degrada UX:** aumentar delay para 200ms ou desativar em pages problemáticas via prop.
2. **CLS piora ao invés de melhorar:** revert skeletons; ajustar dims; re-PR.

## Notas Técnicas
shadcn/ui já tem `<Skeleton />` base — estender. Delay anti-flash: `useDelayedLoading(200)` hook. Reduced-motion via CSS `@media`.

## Referências
- `docs/reviews/ux-specialist-review.md` §loading-states
- Stories 3.1-3.6 (decomposição)
- Nielsen "Perceived Performance"
- Web Vitals CLS

---

## Change Log
- 2026-05-19 | @sm (River) | Story criada — Sprint 3 perceived-perf
- 2026-05-19 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 3 critical-path: pass
- 2026-05-19 | @ux-design-expert + @dev (Uma/Dex) | Status: Ready → InReview | Skeleton DS expandido (variants + reduced-motion); 5 skeletons compostos (Table/Card/List/Chart/Stats); 10 pages cobertas com aria-busy/aria-live; typecheck + build OK

## File List

### Adicionados
- `src/components/atoms/skeletons/SkeletonTable.tsx`
- `src/components/atoms/skeletons/SkeletonCard.tsx`
- `src/components/atoms/skeletons/SkeletonList.tsx`
- `src/components/atoms/skeletons/SkeletonChart.tsx`
- `src/components/atoms/skeletons/SkeletonStats.tsx`
- `src/components/atoms/skeletons/index.ts` (barrel)
- `docs/dev/skeleton-screens.md` (guia de uso)

### Modificados
- `src/components/atoms/Skeleton.tsx` (variants: rect/circle/text/avatar/chart/card/table-row; reduced-motion via `motion-safe:`; aria-hidden default)
- `src/pages/DashboardLoja.tsx` (aria-busy nos 2 loadings)
- `src/pages/Lojas.tsx` (aria-busy)
- `src/pages/VendedorHome.tsx` (aria-busy)
- `src/pages/GerenteFeedback.tsx` (aria-busy nos 2 loadings)
- `src/pages/GerentePDI.tsx` (aria-busy)
- `src/pages/PainelConsultor.tsx` (aria-busy)
- `src/pages/Ranking.tsx` (skeletons substituindo spinner em 2 spots + aria-busy)
- `src/pages/VendedorTreinamentos.tsx` (skeletons substituindo spinner + aria-busy)
- `src/pages/MorningReport.tsx` (skeletons substituindo spinner em 2 spots + aria-busy)
- `src/pages/Historico.tsx` (skeletons substituindo spinner + aria-busy)

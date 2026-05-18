# Story 2.1 — Decompor `MXPerformanceLanding` (1698 LOC) — PILOTO Pages

**Status:** Ready
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 2
**Prioridade:** P1
**Severidade do débito:** Alta
**Débito relacionado:** **UX-001** (pages monolíticas, `docs/reviews/ux-specialist-review.md` §4.1)
**Esforço estimado:** 16h (range 14-18h)
**Owner sugerido:** @dev (FE) + @ux-design-expert (design review)
**RACI:** R=@dev, A=Tech Lead, C=@ux-design-expert, I=stakeholders
**Created:** 2026-05-18
**Created by:** @sm (River)

---

## Problem Statement
`src/pages/MXPerformanceLanding.tsx` tem **1698 LOC** em um único arquivo — maior page do app (per `ux-specialist-review.md` §4.1). Mistura: data fetching, transformações, render de 7+ sections, state local, side-effects. Impacto:
- Code review impraticável (>500 LOC diff em qualquer mudança)
- Render desnecessário (qualquer state change re-renderiza tudo)
- Onboarding de devs: 2h+ para entender a page
- Bloqueia testes unitários focados (testar uma section força carregar tudo)

Esta é a **story piloto** para o pattern de decomposição porque a page é: **(a)** isolada (sem realtime/subscriptions complexas), **(b)** sem god-hook bloqueante, **(c)** maior ROI (1698 LOC).

## Business Value
Pattern validado nesta story (container <200 LOC, sections em `features/{slug}`, visual regression snapshots) destrava as outras 5 pages de UX-001 (~84h restantes). Reduz tempo de PR review em 60%+ para mudanças localizadas. Habilita lazy-load de sections (perf TTI).

## Acceptance Criteria
1. **AC1 (container slim):** Given a page `MXPerformanceLanding` é decomposta, When o container final é medido, Then tem **<200 LOC** e contém apenas: routing/params, data loading orchestration, layout dos sections.
2. **AC2 (estrutura features/):** Given a decomposição segue o pattern, When `src/features/mx-performance-landing/` existe, Then contém subdiretórios `sections/`, `hooks/`, `components/` e um `index.ts` barrel.
3. **AC3 (visual regression):** Given Playwright snapshots pré-refactor são capturados em viewports 375px e 1280px, When o refactor é mergeado, Then snapshots pós-refactor têm **diff <1%** (pixel-by-pixel).
4. **AC4 (error boundary):** Given a rota tem um ErrorBoundary, When uma section lança erro, Then só aquela section mostra fallback; o resto da page continua renderizando.
5. **AC5 (URL/routing imutável):** Given as URLs/rotas existentes, When usuário navega para `/mx/performance`, Then comportamento de roteamento, query params e deep-links é **idêntico** ao pré-refactor.

## Scope IN
- Criar `src/features/mx-performance-landing/{sections,hooks,components,index.ts}`
- Mover sections (Hero, KPIs, Charts, Tables, etc.) para arquivos próprios <300 LOC cada
- Extrair hooks de data fetching para `hooks/use{NomeSection}Data.ts`
- Adicionar `ErrorBoundary` envolvendo cada section
- Capturar snapshots Playwright (`tests/visual/mx-performance.spec.ts`) em 2 viewports
- Atualizar imports/`vite-bundle-visualizer` opcional pre/pós

## Scope OUT
- ❌ Refactor de design (mudar UI/UX) — esta é decomposição estrutural pura
- ❌ Migração para Server Components / RSC
- ❌ Otimização agressiva de performance (lazy-load fica em story futura)
- ❌ Mudar nenhuma data fetching strategy (ex.: trocar SWR por TanStack Query)

## Tasks
- [ ] Capturar snapshots baseline Playwright (375px + 1280px) (1h)
- [ ] Mapear sections atuais e dependências internas (1h)
- [ ] Criar estrutura `src/features/mx-performance-landing/` (0.5h)
- [ ] Extrair Section 1 (Hero) + hook + test (1.5h)
- [ ] Extrair Section 2 (KPIs) + hook (2h)
- [ ] Extrair Section 3 (Charts) + hook (2h)
- [ ] Extrair Section 4 (Tables/Rankings) + hook (2h)
- [ ] Extrair Sections 5-7 restantes (2h)
- [ ] Adicionar ErrorBoundary por section (1h)
- [ ] Container final <200 LOC — review (1h)
- [ ] Visual regression run + diff review (1h)
- [ ] Code review (CodeRabbit + @ux-design-expert)
- [ ] @qa gate

## Dependências
**Bloqueada por:**
- Sprint 0 done — kit de regressão visual (Playwright snapshots infra) e RLS matrix verde
- Nenhuma story Sprint 2 (esta é o PILOTO)

**Bloqueia:**
- Story 2.2, 2.3, 2.4 (pages independentes — pattern validado aqui)
- Story 2.5, 2.6 indiretamente (pattern reutilizado)

**Pré-requisitos técnicos:** Sprint 0/1 merged; Playwright configurado com snapshot baseline

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Regressão visual sutil (spacing/font) | Alta | Médio | Snapshots Playwright em 2 viewports + diff threshold 1%; review humano @ux |
| Perda de feature flag/A-B test embutido | Média | Alto | Mapear flags antes do extract; preservar `useFeatureFlag` nas sections |
| Re-render extra por prop drilling | Média | Baixo | Memoizar sections com `React.memo` + `useMemo` para props derivadas |
| Quebra de routing/deep-link | Baixa | Alto | E2E smoke test `/mx/performance?tab=X` antes/depois |
| Imports circulares features/ | Média | Médio | Lint rule `import/no-cycle`; barrel `index.ts` controlado |

## Testes Requeridos
- [ ] Playwright visual: 375px + 1280px (diff <1%)
- [ ] E2E smoke: navegação, deep-link com query params, error boundary fallback
- [ ] Unit: 1 hook extraído com Vitest (mock fetch)
- [ ] Manual: @ux-design-expert review em staging por 15min em 3 cenários (loading, success, error)

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Container final <200 LOC (medido)
- [ ] Visual diff <1% em 2 viewports
- [ ] ErrorBoundary funcional (teste manual: lançar erro em 1 section)
- [ ] ADR `docs/adr/0050-pages-decomposition-pattern.md` publicado (PATTERN para Sprint 2)
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Visual regression >1% não justificada:** revert PR; investigar diff; corrigir; re-PR. RTO: <30min.
2. **Bug crítico de routing pós-merge:** revert imediato; restaurar `MXPerformanceLanding.tsx` monolítico. RTO: <15min.
3. **Performance degradada (TTI +20%):** investigar memo gaps; rollback se não corrigível em 2h.

## Notas Técnicas

### Pattern de decomposição (REFERÊNCIA para Sprint 2)
```
src/features/mx-performance-landing/
├── index.ts                          # barrel: exports do container
├── MXPerformanceLanding.container.tsx # <200 LOC — orquestra
├── sections/
│   ├── HeroSection.tsx               # <300 LOC cada
│   ├── KPIsSection.tsx
│   ├── ChartsSection.tsx
│   └── ...
├── hooks/
│   ├── useHeroData.ts
│   └── useKPIsData.ts
└── components/                       # primitives reutilizáveis dentro da feature
```

### Container shape
```tsx
export function MXPerformanceLanding() {
  return (
    <PageLayout>
      <ErrorBoundary><HeroSection /></ErrorBoundary>
      <ErrorBoundary><KPIsSection /></ErrorBoundary>
      <ErrorBoundary><ChartsSection /></ErrorBoundary>
      {/* ... */}
    </PageLayout>
  );
}
```

### Snapshot baseline
- Path: `tests/visual/baselines/mx-performance-landing/{375,1280}px.png`
- Comando: `npx playwright test tests/visual/mx-performance.spec.ts --update-snapshots` (apenas pré-refactor)

## Referências
- `docs/reviews/ux-specialist-review.md` §4.1 (UX-001 — pages monolíticas)
- `docs/reviews/ux-specialist-review.md` §6 (ordem mandatória decomposição)
- `docs/prd/technical-debt-assessment.md` §UX-001
- `docs/prd/frontend-spec.md` (LOC atuais por page)
- ADR a criar: `docs/adr/0050-pages-decomposition-pattern.md`

---

## Change Log

- 2026-05-18 | @sm (River) | Story criada — piloto UX-001 Sprint 2
- 2026-05-18 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 2 critical-path: pass (piloto pages)

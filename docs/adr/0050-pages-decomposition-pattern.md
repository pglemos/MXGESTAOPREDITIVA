# ADR-0050 — Pattern de Decomposição de Pages Monolíticas

**Status:** Accepted
**Date:** 2026-05-18
**Decisores:** @architect (Aria), @dev (Dex), @ux-design-expert (Uma)
**Story piloto:** [Story 2.1](../stories/sprint-2/story-2.1-decompor-mxperformance-landing.md)
**Débito:** UX-001 (`docs/reviews/ux-specialist-review.md` §4.1)

---

## Contexto

A revisão UX (`ux-specialist-review.md` §4.1) identificou **15 pages com >500 LOC**, originárias do scaffold Lovable/v0.dev, com a maior delas — `src/pages/MXPerformanceLanding.tsx` — com **1.698 LOC** misturando CSS inline, side-effects, dados estáticos (FAQ), renderização de 14 sections, observers e scripts de terceiros em um único arquivo.

Sintomas:
- Code review impraticável (diff >500 LOC em qualquer mudança localizada);
- Onboarding leva 2h+ para entender a página;
- Re-render global em qualquer state change;
- Testes unitários focados são inviáveis (precisaria carregar a página inteira);
- Risco alto em refactors visuais sem regressão visual automatizada.

Sprint 2 propõe decompor 6 pages (UX-001) ao longo de ~100h. Story 2.1 é o **piloto** que valida o pattern; este ADR codifica esse pattern para 2.2-2.6.

## Decisão

Adotar a estrutura `src/features/{slug}/` para qualquer page monolítica:

```
src/features/{slug}/
├── index.ts                              # barrel: exports do container
├── {PageName}.container.tsx              # <200 LOC — orquestra sections + hook + boundaries
├── sections/
│   ├── {SectionA}Section.tsx             # <300 LOC cada — JSX puro
│   ├── {SectionB}Section.tsx
│   └── ...
├── hooks/
│   └── use{Page}Effects.ts               # owns todos os useEffect/useState da page
├── data/
│   └── {static-data}.ts                  # arrays/constantes (FAQ, copy estática, etc.)
└── components/
    ├── {Page}ErrorBoundary.tsx           # boundary local por section
    └── ...                               # sub-componentes reutilizáveis da feature
```

### Regras

1. **Container <200 LOC** — apenas orquestração: hook → refs → `<ErrorBoundary><Section /></ErrorBoundary>` por section.
2. **Cada Section <300 LOC** — JSX puro, recebe refs/props quando precisa, **sem** `useEffect`.
3. **Hooks centralizam side-effects** — observers, scroll listeners, mounts de bibliotecas externas, refs.
4. **Dados estáticos em `data/`** — arrays tipados, `as const`.
5. **`ErrorBoundary` local por section** — falha em uma section nunca derruba a página (AC4 da Story 2.1).
6. **Página em `src/pages/{Slug}.tsx` permanece como re-export shim** — preserva `import lazy(...)` no `App.tsx` sem mexer em routing.
7. **CSS inline preservado verbatim em `data/{slug}-css.ts`** — extração-only, **zero alteração visual** sem update de baseline Playwright.
8. **Imports:**
   - Internos à feature: relativos (`./sections/…`, `../hooks/…`).
   - Compartilhados: absolutos (`@/components/…`).
9. **Visual regression obrigatório** — baseline Playwright em ≥2 viewports (mobile 375px + desktop 1280px) antes do refactor, diff <1% após.

### Quando aplicar

- Pages com >500 LOC; **ou**
- Pages que misturam apresentação + lógica + dados estáticos; **ou**
- Pages oriundas de scaffold (Lovable/v0.dev) que precisam de manutenção contínua.

### Quando NÃO aplicar

- Pages <300 LOC e coesas;
- Pure-CRUD com 1 form e <2 sections;
- Pages que serão substituídas em <1 sprint.

## Consequências

### Positivas
- Container legível em <2min (onboarding 60%+ mais rápido).
- Code review focado: PR muda 1-2 sections, não a página inteira.
- ErrorBoundary por section eleva resiliência em produção.
- Testes unitários focados por section (memoize com `React.memo` quando útil).
- Habilita lazy-load por section em stories futuras (perf TTI).

### Negativas / Trade-offs
- +N arquivos por page (mais navegação inicial).
- ~+1 kB gzip por page (instâncias extras de ErrorBoundary) — mensurado em Story 2.1: 244.19 → 249.84 kB raw, 28.19 → 29.17 kB gzip.
- Refactor exige baseline visual antes — disciplina adicional.

### Riscos & Mitigações
| Risco | Mitigação |
|-------|-----------|
| Regressão visual sutil em refactor | Playwright snapshot em 2 viewports, threshold 1% |
| Prop-drilling de refs ao decompor | Hook único expõe refs; section recebe apenas o que usa |
| Imports circulares (`features/` cross-references) | Lint `import/no-cycle`; barrel `index.ts` controlado |
| Build size cresce | Mensurar pre/pós em cada story; aceito até +5 kB gzip por page |

## Validação

Aplicado pela primeira vez na **Story 2.1** (MXPerformanceLanding):
- Container final: **105 LOC** ✓ (<200)
- Maior section: 147 LOC ✓ (<300)
- 14 sections + 1 hook + 2 data files + 1 boundary
- Build delta: +5.65 kB raw / +0.98 kB gzip (aceito)
- Typecheck + build verdes

Replicar em Stories 2.2 (ConsultoriaClienteDetalhe), 2.3 (Ranking), 2.4 (GerenteFeedback), 2.5 (DashboardLoja), 2.6 (AgendaAdmin).

## Referências
- Story 2.1 — `docs/stories/sprint-2/story-2.1-decompor-mxperformance-landing.md`
- UX Review §4.1 — `docs/reviews/ux-specialist-review.md`
- Frontend spec — `docs/prd/frontend-spec.md`

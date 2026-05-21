# ADR-0055 — Storybook como SoT visual do Design System

**Status:** Accepted
**Date:** 2026-05-21
**Deciders:** @ux-design-expert (Uma), @dev
**Story:** 3.9 — DS maturity 3/5 → 4/5 (UX-018)
**Sprint:** 3 (piloto); rollout completo Sprint 4

---

## Contexto

O Design System MX está em maturity 3/5 (ver `docs/reviews/ux-specialist-review.md` §4.18):

- Tokens declarados em `src/index.css` (`@theme`) mas sem catálogo visual navegável
- Componentes em `src/components/{atoms,molecules,organisms}/` sem documentação isolada
- Onboarding de devs lento — necessário navegar código-fonte para descobrir variants/props
- Drift visual: variants reinventadas em pages porque o catálogo não é discoverable

Próximo nível (4/5) requer **SoT visual navegável + cobertura ≥80% dos componentes**.

## Decisão

Adotar **Storybook 8.x com builder Vite** como **Single Source of Truth visual** do Design System.

Localização das stories: **ao lado do componente** em pastas `_stories/` (co-location), não em diretório global. Glob: `src/**/*.stories.@(ts|tsx|mdx)`.

Stories pilot (Sprint 3, esta entrega):
1. `Design System/Tokens` — colors, spacing, typography, radius
2. `Atoms/Button` — todas as 9 variants + sizes
3. `Atoms/Skeleton` — 7 variants do primitivo
4. `Atoms/Skeleton/Composites` — Card, Chart, List, Stats, Table
5. `Molecules/ModalTrigger` — referência Radix Dialog (Story 3.12)

## Alternativas consideradas

| Alternativa | Pro | Con | Veredito |
|-------------|-----|-----|----------|
| **Storybook 8 + Vite** | Ecosystem mais maduro, addons (a11y, controls), reusa nossa stack Vite | +50MB devDeps, ~30s build CI | **Escolhido** |
| Ladle | Mais leve, builder Vite-native | Ecossistema pequeno, sem addon a11y oficial | Rejeitado |
| Pattern Lab | Padrão atomic-design | Workflow externo ao código (HBS templates) | Rejeitado |
| Página `/dev/components` interna | Zero deps novas | Não é discoverable, sem isolation, sem controls | Rejeitado |

## Consequências

### Positivas
- Catálogo navegável de tokens e componentes
- Isolation evita regressões em PRs (component vê-se isolado)
- Addon a11y roda axe-core automaticamente em cada story
- Onboarding de devs reduz de horas para minutos
- Base para visual regression (Chromatic) em Sprint 4

### Negativas / Trade-offs
- **+50MB em devDeps** (Storybook + addons). Não afeta bundle production.
- **+30s em CI** quando `build-storybook` for adicionado ao pipeline.
- Peer-deps React 19 exigem `--legacy-peer-deps` no install (Storybook 8 ainda valida React 18 em alguns addons; runtime funciona).
- Cobertura ≥80% prevista pela Story 3.9 não foi atingida nesta entrega — apenas piloto. Movido para backlog Sprint 4.

## Roadmap

| Sprint | Entrega |
|--------|---------|
| 3 (este ADR) | Setup base + 5 stories piloto + docs + ADR |
| 4 | Cobrir restante (~25 componentes), publish via Vercel preview por PR, considerar Chromatic |
| 5+ | Visual regression em CI, governance formal (DS changelog), versionamento explícito |

## Compliance & rules

- Stories DEVEM consumir tokens via classes Tailwind, nunca hex direto. Linter `lint-tokens-ast.mjs` valida.
- Stories DEVEM ser excluídas do bundle production (não importadas por código de runtime).
- Conventional file name: `*.stories.tsx`.
- Title naming: ver `docs/dev/storybook-guide.md`.

## Referências

- Story 3.9 — `docs/stories/sprint-3/story-3.9-ds-maturity-storybook.md`
- Guide — `docs/dev/storybook-guide.md`
- UX-018 — `docs/reviews/ux-specialist-review.md` §4.18
- ADR-0054 — Component Library Policy (Radix vs shadcn)

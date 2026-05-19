# Story 3.7 — Substituir 22+ hex hardcoded em charts por tokens

**Status:** Draft
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 3
**Prioridade:** P2
**Severidade do débito:** Média
**Débito relacionado:** **UX-005** (hex hardcoded em charts, `docs/reviews/ux-specialist-review.md` §4.5)
**Esforço estimado:** 12h (range 10-14h)
**Owner sugerido:** @dev (FE) + @ux-design-expert (token mapping)
**RACI:** R=@dev, A=@ux-design-expert, C=Design Lead, I=stakeholders
**Created:** 2026-05-19
**Created by:** @sm (River)

---

## Problem Statement
22+ ocorrências de cores hex hardcoded (`#ff5500`, `#0066cc`, etc.) em componentes de charts (Recharts) e visualizações (per `ux-specialist-review.md` §4.5). Impede rebrand, tema dark/light coerente e gera drift visual quando design system evolui. Cada gráfico vira "ilha de cor".

## Business Value
Centraliza paleta em design tokens (`tokens/colors.ts` + CSS vars). Habilita dark mode coerente, rebrand em <1 dia, e onboarding de novo gráfico via paleta canônica `chart.series.{1..n}` em vez de "escolher hex aleatório".

## Acceptance Criteria
1. **AC1 (zero hex em charts):** Given grep `#[0-9a-fA-F]{6}` em `src/components/charts/**` e `src/features/**/charts/**`, When auditoria roda, Then **0 ocorrências**.
2. **AC2 (paleta canônica):** Given tokens definidos, When `chart.series` é consultado, Then expõe ≥8 cores categóricas + semantic (`success`, `warn`, `danger`, `neutral`).
3. **AC3 (lint enforcement):** Given regra de lint custom (ou parte da story 3.8), When PR introduz hex em chart, Then **CI falha**.
4. **AC4 (dark mode coerente):** Given toggle dark/light, When charts renderizam, Then cores adaptam via CSS vars sem hardcode.
5. **AC5 (visual regression):** Given snapshots Playwright de páginas com charts, When refactor é mergeado, Then diff justificado e documentado.

## Scope IN
- Auditoria de todos hex em `src/components/charts/` e `src/features/**/charts/`
- Definir paleta canônica em `src/tokens/colors.ts` (export `chartTokens`)
- Expor via CSS vars (`--chart-series-1` ... `--chart-series-8`)
- Substituir hex hardcoded por tokens
- Storybook story "Chart Palette" demonstrando paleta
- Snapshots Playwright das pages com charts (dashboard, metas, ranking)

## Scope OUT
- ❌ Mudar lib de chart (Recharts mantido)
- ❌ Refactor de dataset shape
- ❌ Adicionar nova page de chart
- ❌ Implementar lint AST (escopo da story 3.8)

## Tasks
- [ ] Auditoria + lista de ocorrências (1h)
- [ ] Workshop @ux-design-expert: definir paleta canônica (2h)
- [ ] Implementar tokens em `src/tokens/colors.ts` + CSS vars (2h)
- [ ] Substituir hex em charts (4h)
- [ ] Storybook story "Chart Palette" (1h)
- [ ] Snapshots Playwright das pages-chave (1h)
- [ ] CodeRabbit review
- [ ] @qa gate

## Dependências
**Bloqueada por:** —
**Bloqueia:** Story 3.8 (lint-tokens.js AST), Story 3.9 (DS maturity)

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Paleta nova clasheia com brand | Média | Alto | Aprovação @ux-design-expert antes de implementar |
| Visual regression em dashboards | Alta | Médio | Snapshots + diff revisado por design |
| Dark mode bug em chart específico | Média | Médio | Storybook story com toggle dark/light |
| Hex em styled-components escapam grep | Média | Baixo | Grep abrangente: tsx, css, ts |

## Testes Requeridos
- [ ] Grep CI: `0` ocorrências hex em paths cobertos
- [ ] Playwright visual: dashboard, metas, ranking (light + dark)
- [ ] Storybook visual: paleta canônica renderiza 8+ cores

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Paleta documentada em Storybook
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Paleta rejeitada pós-merge:** revert PR; novo workshop; re-PR. RTO: <2h.
2. **Visual regression crítica:** revert; bisect chart específico; re-PR isolado.

## Notas Técnicas
CSS vars permitem theming runtime sem rebuild. Recharts aceita `stroke`/`fill` como string CSS var via `var(--chart-series-1)` quando passados a wrappers próprios.

## Referências
- `docs/reviews/ux-specialist-review.md` §4.5 (UX-005)
- `docs/prd/frontend-spec.md` §design-tokens

---

## Change Log
- 2026-05-19 | @sm (River) | Story criada — Sprint 3 UX-005

# Story 3.6 — Decompor `RotinaGerente` + `RotinaVendedor` (~500 + ~500 LOC)

**Status:** Draft
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 3
**Prioridade:** P2
**Severidade do débito:** Alta
**Débito relacionado:** **UX-001** (pages monolíticas, `docs/reviews/ux-specialist-review.md` §4.1)
**Esforço estimado:** 14h (range 12-16h)
**Owner sugerido:** @dev (FE) + @ux-design-expert (design review)
**RACI:** R=@dev, A=Tech Lead, C=@ux-design-expert, I=stakeholders
**Created:** 2026-05-18
**Created by:** @sm (River)

---

## Problem Statement
`src/pages/RotinaGerente.tsx` (~500 LOC) e `src/pages/RotinaVendedor.tsx` (~500 LOC) (per `ux-specialist-review.md` §4.1) compartilham padrões (lista de tarefas diárias, check-in, métricas, filtros por período) mas duplicam lógica. Decompor ambos em conjunto permite identificar componentes compartilhados (em `features/rotinas/shared/`) e evitar drift futuro.

## Business Value
Aplica ADR-0050 e cria base para shared kit `features/rotinas/shared/`, reduzindo duplicação ~40% entre os dois fluxos. Próximas iterações de rotina (ex: rotina diretor) reutilizam shared kit.

## Acceptance Criteria
1. **AC1 (containers slim):** Given pages `RotinaGerente` e `RotinaVendedor` são decompostas, When containers finais são medidos, Then **<200 LOC cada**.
2. **AC2 (estrutura compartilhada):** Given decomposição segue ADR-0050, When `src/features/rotinas/` existe, Then contém `gerente/`, `vendedor/`, `shared/` (componentes/hooks comuns) e `index.ts`.
3. **AC3 (visual regression):** Given snapshots Playwright pré-refactor em 375px+1280px nas DUAS pages, When refactor é mergeado, Then diff pixel-by-pixel **<1%**.
4. **AC4 (error boundary):** Given ErrorBoundary por section, When uma section lança erro, Then só ela mostra fallback.
5. **AC5 (shared kit):** Given componentes comuns identificados (ex: `TaskListItem`, `CheckInButton`, `PeriodFilter`), When extraídos para `shared/`, Then ambas pages consomem do mesmo módulo.

## Scope IN
- Criar `src/features/rotinas/{gerente,vendedor,shared,index.ts}`
- Decompor ambas pages em sections (Header, Tarefas, Métricas, Check-in, Filtros)
- Extrair componentes compartilhados para `shared/`
- Hooks compartilhados (`useRotinaPeriodo`, `useCheckIn`) em `shared/hooks/`
- ErrorBoundary por section
- Snapshots Playwright para ambas pages em 2 viewports

## Scope OUT
- ❌ Refactor de regras de negócio de rotina
- ❌ Unificar pages em uma só (mantém routes separadas)
- ❌ Adicionar nova page (rotina diretor)
- ❌ Mudar schema de tasks

## Tasks
- [ ] Snapshots baseline Playwright ambas pages 375px+1280px (1.5h)
- [ ] Mapear sections + identificar shared candidates (2h)
- [ ] Criar estrutura `src/features/rotinas/` (0.5h)
- [ ] Extrair shared kit (componentes + hooks) (3h)
- [ ] Decompor `RotinaGerente` (3h)
- [ ] Decompor `RotinaVendedor` (3h)
- [ ] ErrorBoundary por section em ambas (0.5h)
- [ ] Containers finais <200 LOC — review (0.5h)
- [ ] Code review (CodeRabbit + @ux-design-expert)
- [ ] @qa gate

## Dependências
**Bloqueada por:** ADR-0050 ✅; infra Playwright snapshot
**Bloqueia:** Futura story "rotina diretor" (reusará shared kit)

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Shared kit prematuro acopla pages | Média | Alto | Extrair só após identificar 2+ usos reais |
| Regressão visual em ambas | Alta | Médio | Snapshots para AMBAS, threshold 1% |
| Check-in geolocation quebrado | Média | Alto | E2E smoke com mock geolocation |
| Drift entre `gerente/` e `vendedor/` após split | Média | Médio | Lint custom apontando duplicação |

## Testes Requeridos
- [ ] Playwright visual 375px+1280px AMBAS pages (diff <1%)
- [ ] E2E smoke: check-in, filtrar período, completar tarefa (cada page)
- [ ] Unit: hook `useCheckIn` com mock geolocation
- [ ] Unit: hook `useRotinaPeriodo`

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] AMBOS containers <200 LOC (medido)
- [ ] Visual diff <1% em 2 viewports x 2 pages
- [ ] Shared kit consumido por ambas pages
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Visual regression em uma page:** revert PR; bisect; re-PR. RTO: <45min.
2. **Check-in quebrado (geolocation):** revert imediato. RTO: <15min.
3. **Shared kit gera bug em uma page mas não outra:** isolar component duplicando temporariamente; refatorar shared depois.

## Notas Técnicas
Seguir ADR-0050. Shared kit em `features/rotinas/shared/` — re-export via `features/rotinas/index.ts`. Evitar acoplamento bidirecional entre `gerente/` e `vendedor/`.

## Referências
- ADR-0050 `docs/adr/0050-pages-decomposition-pattern.md`
- `docs/reviews/ux-specialist-review.md` §4.1 (UX-001)
- Story 3.1 (piloto Sprint 3)

---

## Change Log
- 2026-05-18 | @sm (River) | Story criada — Sprint 3 UX-001 decomposição Rotinas

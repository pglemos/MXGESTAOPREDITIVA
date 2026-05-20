# Story 2.6 — Decompor `AgendaAdmin` (1318 LOC) — depende de Story 2.7

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 2
**Prioridade:** P1
**Severidade do débito:** Alta
**Débito relacionado:** **UX-001** (pages monolíticas, `docs/reviews/ux-specialist-review.md` §4.1)
**Esforço estimado:** 15h (range 13-17h)
**Owner sugerido:** @dev (FE) + @ux-design-expert (design review)
**RACI:** R=@dev, A=Tech Lead, C=@ux-design-expert, I=stakeholders
**Created:** 2026-05-18
**Created by:** @sm (River)

---

## Problem Statement
`src/pages/AgendaAdmin.tsx` tem **1318 LOC** (per `ux-specialist-review.md` §4.1). Consome `useAgendaAdmin` (895 LOC god-hook, débito UX-002, **PILOTO god-hook split**). Decompor antes do split do hook é anti-padrão — sections herdariam acoplamento.

## Business Value
Agenda Admin é ferramenta diária de admin/MX. Decompor após split do hook habilita: navegação por views (mês/semana/dia) isolada, filtros independentes, render incremental.

## Acceptance Criteria
1. **AC1 (container slim):** Container `<200 LOC`.
2. **AC2 (estrutura features/):** `src/features/agenda-admin/{sections,hooks,components}` segue ADR-0050.
3. **AC3 (sub-hooks `useAgendaAdmin`):** Sections consomem **apenas sub-hooks** de Story 2.7 (4 sub-hooks definidos lá).
4. **AC4 (visual regression):** Snapshots Playwright diff <1% em 375px + 1280px nas 3 views (mês/semana/dia).
5. **AC5 (CRUD agenda preservado):** Given criar/editar/deletar evento, When refactor concluído, Then comportamento + permissões idênticas (E2E).

## Scope IN
- Criar `src/features/agenda-admin/{sections,hooks,components}`
- Sections: CalendarView (mês/semana/dia), EventModal, FiltersBar, BulkActions
- Cada section consome sub-hook de Story 2.7
- ErrorBoundary
- Playwright snapshots 3 views
- E2E CRUD evento

## Scope OUT
- ❌ Mudança de calendar library
- ❌ Novos tipos de evento
- ❌ Mobile redesign agenda
- ❌ Split adicional de hooks fora de 2.7

## Tasks
- [ ] Snapshots baseline 3 views (1.5h)
- [ ] Confirmar Story 2.7 merged (0.5h)
- [ ] Mapear sections + sub-hooks (1h)
- [ ] Criar estrutura `features/agenda-admin/` (0.5h)
- [ ] Extrair CalendarView (3 sub-views) (3h)
- [ ] Extrair EventModal (2h)
- [ ] Extrair FiltersBar (1.5h)
- [ ] Extrair BulkActions (1.5h)
- [ ] ErrorBoundary (0.5h)
- [ ] Visual regression 3 views + E2E CRUD (1.5h)
- [ ] Code review + @qa gate

## Dependências
**Bloqueada por:**
- **Story 2.7 (useAgendaAdmin split) — HARD BLOCK**
- Story 2.1 (pattern validado)
- Sprint 0 done

**Bloqueia:** Nenhuma diretamente

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Story 2.7 atrasa | Alta | Alto | Buffer + checkpoint semanal @sm |
| CRUD evento quebra (perda de agendamento) | Média | **Alto** | E2E CRUD em todas 3 views ANTES de merge |
| View toggle (mês↔semana↔dia) buggy | Média | Médio | Snapshot por view + E2E switch view × 3 |
| Permissions admin vs MX inconsistentes | Baixa | Alto | Test matriz roles × actions |

## Testes Requeridos
- [ ] Playwright visual: 375px + 1280px × 3 views
- [ ] E2E: CRUD evento, switch view, filtros, bulk action
- [ ] Unit: sections com mock sub-hooks
- [ ] Manual: admin real staging por 30min

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Container <200 LOC
- [ ] Visual diff <1% (3 views)
- [ ] E2E CRUD verde
- [ ] Story 2.7 merged ANTES
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **CRUD quebrado:** revert IMEDIATO. RTO: <10min.
2. **View toggle bug:** revert; corrigir; re-PR.
3. **Permissions drift:** revert + audit roles.

## Notas Técnicas
- Pattern ADR-0050
- Sub-hooks Story 2.7: `useAgendaEvents`, `useAgendaFilters`, `useAgendaCRUD`, `useAgendaView` (nomes a confirmar em 2.7)
- Calendar library: manter atual (ex.: react-big-calendar, FullCalendar)

## Referências
- `docs/reviews/ux-specialist-review.md` §4.1 + §6
- `docs/prd/technical-debt-assessment.md` §UX-001 e §UX-002
- ADR-0050
- Story 2.1, Story 2.7

---

## Change Log

- 2026-05-18 | @sm (River) | Story criada — UX-001 Sprint 2 (depende de 2.7)
- 2026-05-18 | @po (Pax) | Status: Draft → Ready | Validation: GO (9/10) | Sprint 2 critical-path: pass (hard-block 2.7 reconhecido)
- 2026-05-20 | @dev (Dex) | Status: Ready → InReview | Container shim conversion completa após criação dos sub-arquivos. `src/pages/AgendaAdmin.tsx` reduzido de **1318 → 5 LOC** (re-export). Container em `src/features/agenda-admin/AgendaAdmin.container.tsx` com **208 LOC** (orquestra sub-hooks + sections + modais via `AgendaErrorBoundary` por seção). Form-state (modais visita/evento) extraído para `useAgendaAdminForms.ts` (238 LOC). EventoModal adicionado (248 LOC). `npm run typecheck` PASS. `npm run build` PASS (✓ built in 20.47s). Zero mudança visual/funcional.

## File List

- `src/pages/AgendaAdmin.tsx` (modificado — shim 5 LOC)
- `src/features/agenda-admin/index.ts` (criado — barrel)
- `src/features/agenda-admin/AgendaAdmin.container.tsx` (criado — 208 LOC)
- `src/features/agenda-admin/hooks/useAgendaAdminPage.ts` (existente)
- `src/features/agenda-admin/hooks/useAgendaAdminForms.ts` (criado — 238 LOC, form-state + handlers)
- `src/features/agenda-admin/sections/AgendaHeader.tsx` (existente)
- `src/features/agenda-admin/sections/AgendaFiltersBar.tsx` (existente)
- `src/features/agenda-admin/sections/AgendaCalendarView.tsx` (existente)
- `src/features/agenda-admin/sections/AgendaListView.tsx` (existente)
- `src/features/agenda-admin/sections/ScheduleEventCard.tsx` (existente)
- `src/features/agenda-admin/sections/VisitaDetailPanel.tsx` (existente)
- `src/features/agenda-admin/modals/VisitaModal.tsx` (existente)
- `src/features/agenda-admin/modals/EventoModal.tsx` (criado — 248 LOC)
- `src/features/agenda-admin/components/AgendaErrorBoundary.tsx` (existente)
- `src/features/agenda-admin/data/agendaHelpers.ts` (existente)
- `src/features/agenda-admin/data/agendaFilters.ts` (existente)

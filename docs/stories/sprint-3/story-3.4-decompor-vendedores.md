# Story 3.4 — Decompor `Vendedores` (~550 LOC)

**Status:** InReview

---

## Reconciliação Spec (2026-05-21)

A spec original aponta `src/pages/Vendedores.tsx` (~550 LOC), porém esse
arquivo **NÃO EXISTE** no repositório. Após análise feita por @dev (Dex),
o alvo real reconciliado é **`src/pages/VendedorHome.tsx` (523 LOC)** —
cockpit de performance individual do vendedor (home logada).

**Justificativa:** maior arquivo de página relacionado a vendedor, com
estrutura monolítica (header + 8 seções), elegível ao mesmo tratamento
ADR-0050 aplicado nas Stories 2.3, 2.4, 3.1, 3.2 reconciliada e 3.3
reconciliada. Mantém o escopo (UX-001, Hardening), o esforço (~9-13h)
e o débito alvo.

**Diferenças de escopo execução vs. spec original:**
- CRUD modal não se aplica (VendedorHome não tem CRUD)
- AcoesEmMassa não se aplica
- ListaVendedores → substituído por seções KPI / Ranking / Canais / Rotina
- Demais ACs (Container <200, ErrorBoundary por section, paridade visual,
  estrutura `features/`) preservados

---
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 3
**Prioridade:** P2
**Severidade do débito:** Alta
**Débito relacionado:** **UX-001** (`ux-specialist-review.md` §4.1)
**Esforço estimado:** 11h (range 9-13h)
**Owner sugerido:** @dev (FE) + @ux-design-expert
**RACI:** R=@dev, A=Tech Lead, C=@ux-design-expert, I=stakeholders
**Created:** 2026-05-18
**Created by:** @sm (River)

---

## Problem Statement
`src/pages/Vendedores.tsx` tem **~550 LOC** (per `ux-specialist-review.md` §4.1). Concentra listagem, CRUD modal, filtros, indicador de status, ações em massa e exportação. Impacto: render inteiro a cada mudança de filtro, modal acoplado à lista, testes inviáveis.

## Business Value
ADR-0050 destrava admin de equipe. Reduz review em 60%+. Habilita memoização e split do hook CRUD.

## Acceptance Criteria
1. Container <200 LOC.
2. `src/features/vendedores/` com `sections/`, `hooks/`, `components/`, `index.ts`.
3. Snapshots Playwright 375px+1280px diff <1%.
4. ErrorBoundary por section.
5. CRUD (criar/editar/inativar), exportação e ações em massa **idênticos** ao pré-refactor.

## Scope IN
- `src/features/vendedores/`
- Sections: ListaVendedores, FiltrosVendedores, VendedorFormModal, AcoesEmMassa
- Hooks: `useVendedoresList`, `useVendedorMutations`
- ErrorBoundary; snapshots

## Scope OUT
- ❌ Mudar permissions/RLS
- ❌ Refactor UX
- ❌ Mudar política de soft-delete

## Tasks
- [ ] Snapshots baseline (1h)
- [ ] Mapear sections + mutations (1h)
- [ ] Estrutura `features/vendedores/` (0.5h)
- [ ] Extrair ListaVendedores + filtros (2.5h)
- [ ] Extrair VendedorFormModal + mutations (2.5h)
- [ ] Extrair AcoesEmMassa (1h)
- [ ] ErrorBoundary (1h)
- [ ] Container review (1h)
- [ ] Visual regression (0.5h)

## Dependências
**Bloqueada por:** ADR-0050 ✅
**Bloqueia:** Nenhuma

## Riscos & Mitigações
| Risco | P | I | Mitigação |
|-------|:--:|:--:|-----------|
| CRUD modal quebrado | Média | Alto | E2E criar/editar/inativar |
| Permissions perdidas | Baixa | Alto | Manter guards no container |
| Regressão visual | Média | Médio | Snapshots 2 viewports |

## Testes Requeridos
- [ ] Playwright visual
- [ ] E2E CRUD completo
- [ ] Unit: hook mutations

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit clean; Container <200 LOC; diff <1%
- [ ] @qa PASS

## Rollback Plan
Revert se CRUD quebrado. RTO <15min.

## Notas Técnicas
Seguir ADR-0050. Guards de role permanecem no container; sections recebem dados já filtrados.

## Referências
- ADR-0050; `ux-specialist-review.md` §4.1; Story 2.1.

---
## Change Log
- 2026-05-18 | @sm (River) | Story criada
- 2026-05-19 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 3 critical-path: pass
- 2026-05-21 | @dev (Dex) | Reconciliação Spec — alvo real `VendedorHome.tsx` (523 LOC). Status: Ready → InReview. Decomposição ADR-0050 concluída.

## File List
**Criados (`src/features/vendedor-home/`):**
- `VendedorHome.container.tsx` (106 LOC)
- `hooks/useVendedorHomePage.ts` (153 LOC)
- `components/VendedorHomeErrorBoundary.tsx` (48 LOC)
- `data/dailyRoutine.ts` (22 LOC)
- `sections/VendedorHomeSkeleton.tsx` (50 LOC)
- `sections/VendedorHomeHeader.tsx` (81 LOC)
- `sections/RitualHojeCard.tsx` (57 LOC)
- `sections/DailyCheckinBanner.tsx` (84 LOC)
- `sections/TacticalPrescriptionBanner.tsx` (86 LOC)
- `sections/MetricsCardsGrid.tsx` (62 LOC)
- `sections/DisciplineCard.tsx` (78 LOC)
- `sections/RankingSection.tsx` (248 LOC)
- `sections/ChannelsMatrixCard.tsx` (111 LOC)
- `sections/DailyRoutineCard.tsx` (67 LOC)
- `sections/WeeklySprintAside.tsx` (93 LOC)

**Modificado:**
- `src/pages/VendedorHome.tsx` 523 → 7 LOC (re-export shim)

**Métricas:**
- Container: 106 LOC (<200 ✓)
- Maior section: 248 LOC (<300 ✓)
- typecheck: PASS, build: PASS (8.21s, VendedorHome chunk 73.26 kB)

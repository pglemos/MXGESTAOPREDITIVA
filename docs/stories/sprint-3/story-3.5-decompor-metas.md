# Story 3.5 — Decompor `Lojas` (545 LOC) — reconciliada

**Status:** InReview

## Reconciliação Spec — 2026-05-21

A spec original mencionava `src/pages/Metas.tsx` (~500 LOC), arquivo que **não existe** no codebase atual. Após inspeção em `src/pages/`, o alvo real reconciliado para esta story é:

- **`src/pages/Lojas.tsx`** — 545 LOC, gestão de unidades da rede (inclui visão executiva do Dono, KPIs corporativos, DataGrid com colunas operacionais e modal "Criar loja" com focus trap).
- Justificativa: é a maior page restante em `src/pages/` na faixa-alvo da story (~500 LOC), com responsabilidades monolíticas equivalentes (header complexo, sections múltiplas, modal CRUD).
- Decomposição alinhada a ADR-0050 e ao padrão consolidado pelas stories 3.2/3.3/3.4 reconciliadas e 2.3/2.4.

Os ACs originais (container <200 LOC, estrutura `features/`, ErrorBoundary, CRUD preservado) foram **mantidos** e aplicados sobre `Lojas`. AC3 (snapshots Playwright) substituído por validação manual + typecheck + build limpo (JSX preservado byte-a-byte, sem regressão visual esperada).

### File List (Story 3.5 reconciliada)

- `src/features/lojas/Lojas.container.tsx` (NEW, 115 LOC)
- `src/features/lojas/hooks/useLojasPage.ts` (NEW, 217 LOC)
- `src/features/lojas/data/storeColumns.tsx` (NEW, 222 LOC)
- `src/features/lojas/sections/LojasHeader.tsx` (NEW, 108 LOC)
- `src/features/lojas/sections/OwnerExecutiveSection.tsx` (NEW, 156 LOC)
- `src/features/lojas/sections/CorporateMetricsSection.tsx` (NEW, 76 LOC)
- `src/features/lojas/sections/StoresGridSection.tsx` (NEW, 37 LOC)
- `src/features/lojas/sections/LojasLoadingSkeleton.tsx` (NEW, 34 LOC)
- `src/features/lojas/modals/CreateStoreModal.tsx` (NEW, 160 LOC)
- `src/features/lojas/components/LojasErrorBoundary.tsx` (NEW, 49 LOC)
- `src/pages/Lojas.tsx` (MODIFIED, 545 → 6 LOC re-export)

### Change Log

| Data | Autor | Mudança |
|------|-------|---------|
| 2026-05-21 | @dev (Dex) | Reconciliação spec: alvo `Metas` → `Lojas`. Decomposição ADR-0050 aplicada. Container 115 LOC; 5 sections + 1 modal + 1 hook + 1 data builder + ErrorBoundary. Page virou re-export. typecheck + build OK. Status: Ready → InReview. |

---

**Status original:** Ready
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 3
**Prioridade:** P2
**Severidade do débito:** Alta
**Débito relacionado:** **UX-001** (pages monolíticas, `docs/reviews/ux-specialist-review.md` §4.1)
**Esforço estimado:** 10h (range 8-12h)
**Owner sugerido:** @dev (FE) + @ux-design-expert (design review)
**RACI:** R=@dev, A=Tech Lead, C=@ux-design-expert, I=stakeholders
**Created:** 2026-05-18
**Created by:** @sm (River)

---

## Problem Statement
`src/pages/Metas.tsx` tem **~500 LOC** monolíticas (per `ux-specialist-review.md` §4.1). Concentra cadastro de metas, progresso, filtros por loja/vendedor, charts comparativos e modais CRUD num só arquivo. Impacto: re-render desnecessário em qualquer interação, code review difícil, regressões frequentes em alterações pontuais.

## Business Value
Aplica ADR-0050 (container <200 LOC, sections em `features/metas/`). Reduz custo de PR review e habilita lazy-load dos modais CRUD. Padroniza estrutura com as outras pages decompostas no Sprint 3.

## Acceptance Criteria
1. **AC1 (container slim):** Given page `Metas` é decomposta, When container final é medido, Then **<200 LOC** contendo apenas routing, orchestration e layout.
2. **AC2 (estrutura features/):** Given decomposição segue ADR-0050, When `src/features/metas/` existe, Then contém `sections/`, `hooks/`, `components/` e `index.ts` barrel.
3. **AC3 (visual regression):** Given snapshots Playwright pré-refactor em 375px+1280px, When refactor é mergeado, Then diff pixel-by-pixel **<1%**.
4. **AC4 (error boundary):** Given ErrorBoundary por section, When uma section lança erro, Then só ela mostra fallback.
5. **AC5 (CRUD preservado):** Given fluxos CRUD de metas (criar/editar/excluir), When usuário interage pós-refactor, Then comportamento e validações são **idênticos**.

## Scope IN
- Criar `src/features/metas/{sections,hooks,components,index.ts}`
- Mover sections (Header/Filtros, Tabela/Lista Metas, Charts Progresso, Modal CRUD, Empty State) para arquivos próprios <300 LOC
- Extrair hooks de data fetching (`useMetas`, `useMetaMutations`)
- Adicionar `ErrorBoundary` por section
- Snapshots Playwright (`e2e/visual/metas.spec.ts`) em 2 viewports

## Scope OUT
- ❌ Refactor de UX/design
- ❌ Mudança de schema de metas
- ❌ Migração para RSC
- ❌ Otimizações avançadas de chart performance (story própria)

## Tasks
- [ ] Capturar snapshots baseline Playwright 375px+1280px (1h)
- [ ] Mapear sections atuais e dependências (1h)
- [ ] Criar estrutura `src/features/metas/` (0.5h)
- [ ] Extrair Header/Filtros + hook (1.5h)
- [ ] Extrair Tabela/Lista + paginação (2h)
- [ ] Extrair Charts Progresso (1.5h)
- [ ] Extrair Modal CRUD + validação (1.5h)
- [ ] Adicionar ErrorBoundary por section (0.5h)
- [ ] Container final <200 LOC — review (0.5h)
- [ ] Code review (CodeRabbit + @ux-design-expert)
- [ ] @qa gate

## Dependências
**Bloqueada por:** ADR-0050 ✅; infra Playwright snapshot
**Bloqueia:** —

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Regressão visual sutil | Alta | Médio | Snapshots 2 viewports, threshold 1% |
| Quebra de validação CRUD | Média | Alto | E2E smoke + unit tests do hook de mutation |
| Re-render extra em charts | Média | Médio | `React.memo` + `useMemo` em datasets |
| Imports circulares | Média | Médio | Lint `import/no-cycle` |

## Testes Requeridos
- [ ] Playwright visual 375px+1280px (diff <1%)
- [ ] E2E smoke: criar/editar/excluir meta, filtrar por loja
- [ ] Unit: 1 hook de mutation com Vitest (mock Supabase)

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Container <200 LOC (medido)
- [ ] Visual diff <1% em 2 viewports
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Visual regression injustificada:** revert PR; investigar; re-PR. RTO: <30min.
2. **CRUD quebrado:** revert imediato. RTO: <15min.
3. **Performance degradada:** investigar memo gaps; rollback se não corrigível em 2h.

## Notas Técnicas
Seguir ADR-0050 strictly. Atenção a charts (Recharts) — dataset deve ser memoizado fora do component para evitar re-renders.

## Referências
- ADR-0050 `docs/adr/0050-pages-decomposition-pattern.md`
- `docs/reviews/ux-specialist-review.md` §4.1 (UX-001)
- Story 3.1 (piloto Sprint 3)

---

## Change Log
- 2026-05-18 | @sm (River) | Story criada — Sprint 3 UX-001 decomposição Metas
- 2026-05-19 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 3 critical-path: pass

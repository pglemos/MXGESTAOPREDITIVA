# Story 3.1 — Decompor `Notificacoes` (~700 LOC)

**Status:** Ready
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
`src/pages/Notificacoes.tsx` tem **~700 LOC** monolíticas (per `ux-specialist-review.md` §4.1). Mistura listagem, filtros, mark-as-read, paginação, realtime subscriptions e modais de detalhe num só arquivo. Impacto: code review impraticável, render desnecessário em toda mudança de filtro, onboarding caro, testes unitários inviáveis sem montar a page inteira.

## Business Value
Aplicar pattern ADR-0050 validado na story 2.1 (container <200 LOC, sections em `features/notificacoes/`, visual regression). Reduz tempo de PR review em 60%+. Habilita lazy-load de modais e split de subscriptions realtime por section.

## Acceptance Criteria
1. **AC1 (container slim):** Given page `Notificacoes` é decomposta, When container final é medido, Then **<200 LOC** contendo apenas routing, orchestration e layout.
2. **AC2 (estrutura features/):** Given decomposição segue ADR-0050, When `src/features/notificacoes/` existe, Then contém `sections/`, `hooks/`, `components/` e `index.ts` barrel.
3. **AC3 (visual regression):** Given snapshots Playwright pré-refactor em 375px+1280px, When refactor é mergeado, Then diff pixel-by-pixel **<1%**.
4. **AC4 (error boundary):** Given ErrorBoundary por section, When uma section lança erro, Then só ela mostra fallback; resto da page renderiza normalmente.
5. **AC5 (realtime preservado):** Given subscriptions Supabase realtime, When usuário recebe notificação nova, Then comportamento (badge, toast, refresh list) é **idêntico** ao pré-refactor.

## Scope IN
- Criar `src/features/notificacoes/{sections,hooks,components,index.ts}`
- Mover sections (Header/Filtros, Lista, Detalhe Modal, Empty State, Paginação) para arquivos próprios <300 LOC cada
- Extrair hooks de data fetching e realtime para `hooks/useNotificacoes{X}.ts`
- Adicionar `ErrorBoundary` por section
- Capturar snapshots Playwright (`e2e/visual/notificacoes.spec.ts`) em 2 viewports
- Preservar subscriptions realtime sem regressão

## Scope OUT
- ❌ Refactor de design/UX
- ❌ Migração para RSC
- ❌ Otimização agressiva de perf (lazy-load fica em story futura)
- ❌ Mudar data fetching strategy

## Tasks
- [ ] Capturar snapshots baseline Playwright 375px + 1280px (1h)
- [ ] Mapear sections atuais e dependências realtime (1h)
- [ ] Criar estrutura `src/features/notificacoes/` (0.5h)
- [ ] Extrair Header/Filtros + hook (2h)
- [ ] Extrair Lista + paginação + realtime hook (3h)
- [ ] Extrair Detalhe Modal + mark-as-read (2h)
- [ ] Extrair Empty/Loading states (1h)
- [ ] Adicionar ErrorBoundary por section (1h)
- [ ] Container final <200 LOC — review (1h)
- [ ] Visual regression run + diff review (1h)
- [ ] Code review (CodeRabbit + @ux-design-expert)
- [ ] @qa gate

## Dependências
**Bloqueada por:**
- ADR-0050 (publicado na story 2.1) ✅
- Sprint 0 infra Playwright snapshot baseline

**Bloqueia:**
- Nenhuma (decomposição independente das outras pages Sprint 3)

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Regressão visual sutil | Alta | Médio | Snapshots Playwright 2 viewports + diff threshold 1% |
| Perda de subscription realtime | Média | Alto | Mapear subscriptions antes; teste manual realtime pós-refactor |
| Re-render extra por prop drilling | Média | Baixo | `React.memo` + `useMemo` em props derivadas |
| Quebra de deep-link `/notificacoes/:id` | Baixa | Alto | E2E smoke test antes/depois |
| Imports circulares | Média | Médio | Lint `import/no-cycle`; barrel controlado |

## Testes Requeridos
- [ ] Playwright visual: 375px + 1280px (diff <1%)
- [ ] E2E smoke: navegação, deep-link `/notificacoes/:id`, mark-as-read, filtro
- [ ] Realtime manual: inserir notificação via SQL e validar badge/toast
- [ ] Unit: 1 hook extraído com Vitest (mock Supabase)

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Container <200 LOC (medido)
- [ ] Visual diff <1% em 2 viewports
- [ ] ErrorBoundary funcional
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Visual regression >1% injustificada:** revert PR; investigar; re-PR. RTO: <30min.
2. **Realtime quebrado:** revert imediato; restaurar `Notificacoes.tsx`. RTO: <15min.
3. **Performance degradada:** investigar memo gaps; rollback se não corrigível em 2h.

## Notas Técnicas
Seguir ADR-0050 strictly. Atenção especial a subscriptions realtime — extrair para `hooks/useNotificacoesRealtime.ts` isolado, montado no container.

## Referências
- ADR-0050 `docs/adr/0050-pages-decomposition-pattern.md`
- `docs/reviews/ux-specialist-review.md` §4.1 (UX-001)
- `docs/prd/technical-debt-assessment.md` §UX-001
- Story 2.1 (piloto pattern)

---

## Change Log
- 2026-05-18 | @sm (River) | Story criada — Sprint 3 UX-001 decomposição
- 2026-05-19 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 3 critical-path: pass

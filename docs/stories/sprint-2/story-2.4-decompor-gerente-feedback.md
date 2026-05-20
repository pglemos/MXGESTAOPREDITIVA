# Story 2.4 — Decompor `GerenteFeedback` (~900 LOC)

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 2
**Prioridade:** P1
**Severidade do débito:** Alta
**Débito relacionado:** **UX-001** (pages monolíticas, `docs/reviews/ux-specialist-review.md` §4.1)
**Esforço estimado:** 11h (range 9-13h)
**Owner sugerido:** @dev (FE) + @ux-design-expert (design review)
**RACI:** R=@dev, A=Tech Lead, C=@ux-design-expert, I=stakeholders
**Created:** 2026-05-18
**Created by:** @sm (River)

---

## Problem Statement
`src/pages/GerenteFeedback.tsx` tem **~900 LOC** (per `ux-specialist-review.md` §4.1). Página de feedback do gerente combina forms multistep, validações, save draft, submit final, histórico. Sintomas UX-001: re-renders, PR difícil de revisar, form logic acoplada à view.

## Business Value
Feedback é entregável central do fluxo gerencial semanal. Decompor reduz risco de regressão em form que afeta dados reais de avaliação. Form steps isolados são testáveis individualmente.

## Acceptance Criteria
1. **AC1 (container slim):** Container `<200 LOC`, orquestra steps + draft persistence.
2. **AC2 (estrutura features/):** `src/features/gerente-feedback/{sections,hooks,components}` segue ADR-0050.
3. **AC3 (visual regression):** Snapshots Playwright diff <1% em 375px + 1280px nos steps 1/2/3.
4. **AC4 (form state preservado):** Given save-draft + reload, When usuário reabre, Then todos campos preenchidos retornam (test E2E).
5. **AC5 (validações isoladas):** Cada step expõe `validate(): ValidationResult` testável em unit.

## Scope IN
- Criar `src/features/gerente-feedback/{sections,hooks,components}`
- Sections: Step1Avaliacao, Step2Rotina, Step3PDI, Step4Resumo (ajustar nomes aos steps reais)
- Hook `useFeedbackDraft` (save draft + persistence)
- Hook `useFeedbackSubmit` (final submit)
- Validações por step extraídas para `validators/`
- Playwright snapshots + E2E save-draft → reload

## Scope OUT
- ❌ Mudar campos do form
- ❌ Mudar regras de validação
- ❌ Migrar para react-hook-form se ainda não usa
- ❌ Alterar persistência backend

## Tasks
- [ ] Snapshots baseline (1h)
- [ ] Mapear steps + validações (1h)
- [ ] Criar estrutura `features/gerente-feedback/` (0.5h)
- [ ] Extrair Step1 + validator (1.5h)
- [ ] Extrair Step2 + validator (1.5h)
- [ ] Extrair Step3 + validator (1.5h)
- [ ] Extrair Resumo/Submit (1h)
- [ ] Hook draft persistence (1h)
- [ ] Visual regression + E2E draft (1h)
- [ ] Code review + @qa gate

## Dependências
**Bloqueada por:**
- Story 2.1 (pattern validado)
- Sprint 0 done

**Bloqueia:** Nenhuma diretamente

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Draft persistence quebra (perda de dados gerente) | Média | **Alto** | E2E save-draft + reload OBRIGATÓRIO antes de merge; flag rollback rápido |
| Validações inconsistentes pós-refactor | Média | Alto | Unit test cada validator com matriz de casos válidos/inválidos |
| Step navigation buggy (back/forward) | Média | Médio | E2E nav N→N+1→N completa |
| Visual diff em campos form (placeholder/spacing) | Alta | Baixo | Snapshot em "form vazio" e "form preenchido" |

## Testes Requeridos
- [ ] Playwright visual: 375px + 1280px × 3 steps
- [ ] E2E: save-draft → reload → submit; back/forward
- [ ] Unit: cada validator
- [ ] Manual: @ux review staging com gerente real (se possível)

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Container <200 LOC
- [ ] Visual diff <1%
- [ ] Draft persistence E2E verde
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Perda de draft em produção:** revert IMEDIATO. RTO: <10min. Investigar persistence layer.
2. **Validação aceitando dado inválido:** revert; corrigir validator; re-PR.
3. **Visual regression:** revert + corrigir.

## Notas Técnicas
- Pattern ADR-0050
- Validators: pure functions `(state) => {ok, errors}`
- Draft: avaliar localStorage vs backend (manter o que já existe)

## Referências
- `docs/reviews/ux-specialist-review.md` §4.1
- `docs/prd/technical-debt-assessment.md` §UX-001
- ADR-0050
- Story 2.1

---

## File List

### Created
- `src/features/gerente-feedback/GerenteFeedback.container.tsx` (26 LOC) — container raiz, route Admin vs Store
- `src/features/gerente-feedback/containers/AdminFeedback.container.tsx` (72 LOC)
- `src/features/gerente-feedback/containers/StoreFeedback.container.tsx` (67 LOC)
- `src/features/gerente-feedback/sections/AdminFeedbackHeader.tsx` (103 LOC)
- `src/features/gerente-feedback/sections/StoreFeedbackHeader.tsx` (118 LOC)
- `src/features/gerente-feedback/sections/FeedbackList.tsx` (135 LOC)
- `src/features/gerente-feedback/sections/WeeklyReportsList.tsx` (137 LOC)
- `src/features/gerente-feedback/sections/FeedbackLoadingSkeleton.tsx` (42 LOC)
- `src/features/gerente-feedback/sections/ScopeBanners.tsx` (31 LOC)
- `src/features/gerente-feedback/modals/AdminFeedbackModal.tsx` (342 LOC — form JSX denso, focus trap inline)
- `src/features/gerente-feedback/modals/StoreFeedbackModal.tsx` (279 LOC — form JSX denso, focus trap inline)
- `src/features/gerente-feedback/hooks/useAdminFeedback.ts` (249 LOC)
- `src/features/gerente-feedback/hooks/useStoreFeedback.ts` (223 LOC)
- `src/features/gerente-feedback/components/FeedbackErrorBoundary.tsx` (48 LOC)
- `src/features/gerente-feedback/lib/helpers.ts` (61 LOC)

### Modified
- `src/pages/GerenteFeedback.tsx` (854 → 6 LOC) — thin re-export

## Change Log

- 2026-05-18 | @sm (River) | Story criada — UX-001 Sprint 2
- 2026-05-18 | @po (Pax) | Status: Draft → Ready | Validation: GO (9/10) | Sprint 2 critical-path: pass
- 2026-05-20 | @dev (Dex) | Status: Ready → InReview | Decomposição ADR-0050 aplicada: page 854 LOC → re-export 6 LOC + 15 módulos em `src/features/gerente-feedback/` | Container raiz 26 LOC, sub-containers Admin/Store ambos <80 LOC | Focus traps Story 3.12 preservados nos modais (useFocusTrap + Escape handler migrados para `AdminFeedbackModal`/`StoreFeedbackModal`) | typecheck OK + build OK (12.48s, GerenteFeedback chunk 81.51 KB)

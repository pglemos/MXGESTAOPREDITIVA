# Story 3.12 — Focus traps em modals (WCAG 2.1 AA)

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 3
**Prioridade:** P2
**Severidade do débito:** Alta
**Débito relacionado:** **UX-024** (focus management, `docs/reviews/ux-specialist-review.md` §4.24)
**Esforço estimado:** 8h (range 6-10h)
**Owner sugerido:** @dev (FE)
**RACI:** R=@dev, A=Tech Lead, C=@ux-design-expert, I=stakeholders
**Created:** 2026-05-19
**Created by:** @sm (River)

---

## Problem Statement
Modais e drawers no app **não implementam focus trap consistente** (per `ux-specialist-review.md` §4.24). Tab escapa do modal para conteúdo de fundo, escape key inconsistente, foco retorna a lugar errado ao fechar. Viola WCAG 2.1 AA §2.4.3 (Focus Order) e §2.1.2 (No Keyboard Trap — inverso aqui: precisa do trap intencional).

## Business Value
Compliance WCAG 2.1 AA em fluxos críticos. Usuários de teclado/leitor de tela ganham experiência consistente. Reduz risco legal (LGPD/acessibilidade) e melhora score Lighthouse.

## Acceptance Criteria
1. **AC1 (focus trap ativo):** Given modal aberto, When usuário pressiona Tab/Shift+Tab, Then foco circula **apenas dentro do modal**.
2. **AC2 (initial focus):** Given modal abre, When montagem completa, Then foco vai para elemento focável apropriado (primeiro input ou close button).
3. **AC3 (restore focus):** Given modal fecha, When unmounted, Then foco retorna ao **elemento que abriu** o modal.
4. **AC4 (escape closes):** Given modal aberto, When usuário pressiona Escape, Then modal fecha (a menos que modal seja crítico/confirm).
5. **AC5 (axe-core):** Given testes axe-core nos modais principais, When rodam, Then **0 violations** WCAG 2.1 AA.

## Scope IN
- Audit dos modais existentes (Dialog, AlertDialog, Sheet/Drawer, Popover quando modal)
- Implementar focus trap via Radix (`Dialog` já tem trap nativo se usado corretamente) ou `focus-trap-react`
- Garantir initial focus + restore focus
- Escape key handling consistente
- Testes axe-core nos modais principais
- Doc curto em `docs/contributing/a11y.md` (focus management section)

## Scope OUT
- ❌ Audit a11y completo (futura story)
- ❌ Screen reader manual testing (futura)
- ❌ Migrar TODOS modais para Radix Dialog (só os críticos nesta story)
- ❌ Skip links (futura)

## Tasks
- [ ] Audit dos modais (1h)
- [ ] Identificar modais sem trap (1h)
- [ ] Implementar trap via Radix Dialog (3h)
- [ ] Initial focus + restore focus (1h)
- [ ] Escape key handling consistente (0.5h)
- [ ] Testes axe-core nos modais principais (1h)
- [ ] Doc a11y (0.5h)
- [ ] CodeRabbit review
- [ ] @qa gate

## Dependências
**Bloqueada por:** Story 3.11 (lint a11y antes de fix runtime)
**Bloqueia:** Stories futuras de a11y compliance

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Escape fecha modal de confirmação destrutiva | Média | Alto | Modal de confirmação: Escape DESABILITADO + warning |
| Focus restore quebrado em deep modal | Média | Médio | Stack de previous focus em context |
| Conflito com tooltips/popovers aninhados | Média | Médio | Z-index e portal hierarchy revisados |
| Tests axe-core flaky | Baixa | Baixo | Aguardar `findByRole` antes do axe |

## Testes Requeridos
- [ ] E2E keyboard-only: abrir modal, Tab circula, Escape fecha, foco retorna
- [ ] axe-core: 0 violations em Dialog, AlertDialog, Sheet
- [ ] Unit: hook `useRestoreFocus` testado

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] axe-core verde em modais principais
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Focus trap quebra modal específico:** revert trap nesse modal; tracking issue. RTO: <30min.
2. **Escape causa data loss:** desabilitar Escape em modais de form não-salvo; toast "use cancelar".

## Notas Técnicas
Radix Dialog já tem focus trap embutido — auditar uso correto antes de adicionar `focus-trap-react`. Maioria dos casos é "Dialog usado errado", não "falta de lib".

## Referências
- `docs/reviews/ux-specialist-review.md` §4.24 (UX-024)
- WCAG 2.1 AA §2.4.3, §3.2.1
- Radix Dialog docs

---

## Change Log
- 2026-05-19 | @sm (River) | Story criada — Sprint 3 UX-024
- 2026-05-19 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 3 critical-path: pass
- 2026-05-19 | @dev (Dex) | Status: Ready → InReview | Hook `useFocusTrap` aplicado em 7 modais custom + docs + 4 testes unitários (bun) | typecheck OK | build OK

## File List
**Criados:**
- `src/hooks/useFocusTrap.test.tsx` — 4 cenários (foco inicial, ciclo Tab, Shift+Tab, inativo)
- `docs/dev/accessibility-modals.md` — guia WCAG 2.1 AA + checklist + inventário

**Modificados (focus trap aplicado / refs ligadas):**
- `src/hooks/useFocusTrap.ts` (já existente — reutilizado)
- `src/features/auth/components/ForcePasswordChange.tsx`
- `src/features/equipe/components/UserCreationModal.tsx`
- `src/pages/GerenteFeedback.tsx` (2 dialogs: admin + loja)
- `src/pages/Lojas.tsx` (criar loja)
- `src/features/lojas/components/StoreTeamPanel.tsx` (alertdialog confirmação + edição de membro)

**Modais via Radix Dialog (sem mudança — já trapam foco nativamente):**
- `src/components/organisms/Modal.tsx` e dependentes (`CreateStoreModal`, `EditUserModal`, `StoreEditModal`)
- `src/features/ranking/components/SellerProfileModal.tsx` (já tinha trap aplicado)
- `src/components/Layout.tsx` (menu mobile — já tinha trap aplicado)

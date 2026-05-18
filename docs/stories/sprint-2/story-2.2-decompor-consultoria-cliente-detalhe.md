# Story 2.2 — Decompor `ConsultoriaClienteDetalhe` (~1200 LOC)

**Status:** Ready
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 2
**Prioridade:** P1
**Severidade do débito:** Alta
**Débito relacionado:** **UX-001** (pages monolíticas, `docs/reviews/ux-specialist-review.md` §4.1)
**Esforço estimado:** 14h (range 12-16h)
**Owner sugerido:** @dev (FE) + @ux-design-expert (design review)
**RACI:** R=@dev, A=Tech Lead, C=@ux-design-expert, I=stakeholders
**Created:** 2026-05-18
**Created by:** @sm (River)

---

## Problem Statement
`src/pages/ConsultoriaClienteDetalhe.tsx` tem **~1200 LOC** (per `ux-specialist-review.md` §4.1) — segunda maior page consultoria. Mistura tabs, modais, fetching de PMR + visitas + planos, lógica de permissões inline. Mesmos sintomas de UX-001: re-renders globais, PR review impraticável, onboarding lento.

## Business Value
Reduz risco em uma das pages MAIS sensíveis ao negócio (cliente consultoria — fluxo core). Habilita ownership clara de cada tab por times distintos no futuro. Aplica pattern validado em Story 2.1.

## Acceptance Criteria
1. **AC1 (container slim):** Given decomposição, When container medido, Then **<200 LOC**, contém apenas: params, role guard, layout dos tabs.
2. **AC2 (estrutura features/):** Given pattern Story 2.1, When `src/features/consultoria-cliente-detalhe/` existe, Then segue convenção `sections/hooks/components/index.ts`.
3. **AC3 (visual regression):** Given snapshots Playwright pré, When pós-refactor, Then diff <1% em viewports 375px + 1280px nos 3 estados principais (sem dados, com dados, erro).
4. **AC4 (error boundary):** Given ErrorBoundary por tab, When um tab quebra, Then outros tabs e header continuam funcionais.
5. **AC5 (RBAC preservado):** Given regras de role visíveis (admin MX vs consultor vs cliente), When refactor concluído, Then matriz de visibilidade idêntica (cobertura por test).

## Scope IN
- Criar `src/features/consultoria-cliente-detalhe/{sections,hooks,components}`
- Extrair tabs (Overview, PMR, Visitas, Planos, Insights, etc.) cada em arquivo próprio
- Extrair hooks de fetching por tab
- Preservar RBAC inline → centralizar em `useConsultoriaCanAccess(tab)`
- ErrorBoundary por tab
- Playwright snapshots em 3 estados

## Scope OUT
- ❌ Mudança de UX/design
- ❌ Refactor das RPCs/queries
- ❌ Alteração de permissões/role matrix
- ❌ Migração de modais para route-based

## Tasks
- [ ] Snapshots baseline Playwright (1h)
- [ ] Mapear tabs e dependências (1h)
- [ ] Criar estrutura `features/consultoria-cliente-detalhe/` (0.5h)
- [ ] Extrair tab Overview + hook (1.5h)
- [ ] Extrair tab PMR + hook (2h)
- [ ] Extrair tab Visitas + hook (1.5h)
- [ ] Extrair tab Planos + hook (1.5h)
- [ ] Extrair tabs restantes (1.5h)
- [ ] Centralizar RBAC em hook (1h)
- [ ] ErrorBoundary por tab (0.5h)
- [ ] Visual regression + manual review (1h)
- [ ] Code review + @qa gate

## Dependências
**Bloqueada por:**
- Story 2.1 (pattern de decomposição validado + ADR-0050)
- Sprint 0 done (regressão visual + RLS matrix)

**Bloqueia:** Nenhuma diretamente

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| RBAC drift entre tabs durante refactor | Média | Alto | Test matriz cobrindo 3 roles × N tabs ANTES do PR merge |
| Modais perdem state ao re-renderizar parent | Média | Médio | Lift modal state para container; testar abrir/fechar em cada tab |
| Visual regression em sub-tabs (cobertura snapshot insuficiente) | Média | Médio | Snapshot cada tab ativo (não só primeiro) |
| Quebra de deep-link `?tab=pmr` | Baixa | Alto | E2E smoke deep-link por tab |

## Testes Requeridos
- [ ] Playwright visual: 375px + 1280px × 3 estados
- [ ] E2E smoke: deep-link por tab, troca de tab, role guard (3 roles)
- [ ] Unit: hook `useConsultoriaCanAccess`
- [ ] Manual: @ux-design-expert review em staging

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Container <200 LOC
- [ ] Visual diff <1%
- [ ] RBAC matriz teste verde (3 roles)
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **RBAC bug em produção:** revert imediato. RTO: <15min.
2. **Visual regression >1%:** revert; corrigir; re-PR.
3. **Bug em tab específico:** revert + investigar; opção: re-merge com tab afetado revertido ao monolito enquanto resto fica decomposto (não recomendado — manter atômico).

## Notas Técnicas
- Aplica pattern Story 2.1 (ADR-0050)
- RBAC: `useConsultoriaCanAccess(tab: string): boolean` em `hooks/`
- Tabs como rotas filhas opcional (avaliar se vale o custo)

## Referências
- `docs/reviews/ux-specialist-review.md` §4.1
- `docs/prd/technical-debt-assessment.md` §UX-001
- ADR-0050 (criado em Story 2.1)
- Story 2.1 (piloto)

---

## Change Log

- 2026-05-18 | @sm (River) | Story criada — UX-001 Sprint 2
- 2026-05-18 | @po (Pax) | Status: Draft → Ready | Validation: GO (9/10) | Sprint 2 critical-path: pass

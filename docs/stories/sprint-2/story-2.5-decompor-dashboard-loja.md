# Story 2.5 — Decompor `DashboardLoja` (1409 LOC) — depende de Story 2.8

**Status:** Ready
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 2
**Prioridade:** P1
**Severidade do débito:** Alta
**Débito relacionado:** **UX-001** (pages monolíticas, `docs/reviews/ux-specialist-review.md` §4.1)
**Esforço estimado:** 16h (range 14-18h)
**Owner sugerido:** @dev (FE) + @ux-design-expert (design review)
**RACI:** R=@dev, A=Tech Lead, C=@ux-design-expert, I=stakeholders
**Created:** 2026-05-18
**Created by:** @sm (River)

---

## Problem Statement
`src/pages/DashboardLoja.tsx` tem **1409 LOC** (per `ux-specialist-review.md` §4.1). Consome `useTeam` (god-hook 625 LOC, débito UX-002). Decomposição da page sem split prévio do hook **multiplica complexidade** — sections individuais herdariam acoplamento ao hook gigante.

## Business Value
DashboardLoja é landing pós-login do gerente — page mais visitada. Decompor após `useTeam` split (Story 2.8) entrega: (a) container slim, (b) cada section consome sub-hook focado, (c) onboarding 70% mais rápido para essa área.

## Acceptance Criteria
1. **AC1 (container slim):** Container `<200 LOC`.
2. **AC2 (estrutura features/):** `src/features/dashboard-loja/{sections,hooks,components}` segue ADR-0050.
3. **AC3 (sub-hooks `useTeam`):** Sections consomem **apenas sub-hooks** introduzidos em Story 2.8 (`useTeamMembers`, `useTeamMetrics`, etc.) — não importar `useTeam` original em sections novas.
4. **AC4 (visual regression):** Snapshots Playwright diff <1% em 375px + 1280px com dados reais de staging.
5. **AC5 (realtime preservado):** Given subscriptions realtime existentes (se houver), When refactor concluído, Then atualizações chegam ao componente correto em <2s (test manual + log).

## Scope IN
- Criar `src/features/dashboard-loja/{sections,hooks,components}`
- Extrair sections: TeamSummary, KPIsLoja, AgendaResumida, FeedbackPendentes, etc.
- Cada section consome sub-hook de Story 2.8 (não god-hook)
- ErrorBoundary por section
- Playwright snapshots
- Test realtime (manual + log)

## Scope OUT
- ❌ Refactor de realtime layer
- ❌ Mudar quais dados o dashboard mostra
- ❌ Mobile redesign
- ❌ Split adicional de hooks fora do escopo Story 2.8

## Tasks
- [ ] Snapshots baseline Playwright (1h)
- [ ] Confirmar Story 2.8 (`useTeam` split) merged (0.5h)
- [ ] Mapear sections + sub-hooks consumidos (1h)
- [ ] Criar estrutura `features/dashboard-loja/` (0.5h)
- [ ] Extrair TeamSummary → `useTeamMembers` (2h)
- [ ] Extrair KPIsLoja → `useTeamMetrics` (2h)
- [ ] Extrair AgendaResumida (2h)
- [ ] Extrair FeedbackPendentes (1.5h)
- [ ] Extrair sections restantes (2h)
- [ ] ErrorBoundary + realtime test (1h)
- [ ] Visual regression + manual review (1h)
- [ ] Code review + @qa gate

## Dependências
**Bloqueada por:**
- **Story 2.8 (useTeam split) — HARD BLOCK**
- Story 2.1 (pattern validado)
- Sprint 0 done

**Bloqueia:** Nenhuma diretamente

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Story 2.8 atrasa → cascata | Alta | Alto | Buffer 1 semana entre 2.8 merged e 2.5 start; checkpoint @sm semanal |
| Realtime subscription duplicada por section | Média | Médio | Single subscription no container → distribui via context; documentar |
| Page mais visitada = qualquer regressão = alto blast radius | Média | **Alto** | Canary deploy: 10% gerentes por 24h antes de 100% |
| Visual diff em widgets dinâmicos (data real) | Alta | Baixo | Snapshot com data fixa via mock OU threshold maior em regions específicas |

## Testes Requeridos
- [ ] Playwright visual: 375px + 1280px (data fixa)
- [ ] E2E: navegação, abrir modais, realtime update visível
- [ ] Unit: sections com mock dos sub-hooks
- [ ] Manual: 1 gerente real em staging por 30min
- [ ] Canary 10% × 24h

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Container <200 LOC
- [ ] Visual diff <1%
- [ ] Realtime test verde
- [ ] Story 2.8 merged ANTES desta
- [ ] Canary 10% × 24h sem incidente
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Regressão dashboard gerente:** revert IMEDIATO (alta visibilidade). RTO: <10min.
2. **Realtime quebrado:** revert; investigar subscription wiring.
3. **Canary detecta degradação:** abortar rollout; revert; root cause.

## Notas Técnicas
- Pattern ADR-0050
- Realtime: subscription única no container, fan-out via context ou prop drilling controlado
- Confirmar com @data-engineer canais Supabase Realtime usados

## Referências
- `docs/reviews/ux-specialist-review.md` §4.1 + §6 (ordem mandatória)
- `docs/prd/technical-debt-assessment.md` §UX-001 e §UX-002
- ADR-0050
- Story 2.1, Story 2.8

---

## Change Log

- 2026-05-18 | @sm (River) | Story criada — UX-001 Sprint 2 (depende de 2.8)
- 2026-05-18 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 2 critical-path: pass (hard-block 2.8 reconhecido)

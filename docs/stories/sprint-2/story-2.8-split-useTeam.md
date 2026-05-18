# Story 2.8 — Split `useTeam` (625 LOC)

**Status:** Draft
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 2
**Prioridade:** P1
**Severidade do débito:** Alta
**Débito relacionado:** **UX-002** (god-hooks, `docs/reviews/ux-specialist-review.md` §4.2)
**Esforço estimado:** 14h (range 12-16h)
**Owner sugerido:** @dev (FE) + @architect (design review)
**RACI:** R=@dev, A=Tech Lead, C=@architect, I=@ux-design-expert
**Created:** 2026-05-18
**Created by:** @sm (River)

---

## Problem Statement
`src/hooks/useTeam.ts` tem **625 LOC** (per `ux-specialist-review.md` §4.2). Consumido por `DashboardLoja` (1409 LOC) e outras pages. Combina: membros, vínculos, métricas agregadas, ativação/desativação, convites. Re-render global em qualquer alteração; bloqueia Story 2.5.

## Business Value
Pattern já validado em Story 2.7. Split habilita Story 2.5 (DashboardLoja). Reduz re-renders em todos consumers do time.

## Acceptance Criteria
1. **AC1 (sub-hooks):** Given split, When implementado, Then sub-hooks com responsabilidade única: `useTeamMembers` (lista), `useTeamMetrics` (agregados), `useTeamMembership` (vínculos + ativação), `useTeamInvites` (convites).
2. **AC2 (shim original):** Given `useTeam`, When invocado, Then re-exporta combinação dos sub-hooks com **mesma API pública**.
3. **AC3 (1 consumer migrado):** Given lista de consumers, When PR mergeado, Then mínimo 1 consumer (não-DashboardLoja) migrado para sub-hooks como prova.
4. **AC4 (delete plan):** Given `docs/migrations/usage-useTeam.md`, When publicado, Then lista todos consumers + status migration + plan delete.
5. **AC5 (no regression):** Given consumers no shim, When usuário interage, Then comportamento idêntico (E2E DashboardLoja read-path + manage team).

## Scope IN
- Sub-hooks em `src/hooks/team/{useTeamMembers,useTeamMetrics,useTeamMembership,useTeamInvites}.ts`
- Refatorar `useTeam.ts` para shim
- Migrar 1 consumer não-crítico como prova
- Unit tests por sub-hook
- `docs/migrations/usage-useTeam.md`

## Scope OUT
- ❌ Migrar TODOS consumers
- ❌ Deletar `useTeam` original
- ❌ Mudar API pública
- ❌ Refactor queries / RLS

## Tasks
- [ ] Mapear consumers de `useTeam` (1h)
- [ ] Design 4 sub-hooks — aplicar ADR-0051 (1.5h)
- [ ] Implementar `useTeamMembers` + tests (2h)
- [ ] Implementar `useTeamMetrics` + tests (2h)
- [ ] Implementar `useTeamMembership` + tests (2.5h)
- [ ] Implementar `useTeamInvites` + tests (1.5h)
- [ ] Shim + diff TS (1h)
- [ ] Migrar 1 consumer (prova) (1h)
- [ ] Docs `docs/migrations/usage-useTeam.md` (0.5h)
- [ ] E2E smoke (1h)
- [ ] Code review + @qa gate

## Dependências
**Bloqueada por:**
- **Story 2.7 (PILOTO god-hook + ADR-0051) — HARD BLOCK**
- Sprint 0 done

**Bloqueia:**
- **Story 2.5 (DashboardLoja) — HARD BLOCK**

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Membership state inconsistente entre sub-hooks | Média | Alto | Membership owna invalidate de Members; documentar |
| Convites e membership concorrem | Baixa | Médio | Eventos via callback explícito |
| Shim API diverge | Média | Alto | TS strict diff; build CI verde |
| Métricas incorretas pós-split | Baixa | Médio | Test snapshot de métricas com fixture conhecida |

## Testes Requeridos
- [ ] Unit por sub-hook
- [ ] Integration shim API
- [ ] E2E DashboardLoja read-path no shim
- [ ] E2E manage team (ativar/desativar membro)
- [ ] Bundle size diff <5%

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] 4 sub-hooks + unit tests
- [ ] Shim API diff vazio
- [ ] 1 consumer migrado
- [ ] Docs migration publicada
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Shim quebra DashboardLoja:** revert IMEDIATO. RTO: <10min.
2. **Membership state bug:** revert; corrigir; re-PR.

## Notas Técnicas
- Pattern ADR-0051 (Story 2.7)
- `useTeamMembership` owna `useTeamMembers.invalidate()` para coordenar

## Referências
- `docs/reviews/ux-specialist-review.md` §4.2 + §6
- `docs/prd/technical-debt-assessment.md` §UX-002
- ADR-0051
- Story 2.7

---

## Change Log

- 2026-05-18 | @sm (River) | Story criada — UX-002 Sprint 2

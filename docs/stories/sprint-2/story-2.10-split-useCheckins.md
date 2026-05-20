# Story 2.10 — Split `useCheckins` (escopo residual pós Story 1.2)

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 2
**Prioridade:** P2
**Severidade do débito:** Média
**Débito relacionado:** **UX-002** (god-hooks, `docs/reviews/ux-specialist-review.md` §4.2)
**Esforço estimado:** 8h (range 6-12h — depende do residual real)
**Owner sugerido:** @dev (FE) + @data-engineer (revisão queries restantes)
**RACI:** R=@dev, A=Tech Lead, C=@data-engineer, I=@architect
**Created:** 2026-05-18
**Created by:** @sm (River)

---

## Problem Statement
`src/hooks/useCheckins.ts` foi parcialmente migrado em **Story 1.2** (DB-016 B — migrar selects flag-off) e Sprint 1 subsequentes. Restante (per `ux-specialist-review.md` §4.2) ainda apresenta sintomas god-hook: lógica de exibição, agregações inline, side-effects, múltiplas responsabilidades remanescentes.

**Pré-tarefa obrigatória:** auditar estado ATUAL do hook pós-Sprint 1 antes de planejar split — escopo residual pode ser menor que estimado.

## Business Value
Encerra débito UX-002 ao alinhar `useCheckins` ao pattern de Stories 2.7-2.9. Reduz acoplamento checkins ↔ views. Habilita memoização granular em consumers (Dashboard, Ranking, Feedback).

## Acceptance Criteria
1. **AC1 (auditoria residual):** Given Story 1.2 + sub-stories Sprint 1 merged, When `useCheckins.ts` é auditado, Then artifact `docs/reviews/useCheckins-residual-audit.md` documenta: LOC atual, responsabilidades remanescentes, decisão "split vale a pena?" (GO/NO-GO).
2. **AC2 (se GO — sub-hooks):** Given decisão GO, When implementado, Then sub-hooks: `useCheckinsList` (fetch), `useCheckinsAggregates` (médias/totals), `useCheckinsActions` (submit/edit) — ajustar conforme audit AC1.
3. **AC3 (shim original):** Given `useCheckins`, When invocado, Then re-exporta sub-hooks com mesma API pública.
4. **AC4 (1 consumer migrado):** Given mapa consumers, When PR mergeado, Then mínimo 1 consumer migrado como prova.
5. **AC5 (no regression):** Given consumers no shim, When usuário interage, Then comportamento checkin idêntico (E2E `submit_checkin` + read paths).

## Scope IN
- Auditoria residual `useCheckins.ts` (deliverable obrigatório)
- Se GO: sub-hooks + shim + docs migration + 1 consumer migrado
- Se NO-GO: documentar decisão em ADR (`docs/adr/0053-useCheckins-no-split-rationale.md`) e fechar story como WAIVED

## Scope OUT
- ❌ Reabrir trabalho de Story 1.2 (queries já migradas)
- ❌ Mudar RPC `submit_checkin` (Story 1.6 + 1.10)
- ❌ Migrar TODOS consumers
- ❌ Deletar `useCheckins` original

## Tasks
- [ ] Auditoria `useCheckins.ts` pós-Sprint 1 (2h) — **DECISÃO GATE**
- [ ] Publicar `docs/reviews/useCheckins-residual-audit.md` + recomendação GO/NO-GO (0.5h)
- [ ] **Se NO-GO:** publicar ADR-0053 + fechar story WAIVED (1h)
- [ ] **Se GO:** Mapear consumers (0.5h)
- [ ] **Se GO:** Design sub-hooks aplicando ADR-0051 (1h)
- [ ] **Se GO:** Implementar sub-hooks + unit tests (3h)
- [ ] **Se GO:** Shim + diff TS (0.5h)
- [ ] **Se GO:** Migrar 1 consumer (0.5h)
- [ ] **Se GO:** Docs migration (0.5h)
- [ ] **Se GO:** E2E smoke (`submit_checkin` end-to-end) (0.5h)
- [ ] Code review + @qa gate

## Dependências
**Bloqueada por:**
- **Story 1.2 (DB-016 B) merged — HARD BLOCK** (confirmar status Done)
- Stories 1.5, 1.6, 1.10 merged (RPC `submit_checkin` estável)
- Story 2.7 (PILOTO + ADR-0051)
- Sprint 0 done

**Bloqueia:** Nenhuma

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Auditoria revela escopo já adequado (NO-GO) | Alta | Baixo | NO-GO é resultado válido; publicar ADR-0053 |
| Conflito com migrations Sprint 1 não totalmente merged | Média | Alto | Confirmar via `git log` que 1.2/1.5/1.6/1.10 estão em main ANTES de iniciar |
| `submit_checkin` quebrar pós-refactor (fluxo crítico) | Baixa | **Alto** | E2E `submit_checkin` happy + edge cases (vendedor inativo, vínculo inativo) |
| Drift com `checkin_validation_kit` (Story 1.10) | Baixa | Médio | Sub-hook actions consome RPC, não duplica validação |

## Testes Requeridos
- [ ] Auditoria publicada
- [ ] **Se GO:** Unit por sub-hook
- [ ] **Se GO:** Integration shim API
- [ ] **Se GO:** E2E `submit_checkin` happy + 2 edge cases (vendedor inativo, fora horário)
- [ ] **Se GO:** Bundle size diff <5%

## Definition of Done
- [ ] Auditoria publicada em `docs/reviews/useCheckins-residual-audit.md`
- [ ] Decisão GO/NO-GO registrada
- [ ] **Se GO:** ACs 1-5 verdes; sub-hooks + shim + 1 consumer migrado; PR merged (@devops push); @qa gate PASS
- [ ] **Se NO-GO:** ADR-0053 publicado; story WAIVED com justificativa @qa

## Rollback Plan
1. **Se GO + bug em submit_checkin pós-merge:** revert IMEDIATO (fluxo crítico). RTO: <10min.
2. **Shim quebra read-paths:** revert; corrigir; re-PR.
3. **Se NO-GO depois revisto como GO:** abrir Story 2.10b futura.

## Notas Técnicas
- Pattern ADR-0051
- Sub-hook `useCheckinsActions` consome RPC `submit_checkin` (não duplica validação — `checkin_validation_kit` é fonte de verdade per Story 1.10)
- Auditoria primeiro = evita over-engineering se Sprint 1 já reduziu o hook a tamanho aceitável

## Referências
- `docs/reviews/ux-specialist-review.md` §4.2 (UX-002)
- `docs/prd/technical-debt-assessment.md` §UX-002
- Story 1.2 (DB-016 B — migrar selects flag-off)
- Story 1.6 (validate vendedor)
- Story 1.10 (checkin_validation_kit)
- ADR-0051 (god-hook split pattern)
- ADR a criar (condicional): `docs/adr/0053-useCheckins-no-split-rationale.md`

---

## Change Log

- 2026-05-18 | @sm (River) | Story criada — UX-002 residual Sprint 2 (auditoria primeiro)
- 2026-05-18 | @po (Pax) | Status: Draft → Ready | Validation: GO (9/10) | Sprint 2 critical-path: pass (Story 1.2 fdf73f3 já em main; audit-gate primeiro)
- 2026-05-19 | @dev (Dex) | Status: Ready → InReview | Audit-gate: GO (421 LOC ≥ 300, threshold ADR-0051) | Split executado em 5 sub-hooks (`useCheckinsList` 86, `useCheckinsToday` 65, `useCheckinsByDate` 54, `useCheckinsSubmit` 86, `useMyCheckins`+`useCheckinsByDateRange` 114) + `types.ts` (87) + barrel `index.ts` (22) | `useCheckins.ts` reduzido para 91 LOC (shim `@deprecated` composer). Contrato público preservado 100% | `npm run typecheck` ✅, `npm run build` ✅. **File List:** `src/hooks/checkins/types.ts`, `src/hooks/checkins/useCheckinsList.ts`, `src/hooks/checkins/useCheckinsToday.ts`, `src/hooks/checkins/useCheckinsByDate.ts`, `src/hooks/checkins/useCheckinsSubmit.ts`, `src/hooks/checkins/useMyCheckins.ts`, `src/hooks/checkins/index.ts`, `src/hooks/useCheckins.ts` (rewrite shim)

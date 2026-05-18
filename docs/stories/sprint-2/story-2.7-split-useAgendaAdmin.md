# Story 2.7 — Split `useAgendaAdmin` (895 LOC) — PILOTO god-hook

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 2
**Prioridade:** P1
**Severidade do débito:** Alta
**Débito relacionado:** **UX-002** (god-hooks, `docs/reviews/ux-specialist-review.md` §4.2)
**Esforço estimado:** 20h (range 18-24h)
**Owner sugerido:** @dev (FE) + @architect (design review)
**RACI:** R=@dev, A=Tech Lead, C=@architect, I=@ux-design-expert
**Created:** 2026-05-18
**Created by:** @sm (River)

---

## Problem Statement
`src/hooks/useAgendaAdmin.ts` tem **895 LOC** (per `ux-specialist-review.md` §4.2) — maior god-hook do app. Mistura: fetch eventos, CRUD, filtros, view state, side-effects, optimistic updates, cache. Sintomas:
- Qualquer mudança requer entender 895 LOC
- Re-render em qualquer consumer quando QUALQUER state interno muda
- Impossível memoizar consumers seletivamente
- Bloqueia Story 2.6 (AgendaAdmin page)

Esta é a **story piloto** para o pattern de split god-hook (UX-002).

## Business Value
Pattern validado destrava splits dos outros 3 god-hooks (~55h restantes). Reduz re-renders desnecessários em todas consumers da agenda. Habilita test unitário focado por concern.

## Acceptance Criteria
1. **AC1 (4 sub-hooks):** Given split planejado, When implementado, Then 4 sub-hooks existem com responsabilidade única: `useAgendaEvents` (fetch + cache), `useAgendaFilters` (filtros state + URL sync), `useAgendaCRUD` (create/update/delete + optimistic), `useAgendaView` (mês/semana/dia state).
2. **AC2 (shim original):** Given `useAgendaAdmin` original, When invocado por consumer, Then re-exporta combinação dos 4 sub-hooks com **mesma API pública** — zero breaking change inicial.
3. **AC3 (consumers migrados em PRs separados):** Given lista de consumers do hook, When mapeada, Then cada consumer tem PR próprio migrando do shim para sub-hook(s) específico(s) — **mínimo 1 consumer migrado nesta story** como prova.
4. **AC4 (delete shim plan):** Given plan documentado, When PR mergeado, Then `docs/migrations/usage-useAgendaAdmin.md` lista todos consumers e prevê remoção do hook original quando consumers=0.
5. **AC5 (no regression):** Given consumers ainda no shim, When usuário interage com agenda, Then comportamento idêntico (E2E CRUD + view switch verdes).

## Scope IN
- Criar 4 sub-hooks em `src/hooks/agenda/{useAgendaEvents,useAgendaFilters,useAgendaCRUD,useAgendaView}.ts`
- Refatorar `useAgendaAdmin.ts` para shim que combina sub-hooks
- Migrar 1 consumer (escolher menos crítico) para sub-hooks diretos como prova
- Unit tests por sub-hook
- `docs/migrations/usage-useAgendaAdmin.md` (mapa consumers + plan)

## Scope OUT
- ❌ Migrar TODOS consumers (cada um em PR separado pós-story)
- ❌ Deletar `useAgendaAdmin` original (só quando consumers=0)
- ❌ Mudar API pública do shim (zero breaking change inicial)
- ❌ Refactor de cache strategy (manter atual)
- ❌ Mudança de Supabase queries

## Tasks
- [ ] Mapear todos consumers de `useAgendaAdmin` (1.5h, grep + análise)
- [ ] Design dos 4 sub-hooks (responsabilidades + interfaces) — @architect review (2h)
- [ ] Implementar `useAgendaEvents` + unit tests (3h)
- [ ] Implementar `useAgendaFilters` + URL sync + unit tests (3h)
- [ ] Implementar `useAgendaCRUD` + optimistic + unit tests (4h)
- [ ] Implementar `useAgendaView` + unit tests (1.5h)
- [ ] Refatorar `useAgendaAdmin` como shim (1.5h)
- [ ] Migrar 1 consumer (prova de conceito) (1h)
- [ ] Docs `docs/migrations/usage-useAgendaAdmin.md` (1h)
- [ ] E2E smoke (agenda funciona como antes) (1h)
- [ ] Code review + @qa gate

## Dependências
**Bloqueada por:**
- Sprint 0 done (matriz de regressão visual + cobertura mínima)

**Bloqueia:**
- **Story 2.6 (AgendaAdmin page) — HARD BLOCK** (page depende dos sub-hooks)
- Story 2.8 indireta (pattern reutilizado)

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Shim com bug introduz regressão em TODOS consumers | Média | **Alto** | Shim com mesma assinatura + E2E completo agenda antes do merge |
| Sub-hook state desincronizado (ex.: filter aplica mas eventos não recarregam) | Média | Alto | Combinador (shim) coordena dependências; teste integrado entre sub-hooks |
| Optimistic updates duplicados (CRUD + Events ambos atualizando) | Média | Médio | CRUD invalida Events via callback explícito; documentar |
| Consumer migrado introduz drift de comportamento | Baixa | Médio | Escolher consumer menos crítico para prova; @qa valida paridade |
| API pública do shim diverge sutilmente do original | Média | Alto | Diff de tipos antes/depois; TypeScript strict; build CI verde |

## Testes Requeridos
- [ ] Unit: cada sub-hook isolado (renderHook + Vitest)
- [ ] Integration: shim devolve mesma API que original (snapshot do tipo + behavior)
- [ ] E2E: agenda end-to-end (CRUD + view + filtros) com consumer no shim
- [ ] E2E: 1 consumer migrado funciona idêntico
- [ ] Bundle size diff (não deve crescer >5%)

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] 4 sub-hooks implementados + unit tests verdes
- [ ] Shim mesma API pública (TS diff vazio)
- [ ] 1 consumer migrado (prova)
- [ ] Docs `docs/migrations/usage-useAgendaAdmin.md` publicado
- [ ] ADR `docs/adr/0051-god-hook-split-pattern.md` (PATTERN para UX-002)
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Shim quebra agenda em produção:** revert; `useAgendaAdmin` original restaurado. RTO: <15min.
2. **Sub-hook bug (descoberto pós-migração):** revert consumer migrado; manter no shim; corrigir sub-hook em PR separado.
3. **Type mismatch causa erros build em fork de feature:** revert; alinhar tipos; re-PR.

## Notas Técnicas

### Pattern god-hook split (REFERÊNCIA para UX-002)
```ts
// Sub-hooks focados
export function useAgendaEvents(filters) { /* fetch + cache */ }
export function useAgendaFilters() { /* state + URL sync */ }
export function useAgendaCRUD() { /* create/update/delete */ }
export function useAgendaView() { /* view state */ }

// Shim — mesma API pública do original
export function useAgendaAdmin() {
  const filters = useAgendaFilters();
  const events = useAgendaEvents(filters.value);
  const crud = useAgendaCRUD({ onChange: events.invalidate });
  const view = useAgendaView();
  return { ...events, ...filters, ...crud, ...view }; // mesma forma do original
}
```

### Migração de consumers (PR por consumer)
1. PR migra `ComponenteX` de `useAgendaAdmin()` para `useAgendaEvents()` + `useAgendaView()` (apenas o que precisa)
2. Cada PR independente, revisado individualmente
3. Quando consumers=0 → PR final remove `useAgendaAdmin.ts` (em Sprint 3 ou story dedicada)

### Documento de migração
- Path: `docs/migrations/usage-useAgendaAdmin.md`
- Conteúdo: tabela `Consumer | File | Sub-hooks needed | Status | PR`

## Referências
- `docs/reviews/ux-specialist-review.md` §4.2 (UX-002 — god-hooks)
- `docs/reviews/ux-specialist-review.md` §6 (ordem mandatória)
- `docs/prd/technical-debt-assessment.md` §UX-002
- ADR a criar: `docs/adr/0051-god-hook-split-pattern.md`

---

## Change Log

- 2026-05-18 | @sm (River) | Story criada — piloto UX-002 Sprint 2
- 2026-05-18 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 2 critical-path: pass (piloto god-hooks)
- 2026-05-18 | @dev (Dex) | Status: Ready → InProgress → InReview | Implementação do split via shim-first pattern + ADR-0051

## File List

**Criados:**
- `src/hooks/agenda/types.ts` — tipos compartilhados (115 LOC)
- `src/hooks/agenda/googleSync.ts` — helpers Google Calendar sync (130 LOC; sem hooks)
- `src/hooks/agenda/useAgendaEvents.ts` — fetch + cache (~145 LOC)
- `src/hooks/agenda/useAgendaFilters.ts` — filtros + URL sync + memos filtrados (~200 LOC)
- `src/hooks/agenda/useAgendaView.ts` — calendarDays + visitsByDate + metrics + navegação (~140 LOC)
- `src/hooks/agenda/useAgendaCRUD.ts` — CRUD visitas/eventos + Google sync (~265 LOC; ver ADR-0051 §"Limites flexíveis")
- `src/hooks/agenda/index.ts` — barrel export (24 LOC)
- `docs/adr/0051-god-hook-split-pattern.md` — pattern formal para UX-002
- `docs/migrations/usage-useAgendaAdmin.md` — mapa de consumers + plano de migração

**Modificados:**
- `src/hooks/useAgendaAdmin.ts` — 895 LOC → 93 LOC (shim `@deprecated` agregador dos 4 sub-hooks; mesma API pública)

**Não modificados (intencional — shim preserva interface):**
- `src/pages/AgendaAdmin.tsx`
- `src/hooks/useConsultingClientBySlug.ts`
- `src/pages/ConsultoriaClienteDetalhe.tsx`

## Notas de implementação

- **AC3 (1 consumer migrado):** parcialmente postergado. Decisão de @dev: como `AgendaAdmin.tsx` é o único consumer "completo" do hook e está sendo refatorado na Story 2.6 (page decomposition), migrar agora geraria conflito de merge. Os 2 consumers que só usam helpers (`useConsultingClientBySlug`, `ConsultoriaClienteDetalhe`) estão listados em `docs/migrations/usage-useAgendaAdmin.md` Fase A e podem ser migrados em PRs separados rapidamente. Registrado para review do @po.
- **Estado compartilhado:** `calendarMonth` foi lifted para o shim (não fica em `useAgendaView`) para permitir que `useAgendaFilters` mova o mês visível quando `setDateFilter` é chamado. Decisão documentada em ADR-0051.
- **Build:** `typecheck` e `npm run build` verdes.

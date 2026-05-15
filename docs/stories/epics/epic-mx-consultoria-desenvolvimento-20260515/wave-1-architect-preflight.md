# Wave 1 - Architect Preflight

Status: completed by AIOX orchestration preflight  
Agent: aiox-architect  
Date: 2026-05-15

## Objective

Prepare the technical direction for Wave 1 before implementation:

- CONS-13: Visit 8 for monthly follow-up.
- CONS-14: Sequential PMR visit execution.
- CONS-15: Visit analysis period.
- CONS-16: Executive report and real-time summary.

## Main Finding

The current PMR implementation is intentionally canonicalized as visits 1 to 7. This is not accidental. Multiple files and migrations enforce this rule after the historical removal of `pmr_9`.

Therefore, Visit 8 must not revive `pmr_9` or change the core PMR cycle semantics without a deliberate product decision.

## Architecture Decision Recommendation

Use this model:

- PMR main cycle remains visits 1 to 7.
- Visit 8 is a monthly follow-up/accompaniment visit attached to the same `pmr_7` program.
- Legacy completion remains limited to visits 1 to 7.
- Cycle progress and completion calculations keep using visits 1 to 7.
- Agenda, execution route, and methodology template allow visit 8 as schedulable and executable.

Recommended constants:

```ts
export const PMR_MAIN_VISITS_MAX = 7;
export const PMR_FOLLOW_UP_VISIT = 8;

export function isPmrMainCycleVisitNumber(visitNumber: number) {
  return Number.isInteger(visitNumber) && visitNumber >= 1 && visitNumber <= PMR_MAIN_VISITS_MAX;
}

export function isPmrSchedulableVisitNumber(visitNumber: number) {
  return isPmrMainCycleVisitNumber(visitNumber) || visitNumber === PMR_FOLLOW_UP_VISIT;
}
```

This avoids spreading `<= 7` and lets each surface choose the correct rule.

## Code Impact Map

Known current blockers for Visit 8:

- `src/hooks/useConsultingClientBySlug.ts`
  - filters visits with `visit_number >= 1 && visit_number <= 7`;
  - rejects upsert above 7 with message "O PMR trabalha apenas com visitas de 1 a 7.";
  - should allow schedulable visit 8 for creation/execution, but keep main-cycle progress at 1 to 7.
- `src/hooks/useAgendaAdmin.ts`
  - `validPmrVisitNumber` only accepts 1 to 7;
  - fetch query uses `.gte('visit_number', 1).lte('visit_number', 7)`;
  - create/update reject visit 8;
  - `getNextVisitNumber` caps at 7.
- `src/pages/AgendaAdmin.tsx`
  - validation copy still says visits 1 to 7;
  - visual progress displays `visit_number/7`, which is wrong for follow-up visit 8.
- `src/pages/ConsultoriaVisitaExecucao.tsx`
  - route redirects any visit outside 1 to 7;
  - save validation rejects visit 8;
  - should accept visit 8 and render the follow-up methodology.
- `src/hooks/useConsultingClients.ts`
  - summary queries and methodology mapping assume 1 to 7;
  - keep summary/progress behavior scoped to main-cycle visits unless the screen explicitly needs follow-up.
- `scripts/seed_pmr_methodology.ts`
  - seeds only canonical PMR 7.
- `scripts/import_cronograma_2026_mx.ts`
  - has `PMR_MAX_VISITS` and canonical 1 to 7 validation.
- `src/lib/consultoria/legacy-visit-completion.ts`
  - must remain 1 to 7 because it is the backfill path for legacy PMR completion.
- `supabase/migrations/20260503090000_pmr7_canonical_visit_flow.sql`
  - documents the canonical 1 to 7 decision and deactivates `pmr_9`.
- `supabase/migrations/20260514130000_legacy_pmr_visit_completion.sql`
  - validates legacy completion only from 1 to 7 and should not be changed for Visit 8.

## Implementation Guardrails

- Do not globally replace `7` with `8`.
- Do not change legacy completion behavior.
- Do not re-enable `pmr_9`.
- Add a domain helper for visit-number rules before touching UI and hooks.
- Add regression tests proving:
  - PMR main-cycle progress remains 1 to 7;
  - Visit 8 can be scheduled/opened/saved;
  - legacy completion still rejects visit 8.

## Open Product Decision

W1-D01 should be closed by PO before code:

Should Visit 8 appear as part of the visible PMR sequence or as "Acompanhamento Mensal" outside the numbered cycle?

Architect recommendation: display it as "Acompanhamento Mensal" and avoid `8/7` or `8/8` progress semantics.

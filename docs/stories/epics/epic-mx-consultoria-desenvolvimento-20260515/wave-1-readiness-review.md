# Wave 1 Readiness Review

**Status:** GO for technical preflight, NO-GO for implementation until decisions close  
**Prepared by:** @aiox-master  
**Wave:** 1 - Consultoria PMR pronta para uso  
**Stories:** CONS-13, CONS-14, CONS-15, CONS-16

## Decision

Wave 1 is ready for technical preflight by @architect, @data-engineer, @ux-design-expert and @qa.

Wave 1 is not yet ready for @dev implementation because three technical/product decisions still need explicit closure.

## GO Items

- [x] Stories are created and traceable to the meeting.
- [x] Consultor role normalized as admin/admin master MX.
- [x] Cliente role normalized as lojista/dono.
- [x] Legacy PMR 1-7 protection is documented.
- [x] AI is not required for the MVP report.
- [x] QA test plan exists.
- [x] Handoffs exist for PO, Architect, Data Engineer, UX, Dev and QA.
- [x] YAML and artifact references validated.

## Blocking Decisions Before Code

| ID | Decision | Owner | Recommended option |
|---|---|---|---|
| W1-D01 | Visit 8 strategy | @architect + @po | Add compatible monthly follow-up without breaking PMR 1-7 and legacy completion. |
| W1-D02 | Analysis period persistence | @data-engineer + @architect | Add `analysis_period_start`, `analysis_period_end`, `analysis_period_preset` on visit context. |
| W1-D03 | Executive report structure | @pm + @po | Deterministic section builder with MX standard order. |

## Technical Preflight Tasks

| Task | Owner | Output |
|---|---|---|
| Confirm all current 1..7 limits in code | @architect | Impact note for CONS-13 |
| Confirm migration/RLS approach for visit 8 and period | @data-engineer | Schema/RLS decision |
| Confirm visit execution layout sequence | @ux-design-expert | UI flow note |
| Confirm QA gate and test data | @qa | QA gate note |

## Allowed Next Actions

- @architect may inspect code and produce a technical plan.
- @data-engineer may inspect schema/migrations and produce a data plan.
- @ux-design-expert may inspect current visit UI and produce a UI plan.
- @qa may refine the Wave 1 QA plan.

## Not Allowed Yet

- No production code edits for CONS-13 to CONS-16.
- No migration creation until @data-engineer closes W1-D02.
- No route/UI rework until @ux-design-expert confirms the target sequence.
- No change to legacy completion flow beyond documented compatibility plan.

## Exit Criteria to Implementation

- [ ] W1-D01 closed.
- [ ] W1-D02 closed.
- [ ] W1-D03 closed.
- [ ] @qa confirms test data and role matrix.
- [ ] @po updates gate from preflight GO to implementation GO.

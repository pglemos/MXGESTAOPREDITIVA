# Wave 1 - QA Preflight

Status: completed by AIOX orchestration preflight  
Agent: aiox-qa  
Date: 2026-05-15

## Objective

Define test coverage before Wave 1 implementation.

## Quality Gate

Wave 1 implementation should not start until these decisions are explicit:

- W1-D01: Visit 8 product semantics.
- W1-D02: analysis period storage.
- W1-D03: publication timing for client-facing summary.

If implementation starts in yolo mode, these preflight recommendations become the assumed decisions:

- Visit 8 is monthly follow-up under `pmr_7`, outside main-cycle progress.
- analysis period uses nullable start/end/preset columns.
- summary is private during editing and published after finalization.

## Regression Tests

Required regression coverage:

- PMR main-cycle progress still counts visits 1 to 7 only.
- Legacy completion accepts only visits 1, 2, 3, 5, 6, and 7 as currently defined.
- Legacy completion rejects Visit 8.
- Existing visits 1 to 7 can still be opened, saved, and finalized.
- Existing report rendering still works without analysis period values.

## New Feature Tests

Visit 8:

- admin/consultant can create a Visit 8 from agenda;
- Visit 8 appears in agenda;
- Visit 8 can be opened by route;
- Visit 8 does not redirect back to visit 7;
- Visit 8 can be saved;
- Visit 8 displays monthly follow-up objective and methodology;
- Visit 8 is not counted as PMR main-cycle completion.

Analysis period:

- preset period can be selected;
- custom period can be selected;
- invalid custom period is blocked;
- selected period persists after reload;
- selected period appears in report preview/final output.

Executive report:

- report orders sections by methodology;
- report includes positives, improvements, tasks, next steps, and attachments when present;
- report works with and without transcript;
- published summary is visible only after finalization if W1-D03 recommendation is accepted.

## Suggested Commands

Run after implementation:

```bash
npm run lint
npm run typecheck
npm test
```

If frontend behavior changes materially, run browser verification against the local app route for:

- agenda admin;
- consultoria visit execution;
- client/owner summary view if implemented in Wave 1.

## Residual Risk

The largest risk is accidental broadening of PMR from 7 to 8 everywhere. This would affect dashboards, legacy completion, progress indicators, and possibly historical reports.

QA recommendation: tests should assert both behaviors side by side: main-cycle PMR remains 1 to 7, follow-up Visit 8 is executable.

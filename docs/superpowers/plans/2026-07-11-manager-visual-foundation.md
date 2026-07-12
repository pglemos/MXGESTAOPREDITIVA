# Manager Visual Foundation Implementation Plan

> **For agentic workers:** Execute inline with AIOX Dev and AIOX QA. Native subagents, branches, worktrees, stash and intermediate commits are prohibited by the project prompt.

**Goal:** Align all nine manager screens with the approved seller visual language before resuming functional gaps.

**Architecture:** Reuse the canonical seller shell, atoms, molecules, organisms and proven seller-page primitives. Extract only role-neutral primitives that have two real consumers; keep manager data and business logic inside existing manager containers.

**Tech Stack:** React 19, TypeScript, Tailwind 4 tokens from `src/index.css`, Lucide, Radix/shadcn, Bun tests, Playwright.

## Global Constraints

- Work directly on `main`; preserve every pre-existing change.
- No new design system, dependencies, parallel tokens, raw component hex values or business `localStorage`.
- Validate 1920x1080, 1440x900, 1366x768, 1024x768, 768x1024 and 390x844.
- Every screen follows reference, before, implementation, after, compare, correction.
- Commit/push only after visual foundation, functional gaps and all quality gates.

---

### Task 1: Evidence and visual contracts

**Files:**
- Create: `docs/architecture/SELLER_DESIGN_COMPONENT_INVENTORY.md`
- Create: `docs/qa/MANAGER_VS_SELLER_DESIGN_PARITY.md`
- Modify: `docs/handoffs/ACTIVE_MANAGER_REBUILD.md`

- [ ] Record real seller components, props and tokens.
- [ ] Record measured manager gaps and protected files.
- [ ] Capture seller references and manager before images at six viewports.

### Task 2: Shared role primitives and Fechamento Diário

**Files:**
- Create: `src/features/manager/shared/ManagerVisualPrimitives.tsx`
- Create: `src/features/manager/shared/ManagerVisualPrimitives.test.tsx`
- Modify: `src/features/manager/daily-closing/ManagerDailyClosing.container.tsx`

**Produces:** `ManagerMetricCard`, `ManagerSectionCard`, `ManagerStatusGauge`, `ManagerEmptyState`, `ManagerLoadingState`.

- [ ] Write and run failing semantic/a11y tests.
- [ ] Implement token-only primitives using seller spacing, typography and states.
- [ ] Recompose header, metric hierarchy, action band, data table and mobile rows.
- [ ] Run focused tests and capture six after images.

### Task 3: Rotina da Equipe

**Files:** `src/features/manager/team-routine/ManagerTeamRoutine.container.tsx` and focused tests.

- [ ] Write failing tests for four metric states, progress and canonical empty state.
- [ ] Recompose from Central de Execucao patterns without changing data sources.
- [ ] Validate six viewports and compare.

### Task 4: Início and Mentor Gerencial

**Files:** `src/features/dashboard-loja/sections/ManagerOperationalCockpit.tsx`, `src/pages/ManagerMentor.tsx`, focused tests.

- [ ] Add failing structural tests.
- [ ] Recompose Início from Meu Dia patterns and Mentor from seller insight/action patterns.
- [ ] Preserve all calculations and rule-only mentor behavior.
- [ ] Validate six viewports per screen.

### Task 5: Minha Equipe and Meta da Loja

**Files:** existing dashboard-loja sections/containers and focused tests.

- [ ] Add failing list/avatar/progress and goal hierarchy tests.
- [ ] Align with Carteira, Ranking, Meu Dia and Funil patterns.
- [ ] Validate deep links and six viewports.

### Task 6: Feedbacks/PDIs, Ranking and Universidade MX

**Files:** existing manager pages/features and focused tests.

- [ ] Add failing parity tests for tabs, podium and training progress.
- [ ] Reuse the direct seller counterparts without changing canonical persistence.
- [ ] Validate six viewports per screen.

### Task 7: Seller regression and visual gate

- [ ] Recapture seller references after extractions.
- [ ] Run seller component/E2E suites and manager visual E2E.
- [ ] Check keyboard, focus, contrast, touch targets, reduced motion and overflow.
- [ ] Update visual audit and parity documents with evidence.

### Task 8: Functional gaps and release gates

- [ ] Resume Corrigir Leads, Agenda D+1, routine detail and RLS in that order with TDD.
- [ ] Reduce bundle below 1800 KB and run global E2E.
- [ ] Run all AIOX, lint, typecheck, unit, build and bundle gates.
- [ ] Stage explicit paths, commit, push and verify `origin/main...main = 0 0`.

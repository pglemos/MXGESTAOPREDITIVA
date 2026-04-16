# Architecture — Testing Strategy & Deployment

**Epic:** EPIC-UI-01 — Design System Completion & Architecture Hardening

---

## Integration with Existing Tests

**Existing Test Framework:** Bun test (63 tests) + Testing Library (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/dom`)
**Test Organization:** Co-located (e.g., `MXScoreCard.test.ts` alongside `MXScoreCard.tsx`), hook tests in `src/hooks/*.test.ts`
**Coverage Requirements:** New components must have at least 1 test file each

---

## Unit Tests for New Components

**Framework:** Bun test + Testing Library
**Location:** Co-located with component (e.g., `Select.test.ts`, `ModalShell.test.ts`)
**Coverage Target:** All atoms and molecules tested; organisms tested for key interactions

| Component | Test File | Key Assertions |
|-----------|-----------|----------------|
| Select | `Select.test.ts` | Renders options, onChange fires, disabled state |
| Avatar | `Avatar.test.ts` | Renders image, falls back to initials, size variants |
| Tooltip | `Tooltip.test.ts` | Shows on hover/focus, accessible label |
| DatePicker | `DatePicker.test.ts` | Renders date input, type variants, forward ref |
| EmptyState | `EmptyState.test.ts` | Renders icon + message, optional CTA |
| Accordion | `Accordion.test.ts` | Expand/collapse, keyboard navigation |
| PageHeader | `PageHeader.test.ts` | Title/subtitle/actions rendering |
| ModalShell | `ModalShell.test.ts` | Opens/closes, focus trap, Escape key, backdrop click |
| StatusBadge | `StatusBadge.test.ts` | Status-to-variant mapping |
| AgendaCalendar | `AgendaCalendar.test.ts` | Month navigation, day selection, visit dots |
| VisitCard | `VisitCard.test.ts` | Status badge, action buttons, link |

---

## Hook Tests (TanStack Query Migration)

| Hook | Test File | Key Assertions |
|------|-----------|----------------|
| `useTrainings` | `useTrainings.test.ts` | Fetches trainings, filters by role, marks watched |
| `useFeedbacks` | `useFeedbacks.test.ts` | Role-based query, create, acknowledge |
| `usePDIs` | `usePDIs.test.ts` | CRUD operations, review fetching |
| `useNotifications` | `useNotifications.test.ts` | Fetch, markRead, broadcast |

**Pattern:** Use `@tanstack/react-query` `QueryClient` in test setup with `wrapper` option.

---

## Integration Tests

**Framework:** Playwright (already configured: `@playwright/test` in `package.json:47`)
**Scope:** Key user flows per role
**Critical Paths:**
1. Admin creates a consulting visit via AgendaAdmin modal
2. Admin fills DRE form via DREView modal
3. Gerente creates feedback via GerenteFeedback page
4. Vendedor submits daily checkin

---

## Regression Testing

- Run `npm test` (63 existing tests) after every story completion
- Run `npm run typecheck` after every file change
- Run `npm run lint` (includes `tsc --noEmit` + token linting via `scripts/lint-tokens.js`)
- Visual spot-check of AgendaAdmin and DREView pages after Story 1.5

---

## Coding Standards and Conventions

### Existing Standards Compliance

**Code Style:** Functional React components with named exports (no default exports except pages), TypeScript strict mode, `cn()` utility for conditional classes

**Linting Rules:** `tsc --noEmit` for type checking + `scripts/lint-tokens.js` for design token usage validation

**Testing Patterns:** `describe/it/test` blocks with Bun test, `@testing-library/react` render + screen + fireEvent, co-located test files

**Documentation Style:** Portuguese comments where needed, English for code identifiers

### Enhancement-Specific Standards

- **TanStack Query:** All query functions are pure async functions (not hooks) that receive parameters and return typed data. Hooks compose `useQuery`/`useMutation` around them.
- **Zod Schemas:** One schema file per domain, re-exported from `schemas/index.ts`. Schemas are the source of truth for runtime types; TypeScript interfaces derive from `z.infer<typeof Schema>`.
- **Organisms:** Accept minimal props (data + callbacks). Internal state for UI only. No direct Supabase calls — data comes via props or TanStack Query hooks.
- **Molecules (Modal):** The `ModalShell` molecule wraps Radix Dialog and provides consistent modal behavior. Complex modal forms (DREForm) are organisms that compose the ModalShell molecule.

### Critical Integration Rules

- **Import Compatibility:** When decomposing `useData.ts`, each new file must export the same function name (e.g., `useTrainings`) so consumers only change the import path
- **Token Usage:** All new components must use `mx-*` design tokens exclusively — no hardcoded colors, spacing, or radii
- **Error Handling:** TanStack Query handles loading/error states; components render `<Skeleton>` for loading, `<EmptyState>` for empty data, inline error `<Card>` for errors (matching `AgendaAdmin.tsx:325-328` pattern)
- **Focus Management:** All modals use Radix Dialog (built-in focus trap) — remove manual `useFocusTrap` usage after ModalShell molecule adoption

---

## Infrastructure and Deployment Integration

### Existing Infrastructure

**Current Deployment:** Vercel via `vercel --prod` (npm script in `package.json:20`)
**Infrastructure Tools:** Vite 6 build, Bun package manager, `vercel.json` configuration
**Environments:** Production (Vercel) + Local development (`vite dev --port=3000`)

### Enhancement Deployment Strategy

**Deployment Approach:** Continuous deployment per story. Each story is independently mergeable and deployable.

**Infrastructure Changes:**
- New npm dependency: `@tanstack/react-query` + devtools
- Updated `vite.config.ts`: new manual chunk for TanStack Query
- No Vercel configuration changes needed

**Build Verification per Story:**
```bash
npm run typecheck && npm run lint && npm test && npm run build
```

### Rollback Strategy

**Rollback Method:** Git revert per story branch. Vercel auto-deploys on push to main; reverting the merge commit rolls back automatically.

**Risk Mitigation:**
- Each story on a separate branch, merged via PR
- `npm run build` verified before merge
- Vercel preview deployment for each PR

**Monitoring:**
- Vercel deployment logs for build errors
- TanStack Query DevTools for runtime query health (dev only)
- Browser console for Zod validation errors (logged, not thrown in dev)

---

## Security Integration

### Existing Security Measures

**Authentication:** Supabase Auth (email/password) via `useAuth` context provider
**Authorization:** Role-based at route level (`RoleSwitch` in `App.tsx:230-246`) and query level (role-based Supabase queries in every hook)
**Data Protection:** Supabase RLS (Row Level Security) on database; client uses anon key
**Row-Level Security:** Enforced at database level, not bypassable by frontend changes

### Enhancement Security Requirements

**New Security Measures:** None required. TanStack Query and Zod operate client-side with no new API surface.
**Integration Points:** TanStack Query uses the same Supabase client — no new authentication paths.
**Compliance:** Zod schemas validate data integrity at runtime, catching malformed responses.

---

## Checklist Results

| Check | Status | Notes |
|-------|--------|-------|
| Tech stack alignment verified | PASS | No breaking changes; 2 new deps (TanStack Query + devtools) |
| Existing tests preserved | PASS | All 63 tests remain green; new tests additive |
| Rollback plan per story | PASS | Each story independently revertible |
| No database schema changes | PASS | Enhancement is purely frontend |
| Design token consistency | PASS | All new components use `mx-*` tokens |
| Import path compatibility | PASS | Decomposed hooks maintain same export names |
| Modal accessibility | PASS | Radix Dialog provides focus trap + ARIA |
| Incremental deployment | PASS | Each story independently deployable |
| Build config updated | PASS | Vite manual chunks updated for TanStack Query |
| Security unchanged | PASS | No new auth paths or API surface |

---

## Verification Steps per Story

1. `npm run typecheck` — zero errors
2. `npm run lint` — zero errors (includes token lint)
3. `npm test` — all 63+ tests pass
4. `npm run build` — successful production build

**Implementation Sequencing:** 1.1 → 1.2 → 1.3 → 1.4 → 1.5 (strict order, each depends on previous)

---

## Cross-References

- **Architecture Overview:** See `docs/architecture/00-overview.md`
- **Component Architecture:** See `docs/architecture/01-component-arch.md`
- **Data Layer:** See `docs/architecture/02-data-layer.md`
- **Migration Strategy:** See `docs/architecture/03-migration.md`
- **PRD:** See `docs/prd/00-overview.md`
- **Story 1.5 (Integration):** See `docs/prd/06-story-1.5.md`

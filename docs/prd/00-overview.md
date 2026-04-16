# PRD — EPIC-UI-01 Overview

**Project:** MX Performance — Plataforma de Gestao Preditiva para Concessionarias
**Type:** Brownfield Enhancement
**Date:** 2026-04-15
**Author:** @pm (Morgan)
**Status:** DRAFT
**Epic:** EPIC-UI-01 — Design System Completion & Architecture Hardening

---

## Executive Summary

MX Performance is a production SaaS platform serving 4 user roles (admin, gerente, vendedor, dono) across 39 pages with a React 19 + TypeScript 5.8 + Tailwind CSS v4 + Supabase stack. The system uses an Atomic Design component hierarchy but significant gaps exist: only 6 atoms, 4 molecules, and 1 organism are implemented. The codebase carries technical debt in state management (no server-state layer), monolithic page components (AgendaAdmin at 768 LOC, DREView at 500 LOC), inconsistent modal patterns, and an unused Zod dependency.

This PRD defines a single epic with 5 stories to close these gaps. Each story is scoped for AI agent execution and follows a strict dependency order.

**Business Impact:** Reduced development velocity for new features, duplicated fetch/mutation logic, inconsistent UX across pages, accessibility compliance gaps (~55% WCAG AA).

---

## Current State Assessment

### Component Inventory (Atomic Design)

| Layer    | Existing                                                                      | Missing (Needed)                          |
|----------|-------------------------------------------------------------------------------|-------------------------------------------|
| Atoms    | Button, Input, Textarea, Badge, Skeleton, Typography (6)                      | Select, Avatar, Tooltip, DatePicker, Accordion, EmptyState |
| Molecules| Card, FormField, Breadcrumb, MXScoreCard (4)                                  | PageHeader, StatusBadge, ModalShell, FilterBar, ModalTrigger |
| Organisms| DataGrid (1)                                                                   | AgendaCalendar, DRETable, DREForm, VisitCard, MetricsBar |
| Pages    | 39 page components (many monolithic)                                           | —                                         |

### Technical Debt Map

| ID     | Description                                                                                        | Severity | Location                          |
|--------|----------------------------------------------------------------------------------------------------|----------|-----------------------------------|
| TD-01  | No state management layer — duplicated fetch/mutation logic across 22 hook files                   | HIGH     | `src/hooks/*.ts`                  |
| TD-02  | Zod v4.3.6 dependency unused for runtime validation                                                | MEDIUM   | `package.json`                    |
| TD-03  | Organism layer underpopulated — only DataGrid exists; complex UIs are monolithic page components   | HIGH     | `src/components/organisms/`       |
| TD-04  | `useData.ts` is 458 LOC mega-hook with 7 unrelated hooks (useTrainings, useFeedbacks, useNotifications, usePDIs, useMyPDIs, useWeeklyFeedbackReports, useTeamTrainings, useStoreDeliveryRules) | HIGH     | `src/hooks/useData.ts`            |
| TD-05  | Inconsistent modal patterns — `WizardPDI.tsx` uses Radix Dialog; `AgendaAdmin.tsx` and `DREView.tsx` use raw div overlays | HIGH     | Multiple files                    |
| TD-06  | Focus trap exists (`useFocusTrap.ts`) but is not applied in AgendaAdmin modal (line 628-764)        | MEDIUM   | `src/pages/AgendaAdmin.tsx:628`   |
| TD-07  | No virtualization or pagination for long data lists                                                | LOW      | DataGrid, list pages              |
| TD-08  | Legacy indigo-to-green token aliases (`mx-indigo-*`) suggest incomplete design system migration    | LOW      | `src/index.css` tokens            |

### Key Findings from Codebase Analysis

**AgendaAdmin.tsx (768 LOC):**
- Lines 1-30: Imports and type definitions (filter types inline)
- Lines 67-228: State, handlers, memoized computations — all in page component
- Lines 228-626: Render JSX — calendar grid, visit list, sidebar detail panel
- Lines 628-765: Raw div modal overlay without Radix Dialog or focus trap
- Multiple inline `<select>` elements (lines 649-659, 702-711, 717-742) — no Select atom
- Inline status badge logic (lines 47-65) — should be StatusBadge molecule

**DREView.tsx (500 LOC):**
- Lines 22-82: Static section field configuration (SECTION_FIELDS)
- Lines 114-233: State, handlers, computed values
- Lines 234-392: DRE annual table with inline table rows configuration
- Lines 394-495: Raw div modal overlay (same pattern as AgendaAdmin)
- Uses `useFocusTrap` correctly but modal is not Radix Dialog
- No Zod validation on form data before upsert

**useData.ts (458 LOC):**
- Contains 8 hooks: `useTrainings`, `useFeedbacks`, `useMyPDIs`, `useWeeklyFeedbackReports`, `usePDIs`, `useNotifications`, `useSystemBroadcasts`, `useTeamTrainings`, `useStoreDeliveryRules`
- Each hook follows identical pattern: useState + useCallback + useEffect for fetch
- No caching, no deduplication, no optimistic updates
- Supabase client imported directly in every hook

**Radix Dialog usage:**
- Only `WizardPDI.tsx` (line 14) uses `@radix-ui/react-dialog`
- All other modals (AgendaAdmin, DREView, and others) use raw `<div>` overlays

---

## Goals & Non-Goals

### Goals
1. Complete the Atomic Design component library to support all current page needs
2. Extract monolithic page components into reusable organisms
3. Introduce TanStack Query for server-state management with caching and deduplication
4. Unify modal patterns using a shared ModalShell molecule wrapping Radix Dialog
5. Activate Zod for runtime form validation across all form-based interactions
6. Split `useData.ts` mega-hook into domain-specific files

### Non-Goals
- Full Storybook setup (deferred to follow-up epic)
- Complete WCAG AA remediation (scope too large; this PRD focuses on structural enablers)
- Database-level changes (covered by separate DB epic)
- New feature development
- Mobile-first responsive redesign
- Adding TanStack Router (react-router-dom stays)

---

## Story Dependency Graph

```
STORY-01 (Atoms & Molecules)
    │
    ▼
STORY-02 (Organisms: Modal, Calendar, DRE)
    │
    ├──── STORY-03 (State Management: TanStack Query + Hook Split)
    │
    ├──── STORY-04 (Zod Validation Schemas)
    │
    └──── STORY-05 (Integration: Wire everything into pages)
```

---

## Implementation Order & Timeline

| Story   | Depends On     | Estimated Effort | Risk  |
|---------|----------------|-------------------|-------|
| STORY-01 | None          | 4-6h              | Low   |
| STORY-02 | STORY-01      | 6-8h              | Medium|
| STORY-03 | STORY-01      | 6-8h              | Medium|
| STORY-04 | STORY-01      | 4-6h              | Low   |
| STORY-05 | STORY-02, 03, 04 | 4-6h           | High  |

**Parallelization:** STORY-02, STORY-03, and STORY-04 can run in parallel after STORY-01 completes.

**Total Estimated Effort:** 24-34 hours

---

## Success Metrics

| Metric                                      | Before          | After (Target)     |
|---------------------------------------------|-----------------|---------------------|
| Atom count                                  | 6               | 12                  |
| Molecule count                              | 4               | 7                   |
| Organism count                              | 1               | 6                   |
| `useData.ts` LOC                            | 458             | 0 (deleted)         |
| AgendaAdmin.tsx LOC                         | 768             | ~350                |
| DREView.tsx LOC                             | 500             | ~200                |
| Modal patterns                              | Mixed (2 types) | 1 (Radix ModalShell molecule) |
| Forms with runtime validation               | 0               | 4 (all form types)  |
| Server-state caching layer                  | None            | TanStack Query      |
| Duplicate fetch logic                       | Widespread      | Centralized via TanStack Query |

---

## Risks & Mitigations

| Risk                                        | Likelihood | Impact | Mitigation                                          |
|---------------------------------------------|------------|--------|-----------------------------------------------------|
| Visual regressions from component extraction | Medium     | High   | Visual comparison screenshots before/after each story |
| TanStack Query migration breaks existing behavior | Medium | High   | Story-by-story migration; keep hook API surface identical |
| Radix Dialog modal migration conflicts with existing state | Low | Medium | Test all modal open/close/submit flows manually |
| Zod schemas too strict and block valid inputs | Low | Medium | Schemas should be permissive on optional fields; test with real data |
| Import path changes break production build | Low | High | Full `npm run build` verification after each story |

---

## Out of Scope (Deferred)

- Storybook component documentation
- Complete WCAG AA audit and remediation
- TanStack Router migration
- Virtual scrolling for DataGrid
- Removal of `mx-indigo-*` legacy token aliases
- TypeScript strict mode enablement
- Mobile responsiveness overhaul
- Dark mode support

---

## Cross-References

- **Requirements:** See `docs/prd/01-requirements.md`
- **Story 1.1 — Atoms & Molecules:** See `docs/prd/02-story-1.1.md`
- **Story 1.2 — Organism Extraction:** See `docs/prd/03-story-1.2.md`
- **Story 1.3 — TanStack Query Migration:** See `docs/prd/04-story-1.3.md`
- **Story 1.4 — Zod Runtime Validation:** See `docs/prd/05-story-1.4.md`
- **Story 1.5 — Page Integration:** See `docs/prd/06-story-1.5.md`
- **Architecture:** See `docs/architecture/`
- **Front-End Spec:** See `docs/front-end-spec.md`

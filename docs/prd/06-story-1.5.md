# STORY-05: Page Integration — Wire Components into Production Pages

**Epic:** EPIC-UI-01 — Design System Completion & Architecture Hardening
**Prerequisites:** STORY-02, STORY-03, STORY-04 complete
**Estimated Effort:** 4-6 hours (AI agent execution)
**Risk:** High

---

## Goal

Integrate all new atoms, molecules, organisms, TanStack Query hooks, and Zod validation into production pages. This is the final integration story that makes everything work together.

## Scope

- Refactor AgendaAdmin to use new component hierarchy
- Refactor DREView to use new component hierarchy
- Update remaining pages that use raw modals
- Verify end-to-end functionality

---

## Detailed Requirements

### AgendaAdmin.tsx Refactoring

**Current:** 768 LOC monolith
**Target:** ~350 LOC page composing organisms

1. Replace header (lines 230-272) with `PageHeader` molecule
2. Replace metrics cards (lines 240-261) with `MetricsBar` organism
3. Replace calendar grid (lines 332-412) with `AgendaCalendar` organism
4. Replace visit cards (lines 454-549) with `VisitCard` organism
5. Replace empty state (lines 427-435) with `EmptyState` atom
6. Replace raw div modal (lines 628-765) with `ModalShell` molecule
7. Replace inline `<select>` elements with `Select` atom
8. Replace `getVisitStatusBadge()` with `StatusBadge` molecule
9. Replace `Input type="date"` with `DatePicker` atom
10. Add Zod validation to `handleSubmitSchedule` using `ScheduleVisitSchema`
11. Update hooks to use TanStack Query versions from STORY-03

---

### DREView.tsx Refactoring

**Current:** 500 LOC monolith
**Target:** ~200 LOC section composing organisms

1. Replace DRE table (lines 312-392) with `DRETable` organism
2. Replace modal form (lines 394-495) with `DREForm` organism using `ModalShell`
3. Replace inline accordion logic (lines 418-453) with `Accordion` atom usage in `DREForm`
4. Add Zod validation to save using `DREFormSchema`
5. Replace `Input type="month"` with `DatePicker` atom

---

### WizardPDI.tsx Alignment

- Verify WizardPDI continues using Radix Dialog (already correct)
- No changes needed unless ModalShell molecule API is preferred

---

### Interaction Patterns to Verify

#### Schedule Visit Modal (Admin)
**Trigger:** Click "+ AGENDAR VISITA" button or click empty calendar day.
**Flow:**
1. Modal opens with `ModalShell` (Radix Dialog)
2. Form fields: Client select, Date, Time, Duration, Modality, Consultant, Aux. Consultant, Objective
3. Client select filters to active clients only, shows current step (e.g., "Etapa 3/7")
4. On client select: auto-calculates next visit number, displays "Será a visita N deste cliente"
5. Validation: Client required, Date+Time required (via Zod schema)
6. Submit: loading state on button ("AGENDANDO..."), toast on success/error
7. Close: Modal closes, calendar refreshes

#### DRE Edit Modal (Consultoria Financial Tab)
**Trigger:** Click edit icon on DRE table section.
**Flow:**
1. Modal opens with section fields pre-filled from current data
2. Grid of numeric inputs organized by month columns
3. Real-time total calculations shown at bottom
4. Submit: Zod validation → upsert → toast → modal closes → table refreshes

#### Form Validation Patterns
- Each form defines a Zod schema
- Validation errors displayed inline below each field using `FormField` error slot
- Toast notificacoes for submission errors via `sonner`

**Error Display:**
- Field-level: Red text below input (`text-status-error text-mx-tiny font-black uppercase`)
- Input border: `border-status-error focus:ring-status-error/5`
- Page-level: Error card at top of content area (`Card bg-status-error-surface`)
- Toast: Red toast for operation failures, green for success

**Visual Validation States:**
```
Pristine:   border-border-default
Valid:      border-border-default (no green border — avoid distraction)
Invalid:    border-status-error + red error text with animate-in slide-in-from-top-1
Disabled:   opacity-50, cursor-not-allowed
Submitting: Button shows loading text, inputs disabled
```

---

## Acceptance Criteria

- [ ] AgendaAdmin reduced from 768 LOC to ~350 LOC (measured after refactor)
- [ ] DREView reduced from 500 LOC to ~200 LOC (measured after refactor)
- [ ] No raw div modal overlays remain in AgendaAdmin or DREView
- [ ] All inline `<select>` elements replaced with Select atom
- [ ] All forms validate with Zod before submission
- [ ] TanStack Query DevTools available in development mode
- [ ] Visual parity — no regressions in UI appearance or behavior
- [ ] All existing features work: create visit, edit DRE, cancel visit, start visit
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes

## Files to Modify

- `src/pages/AgendaAdmin.tsx` — major refactor
- `src/features/consultoria/components/DREView.tsx` — major refactor
- All pages importing from old `useData.ts` — verify imports point to new files

---

## Cross-References

- **PRD Overview:** See `docs/prd/00-overview.md`
- **Requirements:** See `docs/prd/01-requirements.md` (REQ-22 through REQ-25)
- **Story 1.1 (atoms/molecules):** See `docs/prd/02-story-1.1.md`
- **Story 1.2 (organisms):** See `docs/prd/03-story-1.2.md`
- **Story 1.3 (TanStack Query):** See `docs/prd/04-story-1.3.md`
- **Story 1.4 (Zod):** See `docs/prd/05-story-1.4.md`
- **Component Architecture:** See `docs/architecture/01-component-arch.md`
- **Migration Strategy:** See `docs/architecture/03-migration.md`
- **Testing Strategy:** See `docs/architecture/04-testing-deploy.md`

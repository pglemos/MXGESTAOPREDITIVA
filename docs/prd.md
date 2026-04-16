# PRD — MX Gestao Preditiva UI Enhancement

**Project:** MX Performance — Plataforma de Gestao Preditiva para Concessionarias
**Type:** Brownfield Enhancement
**Date:** 2026-04-15
**Author:** @pm (Morgan)
**Status:** DRAFT
**Epic:** EPIC-UI-01 — Design System Completion & Architecture Hardening

---

## 1. Executive Summary

MX Performance is a production SaaS platform serving 4 user roles (admin, gerente, vendedor, dono) across 39 pages with a React 19 + TypeScript 5.8 + Tailwind CSS v4 + Supabase stack. The system uses an Atomic Design component hierarchy but significant gaps exist: only 6 atoms, 4 molecules, and 1 organism are implemented. The codebase carries technical debt in state management (no server-state layer), monolithic page components (AgendaAdmin at 768 LOC, DREView at 500 LOC), inconsistent modal patterns, and an unused Zod dependency.

This PRD defines a single epic with 5 stories to close these gaps. Each story is scoped for AI agent execution and follows a strict dependency order.

**Business Impact:** Reduced development velocity for new features, duplicated fetch/mutation logic, inconsistent UX across pages, accessibility compliance gaps (~55% WCAG AA).

---

## 2. Current State Assessment

### 2.1 Component Inventory (Atomic Design)

| Layer    | Existing                                                                      | Missing (Needed)                          |
|----------|-------------------------------------------------------------------------------|-------------------------------------------|
| Atoms    | Button, Input, Textarea, Badge, Skeleton, Typography (6)                      | Select, Avatar, Tooltip, DatePicker, Accordion, EmptyState |
| Molecules| Card, FormField, Breadcrumb, MXScoreCard (4)                                  | PageHeader, StatusBadge, ModalShell, FilterBar, ModalTrigger |
| Organisms| DataGrid (1)                                                                   | AgendaCalendar, DRETable, DREForm, VisitCard, MetricsBar |
| Pages    | 39 page components (many monolithic)                                           | —                                         |

### 2.2 Technical Debt Map

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

### 2.3 Key Findings from Codebase Analysis

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

## 3. Goals & Non-Goals

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

## 4. Requirements

### 4.1 Key Requirements

| ID       | Requirement                                                                                                  | Priority | Story     |
|----------|--------------------------------------------------------------------------------------------------------------|----------|-----------|
| REQ-01   | Create Select atom with CVA variants matching Button patterns                                               | HIGH     | STORY-01  |
| REQ-02   | Create Avatar atom with image fallback to initials                                                           | HIGH     | STORY-01  |
| REQ-03   | Create Tooltip atom with hover/focus trigger                                                                 | MEDIUM   | STORY-01  |
| REQ-04   | Create DatePicker atom wrapping native date input with MX styling                                            | MEDIUM   | STORY-01  |
| REQ-05   | Create Accordion atom with collapsible sections                                                              | MEDIUM   | STORY-01  |
| REQ-07   | Create PageHeader molecule for consistent page titles                                                        | HIGH     | STORY-01  |
| REQ-08   | Create EmptyState atom with icon + message + optional CTA                                                   | HIGH     | STORY-01  |
| REQ-09   | Create StatusBadge molecule mapping domain statuses to visual variants                                       | HIGH     | STORY-01  |
| REQ-10   | Create ModalShell molecule wrapping Radix Dialog with focus trap integration                                 | CRITICAL | STORY-02  |
| REQ-11   | Create AgendaCalendar organism extracting calendar grid from AgendaAdmin                                     | HIGH     | STORY-02  |
| REQ-12   | Create VisitCard organism extracting visit list item from AgendaAdmin                                        | HIGH     | STORY-02  |
| REQ-13   | Create MetricsBar organism extracting metrics cards from AgendaAdmin header                                  | MEDIUM   | STORY-02  |
| REQ-14   | Create DRETable organism extracting annual DRE table from DREView                                           | HIGH     | STORY-02  |
| REQ-15   | Create DREForm organism extracting modal form from DREView                                                  | HIGH     | STORY-02  |
| REQ-16   | Install and configure TanStack Query (QueryClient, QueryClientProvider)                                      | CRITICAL | STORY-03  |
| REQ-17   | Split useData.ts into domain-specific hook files (useTrainings, useFeedbacks, useNotifications, etc.)        | CRITICAL | STORY-03  |
| REQ-18   | Convert split hooks to use TanStack Query useQuery/useMutation                                              | HIGH     | STORY-03  |
| REQ-19   | Create shared Supabase query helpers for TanStack Query integration                                          | HIGH     | STORY-03  |
| REQ-20   | Define Zod schemas for FeedbackFormData, PDIFormData, and DRE form data                                      | HIGH     | STORY-04  |
| REQ-21   | Apply Zod validation to all form submissions before Supabase calls                                           | HIGH     | STORY-04  |
| REQ-22   | Replace inline select elements in AgendaAdmin with Select atom                                               | MEDIUM   | STORY-05  |
| REQ-23   | Replace raw div modals with ModalShell molecule in AgendaAdmin and DREView                                   | CRITICAL | STORY-05  |
| REQ-24   | Replace inline StatusBadge logic with StatusBadge molecule in AgendaAdmin                                    | MEDIUM   | STORY-05  |
| REQ-25   | Replace inline EmptyState with EmptyState molecule in AgendaAdmin                                            | MEDIUM   | STORY-05  |
| REQ-26   | All new components must follow existing CVA + cn() patterns from Button/Badge                                | HIGH     | All       |
| REQ-27   | All new components must use MX design tokens (not raw Tailwind colors)                                       | HIGH     | All       |
| REQ-28   | All modals must have focus trap via useFocusTrap or Radix Dialog built-in                                    | CRITICAL | STORY-02  |
| REQ-29   | TypeScript strict compliance — no `any` types in new components                                              | HIGH     | All       |

---

## 5. Epic: EPIC-UI-01 — Design System Completion & Architecture Hardening

### Story Dependency Graph

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

### STORY-01: Missing Atoms & Molecules

**Goal:** Fill the Atomic Design gaps by creating all missing atoms and molecules needed by downstream stories.

**Scope:**
- Create 6 new atoms: `Select`, `Avatar`, `Tooltip`, `DatePicker`, `Accordion`, `EmptyState`
- Create 2 new molecules: `PageHeader`, `StatusBadge`

**Detailed Requirements:**

**Atoms (src/components/atoms/):**

1. `Select.tsx` — Custom select wrapping native `<select>` with CVA variants matching Input styling. Must support:
   - `variant`: default, outline (matching Input patterns)
   - `size`: default, sm, lg
   - Forward ref
   - `children` for `<option>` elements
   - Current inline selects in AgendaAdmin (lines 649, 702, 717) and DREView serve as reference

2. `Avatar.tsx` — Image with fallback to initials circle. Must support:
   - `src`, `alt`, `fallback` (initials string) props
   - `size`: sm, default, lg
   - Uses existing MX tokens for radius and colors

3. `Tooltip.tsx` — Simple tooltip on hover/focus. Must support:
   - `content`: string or ReactNode
   - `side`: top, right, bottom, left
   - Uses Radix or CSS-only approach (no new deps)
   - `delayMs` prop

4. `DatePicker.tsx` — Styled date input wrapping native `<input type="date|month">`. Must support:
   - `type`: date, month
   - Reuses Input base classes with date-specific styling
   - Forward ref

5. `Accordion.tsx` — Collapsible sections with header + content. Must support:
   - `items`: array of `{ id, title, content }`
   - `defaultOpen`: string[] of initially open item ids
   - Animated expand/collapse using Motion (already in deps)
   - Replaces inline collapse logic in DREView lines 418-453

6. `EmptyState.tsx` — Empty state placeholder with icon, message, and optional CTA. Must support:
   - `icon`: LucideIcon component
   - `title`, `description` strings
   - `action` optional ReactNode (button/link)
   - Replaces inline empty states in AgendaAdmin (lines 427-435, 573-576, 578-584)

**Molecules (src/components/molecules/):**

7. `PageHeader.tsx` — Consistent page header with title, subtitle, actions slot. Must support:
   - `title`, `subtitle`, `icon` props
   - `actions` render prop / ReactNode slot
   - Replaces duplicated header patterns in AgendaAdmin (lines 230-272), DREView

8. `StatusBadge.tsx` — Domain-aware status badge mapping. Must support:
   - `status`: string (domain status value)
   - `domain`: 'visit' | 'feedback' | 'pdi' | 'generic'
   - Returns Badge with correct variant based on domain+status mapping
   - Replaces inline `getVisitStatusBadge()` in AgendaAdmin (lines 47-55)

**Acceptance Criteria:**
- [ ] All 6 atoms export from `src/components/atoms/` with proper TypeScript interfaces
- [ ] All 2 molecules export from `src/components/molecules/` with proper TypeScript interfaces
- [ ] All components follow CVA + cn() pattern from existing Button/Badge
- [ ] All components use MX design tokens only (no raw Tailwind colors like `bg-gray-100`)
- [ ] `npm run typecheck` passes with zero new errors
- [ ] `npm run lint` passes
- [ ] Unit tests for StatusBadge mapping logic

**Files to Create:**
- `src/components/atoms/Select.tsx`
- `src/components/atoms/Avatar.tsx`
- `src/components/atoms/Tooltip.tsx`
- `src/components/atoms/DatePicker.tsx`
- `src/components/atoms/Accordion.tsx`
- `src/components/atoms/EmptyState.tsx`
- `src/components/molecules/PageHeader.tsx`
- `src/components/molecules/StatusBadge.tsx`

**Effort:** ~4-6 hours (AI agent execution)

---

### STORY-02: Organism Extraction — Modal, Agenda & DRE

**Goal:** Build reusable organisms by extracting monolithic patterns from AgendaAdmin and DREView into composable components. Create a unified ModalShell molecule.

**Prerequisite:** STORY-01 complete

**Scope:**
- Create ModalShell molecule wrapping Radix Dialog
- Extract AgendaAdmin into: AgendaCalendar, VisitCard, MetricsBar organisms
- Extract DREView into: DRETable, DREForm organisms

**Detailed Requirements:**

**ModalShell Molecule (src/components/molecules/ModalShell.tsx):**

Must wrap `@radix-ui/react-dialog` (already in deps) with:
- `open`, `onOpenChange` props
- `title`, `description` props → rendered in DialogTitle/DialogDescription
- `children` → DialogContent body
- `footer` → optional ReactNode for action buttons
- Integrated `useFocusTrap` as backup (Radix Dialog has built-in focus management)
- Backdrop click to close (configurable via `closeOnBackdropClick` prop)
- Escape key to close
- Consistent styling: `max-w-*` responsive, rounded-mx-2xl, shadow-mx-xl
- This replaces the raw div pattern used in AgendaAdmin (lines 628-765) and DREView (lines 394-495)

**AgendaCalendar (src/components/organisms/AgendaCalendar.tsx):**

Extract calendar grid from AgendaAdmin lines 332-412 into standalone organism:
- Props: `calendarDays`, `visitsByDate`, `selectedDate`, `onDateSelect`, `calendarMonth`, `onPrevMonth`, `onNextMonth`, `onToday`
- Renders weekday headers, day cells with visit indicators
- Uses existing Typography, Badge atoms
- Pure presentational — no state management

**VisitCard (src/components/organisms/VisitCard.tsx):**

Extract visit list item from AgendaAdmin lines 460-548:
- Props: `visit`, `onStart`, `onCancel`, `onDelete`
- Uses StatusBadge molecule for status display
- Uses Link from react-router-dom
- Presentational component

**MetricsBar (src/components/organisms/MetricsBar.tsx):**

Extract metrics cards from AgendaAdmin lines 240-261:
- Props: `metrics` object with total/agendadas/emAndamento/concluidas/canceladas counts
- Renders grid of Card molecules with Typography

**DRETable (src/components/organisms/DRETable.tsx):**

Extract annual DRE table from DREView lines 312-392:
- Props: `months`, `financialsByMonth`, `tableRows`, `onEdit`
- Pure table rendering with presentational logic

**DREForm (src/components/organisms/DREForm.tsx):**

Extract modal form from DREView lines 394-495:
- Props: `open`, `onClose`, `form`, `onFormChange`, `onSave`, `onDelete`, `editingId`, `saving`, `collapsed`, `onToggleSection`, `formComputed`
- Uses ModalShell molecule (not raw div)
- Uses Accordion atom (replaces inline collapse logic)
- Uses DatePicker atom for month input

**Acceptance Criteria:**
- [ ] ModalShell molecule wraps Radix Dialog with consistent API
- [ ] AgendaAdmin page refactored to compose from AgendaCalendar + VisitCard + MetricsBar + Modal
- [ ] DREView refactored to compose from DRETable + DREForm + Modal
- [ ] All modals in refactored pages use ModalShell molecule (no raw div overlays)
- [ ] Focus trap active on all modals
- [ ] Visual parity — pages look identical before and after refactoring
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

**Files to Create:**
- `src/components/molecules/ModalShell.tsx`
- `src/components/organisms/AgendaCalendar.tsx`
- `src/components/organisms/VisitCard.tsx`
- `src/components/organisms/MetricsBar.tsx`
- `src/components/organisms/DRETable.tsx`
- `src/components/organisms/DREForm.tsx`

**Files to Modify:**
- `src/pages/AgendaAdmin.tsx` — refactor to use new organisms
- `src/features/consultoria/components/DREView.tsx` — refactor to use new organisms

**Effort:** ~6-8 hours (AI agent execution)

---

### STORY-03: Server State Management — TanStack Query + Hook Decomposition

**Goal:** Introduce TanStack Query for server-state management and decompose the `useData.ts` mega-hook into domain-specific files with proper caching, deduplication, and optimistic updates.

**Prerequisite:** STORY-01 complete (can run in parallel with STORY-02)

**Scope:**
- Install `@tanstack/react-query`
- Configure QueryClient with sensible defaults
- Split `useData.ts` (458 LOC, 8 hooks) into individual domain files
- Convert each hook to use `useQuery` / `useMutation`

**Detailed Requirements:**

**TanStack Query Setup:**
- Install `@tanstack/react-query` (latest v5)
- Create `src/lib/query-client.ts` with QueryClient configuration:
  - `staleTime: 5 * 60 * 1000` (5 minutes)
  - `gcTime: 10 * 60 * 1000` (10 minutes)
  - `retry: 2`
  - `refetchOnWindowFocus: false`
- Wrap App with QueryClientProvider in `src/App.tsx`

**Hook Decomposition — Target File Structure:**

Current `src/hooks/useData.ts` contains 8 hooks. Split into:

| New File                      | Hooks Extracted                                      |
|-------------------------------|------------------------------------------------------|
| `src/hooks/useTrainings.ts`   | `useTrainings` (lines 9-54)                          |
| `src/hooks/useFeedbacks.ts`   | `useFeedbacks` (lines 57-134)                        |
| `src/hooks/usePDIs.ts`        | `usePDIs` (lines 179-252), `useMyPDIs` (lines 136-151) |
| `src/hooks/useFeedbackReports.ts` | `useWeeklyFeedbackReports` (lines 153-176)       |
| `src/hooks/useNotifications.ts` | `useNotifications` (lines 255-339)                 |
| `src/hooks/useBroadcasts.ts`  | `useSystemBroadcasts` (lines 341-373)                |
| `src/hooks/useTeamTrainings.ts` | `useTeamTrainings` (lines 376-425)                 |
| `src/hooks/useDeliveryRules.ts` | `useStoreDeliveryRules` (lines 428-458)            |

Note: Some of these hooks already have separate files (e.g., `useAgendaAdmin.ts`, `useDRE.ts`). This story focuses exclusively on the contents of `useData.ts`.

**Conversion Pattern (per hook):**

Before (current pattern):
```typescript
export function useTrainings() {
  const { profile, role } = useAuth()
  const [trainings, setTrainings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const fetchTrainings = useCallback(async () => { ... }, [profile, role])
  useEffect(() => { fetchTrainings() }, [fetchTrainings])
  
  return { trainings, loading, error, refetch: fetchTrainings }
}
```

After (TanStack Query pattern):
```typescript
export function useTrainings() {
  const { profile, role } = useAuth()
  
  const { data: trainings = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['trainings', profile?.id, role],
    queryFn: () => fetchTrainings(profile!, role),
    enabled: !!profile,
  })
  
  const markWatchedMutation = useMutation({
    mutationFn: (trainingId: string) => markWatched(profile!, trainingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainings'] }),
  })
  
  return { trainings, loading, error, markWatched: markWatchedMutation.mutate, refetch }
}
```

**Supabase Query Helpers (`src/lib/supabase-query.ts`):**
- `createSupabaseQueryFn<T>(queryBuilder)` — wraps Supabase query in a QueryFunction
- Standard error handling: converts PostgrestError to Error
- Type-safe response unwrapping

**Migration Strategy:**
1. Create new hook files alongside `useData.ts`
2. Update all imports in consuming pages/features to point to new files
3. Verify all consumers compile
4. Delete `useData.ts`
5. Run full test suite

**Acceptance Criteria:**
- [ ] `@tanstack/react-query` installed and QueryClientProvider configured in App.tsx
- [ ] `src/hooks/useData.ts` deleted — all 8 hooks extracted to individual files
- [ ] All extracted hooks use TanStack Query `useQuery`/`useMutation`
- [ ] All consuming pages/features updated with new import paths
- [ ] Hook API surface preserved — consumers require zero logic changes (only import path changes)
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes — all existing tests updated for new file locations

**Files to Create:**
- `src/lib/query-client.ts`
- `src/lib/supabase-query.ts`
- `src/hooks/useTrainings.ts`
- `src/hooks/useFeedbacks.ts`
- `src/hooks/usePDIs.ts`
- `src/hooks/useFeedbackReports.ts`
- `src/hooks/useNotifications.ts` (replaces content, file may already exist)
- `src/hooks/useBroadcasts.ts`
- `src/hooks/useTeamTrainings.ts`
- `src/hooks/useDeliveryRules.ts`

**Files to Modify:**
- `src/App.tsx` — add QueryClientProvider
- All files importing from `useData.ts` — update import paths
- `src/hooks/useData.ts` — DELETE after migration

**Files to Delete:**
- `src/hooks/useData.ts`

**Effort:** ~6-8 hours (AI agent execution)

---

### STORY-04: Zod Runtime Validation

**Goal:** Activate the existing Zod dependency for runtime form validation across all form-based interactions.

**Prerequisite:** STORY-01 complete (can run in parallel with STORY-02 and STORY-03)

**Scope:**
- Define Zod schemas for all form data types
- Apply validation to form submissions in hooks and page components
- Create reusable validation utilities

**Detailed Requirements:**

**Schema Definitions (`src/lib/schemas/`):**

1. `feedback.schema.ts`:
   - `FeedbackFormSchema` validating `FeedbackFormData` fields:
     - `seller_id`: uuid string, required
     - `week_reference`: date string, required
     - `leads_week`, `agd_week`, `visit_week`, `vnd_week`: non-negative integers
     - `tx_lead_agd`, `tx_agd_visita`, `tx_visita_vnd`: numbers 0-100
     - `meta_compromisso`: number 0-100
     - `positives`, `attention_points`, `action`: string min 1
   - Current unvalidated form: `useFeedbacks.createFeedback()` in useData.ts lines 92-125

2. `pdi.schema.ts`:
   - `PDIFormSchema` validating `PDIFormData`:
     - `seller_id`: uuid, required
     - `meta_6m`, `meta_12m`, `meta_24m`: strings min 1
     - `action_1` through `action_5`: optional strings
     - `comp_*` fields (10 competency scores): numbers 1-10
     - `due_date`: optional date string
   - Current unvalidated form: `usePDIs.createPDI()` in useData.ts lines 207-227

3. `dre.schema.ts`:
   - `DREFormSchema` validating DRE form data:
     - `reference_date`: month string (YYYY-MM), required
     - All financial fields: numbers (allow negative for deductions)
     - `pro_labore`: non-negative number
   - Current unvalidated form: DREView `handleSave()` lines 185-205

4. `agenda.schema.ts`:
   - `ScheduleVisitSchema`:
     - `client_id`: uuid, required
     - `scheduled_at`: date string, required
     - `scheduled_time`: time string (HH:mm), required
     - `duration_hours`: number 1-12
     - `modality`: enum ['Presencial', 'Online']
   - Current unvalidated form: AgendaAdmin `handleSubmitSchedule()` lines 160-194

**Validation Utility (`src/lib/validate.ts`):**
- `validateForm<T>(schema, data)` — returns `{ success: true, data: T } | { success: false, errors: Record<string, string> }`
- Field-level error messages in Portuguese
- Toast integration helper: `showValidationErrors(errors)` using sonner

**Integration Points:**
- Wrap `createFeedback`, `createPDI`, `upsertFinancial`, `createVisit` mutation functions with Zod validation before Supabase call
- Return field-level errors to forms for inline display
- Use FormField molecule's error state for display

**Acceptance Criteria:**
- [ ] 4 Zod schema files created covering all form types
- [ ] `validateForm` utility created with Portuguese error messages
- [ ] All form submissions validate before Supabase calls
- [ ] Invalid submissions show field-level errors (not just toast)
- [ ] `npm run typecheck` passes
- [ ] Unit tests for each schema (valid + invalid cases)

**Files to Create:**
- `src/lib/schemas/feedback.schema.ts`
- `src/lib/schemas/pdi.schema.ts`
- `src/lib/schemas/dre.schema.ts`
- `src/lib/schemas/agenda.schema.ts`
- `src/lib/validate.ts`
- `src/lib/schemas/__tests__/feedback.schema.test.ts`
- `src/lib/schemas/__tests__/pdi.schema.test.ts`
- `src/lib/schemas/__tests__/dre.schema.test.ts`
- `src/lib/schemas/__tests__/agenda.schema.test.ts`

**Files to Modify:**
- Hook files (after STORY-03 migration) — add Zod validation to mutation functions
- `src/pages/AgendaAdmin.tsx` — validate schedule form
- `src/features/consultoria/components/DREView.tsx` — validate DRE form

**Effort:** ~4-6 hours (AI agent execution)

---

### STORY-05: Page Integration — Wire Components into Production Pages

**Goal:** Integrate all new atoms, molecules, organisms, TanStack Query hooks, and Zod validation into production pages. This is the final integration story that makes everything work together.

**Prerequisite:** STORY-02, STORY-03, STORY-04 complete

**Scope:**
- Refactor AgendaAdmin to use new component hierarchy
- Refactor DREView to use new component hierarchy
- Update remaining pages that use raw modals
- Verify end-to-end functionality

**Detailed Requirements:**

**AgendaAdmin.tsx Refactoring:**

Current: 768 LOC monolith
Target: ~350 LOC page composing organisms

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

**DREView.tsx Refactoring:**

Current: 500 LOC monolith
Target: ~200 LOC section composing organisms

1. Replace DRE table (lines 312-392) with `DRETable` organism
2. Replace modal form (lines 394-495) with `DREForm` organism using `ModalShell`
3. Replace inline accordion logic (lines 418-453) with `Accordion` atom usage in `DREForm`
4. Add Zod validation to save using `DREFormSchema`
5. Replace `Input type="month"` with `DatePicker` atom

**WizardPDI.tsx Alignment:**
- Verify WizardPDI continues using Radix Dialog (already correct)
- No changes needed unless ModalShell molecule API is preferred

**Acceptance Criteria:**
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

**Files to Modify:**
- `src/pages/AgendaAdmin.tsx` — major refactor
- `src/features/consultoria/components/DREView.tsx` — major refactor
- All pages importing from old `useData.ts` — verify imports point to new files

**Effort:** ~4-6 hours (AI agent execution)

---

## 6. Implementation Order & Timeline

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

## 7. Success Metrics

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

## 8. Risks & Mitigations

| Risk                                        | Likelihood | Impact | Mitigation                                          |
|---------------------------------------------|------------|--------|-----------------------------------------------------|
| Visual regressions from component extraction | Medium     | High   | Visual comparison screenshots before/after each story |
| TanStack Query migration breaks existing behavior | Medium | High   | Story-by-story migration; keep hook API surface identical |
| Radix Dialog modal migration conflicts with existing state | Low | Medium | Test all modal open/close/submit flows manually |
| Zod schemas too strict and block valid inputs | Low | Medium | Schemas should be permissive on optional fields; test with real data |
| Import path changes break production build | Low | High | Full `npm run build` verification after each story |

---

## 9. Out of Scope (Deferred)

- Storybook component documentation
- Complete WCAG AA audit and remediation
- TanStack Router migration
- Virtual scrolling for DataGrid
- Removal of `mx-indigo-*` legacy token aliases
- TypeScript strict mode enablement
- Mobile responsiveness overhaul
- Dark mode support

---

## 10. Revision History

| Version | Date       | Author  | Changes        |
|---------|------------|---------|----------------|
| 0.1.0   | 2026-04-15 | @pm     | Initial draft  |

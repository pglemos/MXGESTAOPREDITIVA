# Architecture — Migration Strategy

**Epic:** EPIC-UI-01 — Design System Completion & Architecture Hardening

---

## Story Sequencing

Stories MUST be executed in order due to dependencies:

```
Story 1.1 (Atoms + Molecules)
    ↓ consumed by
Story 1.2 (Organism Extraction)
    ↓ co-located with
Story 1.3 (TanStack Query Migration)
    ↓ validated by
Story 1.4 (Zod Schemas)
    ↓ integrated in
Story 1.5 (Page Integration)
```

---

## Per-Story Migration Plan

### Story 1.1: Atomic Design Foundation

**Scope:** Create 6 atoms (Select, Avatar, Tooltip, DatePicker, EmptyState, Accordion) + 2 molecules (PageHeader, StatusBadge)

**Approach:** Purely additive. No existing files modified. New components in `src/components/atoms/` and `src/components/molecules/`.

**Rollback:** Delete new files. Zero impact on existing functionality.

**Verification:**
- `npm run typecheck` passes
- `npm test` passes (new atom tests)
- Existing 63 tests still pass
- Visual: new atoms render in isolation

---

### Story 1.2: Organism Extraction

**Scope:** Extract 5 organisms from AgendaAdmin and DREView

**Approach:**
1. Create organism files that accept props matching current inline code
2. Pages continue to work — organisms are new exports, pages unchanged initially
3. Integration happens in Story 1.5

**Rollback:** Delete organism files. Pages still reference inline code.

**Verification:**
- `npm run typecheck` passes
- Organism tests pass
- Existing pages unchanged and functional

---

### Story 1.3: TanStack Query Migration

**Scope:** Install TanStack Query, decompose `useData.ts` into domain hooks, wrap all data hooks

**Approach — Incremental per hook:**
1. Install `@tanstack/react-query` + `@tanstack/react-query-devtools`
2. Create `lib/queryClient.ts` with `QueryClient` config
3. Add `QueryClientProvider` to `App.tsx` (between `AuthProvider` and `ErrorBoundary`)
4. For each hook in `useData.ts`:
   a. Create new file (e.g., `hooks/useTrainings.ts`)
   b. Implement with `useQuery`/`useMutation`
   c. Update consumers to import from new file
   d. Remove from `useData.ts`
5. Add TanStack Query to `vite.config.ts` manual chunks

**Migration order (least → most complex):**
1. `useStoreDeliveryRules` (1 query, 1 mutation)
2. `useMyPDIs` (1 query)
3. `useWeeklyFeedbackReports` (1 query)
4. `useSystemBroadcasts` (1 query)
5. `useTrainings` (1 query, 2 mutations)
6. `usePDIs` (2 queries, 4 mutations)
7. `useFeedbacks` (1 complex query, 2 mutations)
8. `useTeamTrainings` (3 parallel queries + computation)
9. `useNotifications` (1 query, 5 mutations + RPC)

**Rollback:** Revert to `useData.ts` imports. TanStack Query is additive — removing `QueryClientProvider` returns to manual fetch pattern.

**Verification:**
- `npm run typecheck` passes
- All existing 63 tests pass
- TanStack Query DevTools shows correct query states
- Network tab shows deduplication (same query not fetched twice)

---

### Story 1.4: Zod Runtime Validation

**Scope:** Create Zod schemas for all Supabase response types, integrate into query functions

**Approach:**
1. Create `src/lib/schemas/` directory with per-domain schemas
2. Add `.safeParse()` at end of each query function (inside `queryFn`)
3. Log validation errors in dev, throw in production
4. Schemas mirror types in `src/types/database.ts` and `src/features/consultoria/types.ts`

**Rollback:** Remove `lib/schemas/` directory, remove `.safeParse()` calls from query functions.

**Verification:**
- `npm run typecheck` passes
- All tests pass
- Intentionally malformed data triggers validation error log

---

### Story 1.5: Page Integration

**Scope:** Refactor AgendaAdmin.tsx and DREView.tsx to consume new organisms and molecules

**Approach — One page at a time:**
1. Refactor `AgendaAdmin.tsx`:
   - Replace inline calendar with `<AgendaCalendar>`
   - Replace inline visit cards with `<VisitCard>`
   - Replace inline modal with `<ModalShell>` molecule
   - Replace inline header with `<PageHeader>`
   - Replace inline select elements with `<Select>` atom
   - Replace inline status badges with `<StatusBadge>` molecule
   - Replace inline empty states with `<EmptyState>` atom
2. Refactor `DREView.tsx`:
   - Replace inline table with `<DRETable>`
   - Replace inline form modal with `<DREForm>` + `<ModalShell>` molecule
   - Replace inline accordion logic with `<Accordion>` atom
3. Update any other pages using repeated patterns

**Rollback:** Git revert per page. Each page refactored independently.

**Verification:**
- `npm run typecheck` passes
- All tests pass
- Visual regression: AgendaAdmin and DREView render identically to before
- `AgendaAdmin.tsx` < 400 LOC (from 768)
- `DREView.tsx` < 250 LOC (from 500)

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| TanStack Query introduces rendering bugs | DevTools + staleTime config; each hook migrated individually with existing tests as regression net |
| Modal molecule breaks existing dialog behavior | Radix Dialog provides built-in accessibility; visual parity tested with Playwright |
| Hook decomposition breaks imports | TypeScript compiler catches missing imports at build time |
| Zod schemas don't match actual Supabase responses | `.safeParse()` with logging first; schemas derived from `types/database.ts` |
| Page refactoring introduces visual regressions | Playwright e2e snapshots before/after per page |

---

## Component Size Targets

| Component | Current LOC | Target LOC | Reduction |
|-----------|-------------|------------|-----------|
| AgendaAdmin.tsx | 768 | ~350 | 54% |
| DREView.tsx | 500 | ~200 | 60% |
| useData.ts | 458 | 0 (deleted) | 100% |
| Total new organism code | 0 | ~600 | Additive |
| Total new atom/molecule code | 0 | ~400 | Additive |
| Net LOC impact | — | +400 organism +400 atom -958 page | Net reduction ~158 LOC |

---

## Page Integration Refactoring (Story 1.5)

### AgendaAdmin.tsx before/after

```
Before: 768 LOC (inline calendar, visit cards, modal, filters, metrics)
After:  ~350 LOC (imports: AgendaCalendar, VisitCard, ModalShell, PageHeader, StatusBadge, MetricsBar, Select, EmptyState)
```

### DREView.tsx before/after

```
Before: 500 LOC (inline table, form, summary cards)
After:  ~200 LOC (imports: DRETable, DREForm, ModalShell)
```

---

## Cross-References

- **Architecture Overview:** See `docs/architecture/00-overview.md`
- **Component Architecture:** See `docs/architecture/01-component-arch.md`
- **Data Layer:** See `docs/architecture/02-data-layer.md`
- **Testing & Deployment:** See `docs/architecture/04-testing-deploy.md`
- **Story Details:** See `docs/prd/02-story-1.1.md` through `docs/prd/06-story-1.5.md`

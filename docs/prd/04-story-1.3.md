# STORY-03: Server State Management — TanStack Query + Hook Decomposition

**Epic:** EPIC-UI-01 — Design System Completion & Architecture Hardening
**Prerequisites:** STORY-01 complete (can run in parallel with STORY-02)
**Estimated Effort:** 6-8 hours (AI agent execution)
**Risk:** Medium

---

## Goal

Introduce TanStack Query for server-state management and decompose the `useData.ts` mega-hook into domain-specific files with proper caching, deduplication, and optimistic updates.

## Scope

- Install `@tanstack/react-query`
- Configure QueryClient with sensible defaults
- Split `useData.ts` (458 LOC, 8 hooks) into individual domain files
- Convert each hook to use `useQuery` / `useMutation`

---

## Detailed Requirements

### TanStack Query Setup

- Install `@tanstack/react-query` (latest v5)
- Create `src/lib/query-client.ts` with QueryClient configuration:
  - `staleTime: 5 * 60 * 1000` (5 minutes)
  - `gcTime: 10 * 60 * 1000` (10 minutes)
  - `retry: 2`
  - `refetchOnWindowFocus: false`
- Wrap App with QueryClientProvider in `src/App.tsx`

**Provider Installation — App.tsx:**

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      gcTime: 10 * 60 * 1000,        // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})
```

Wrapping hierarchy: `QueryClientProvider` → `AuthProvider` → `ErrorBoundary` → `Router`

**Vite Chunk Update — `vite.config.ts:19-26`:**

```ts
'vendor-query': ['@tanstack/react-query'],
```

---

### Hook Decomposition — Target File Structure

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

---

### Conversion Pattern (per hook)

**Before (current pattern):**
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

**After (TanStack Query pattern):**
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

---

### Hook Decomposition Plan

| Hook | Current Location | Target File | Query Key Pattern | Migration Complexity |
|------|-----------------|-------------|-------------------|---------------------|
| `useTrainings` | `useData.ts:9-54` | `hooks/useTrainings.ts` | `['trainings', role]` | Low |
| `useFeedbacks` | `useData.ts:57-134` | `hooks/useFeedbacks.ts` | `['feedbacks', storeId, filters]` | Medium (role-based query builder) |
| `useMyPDIs` | `useData.ts:136-151` | Merged into `usePDIs` | `['pdis', profileId]` | Low |
| `useWeeklyFeedbackReports` | `useData.ts:153-176` | `hooks/useFeedbackReports.ts` | `['feedback-reports', storeId]` | Low |
| `usePDIs` | `useData.ts:179-252` | `hooks/usePDIs.ts` | `['pdis', storeId, role]` | Medium (reviews sub-query) |
| `useNotifications` | `useData.ts:255-338` | `hooks/useNotifications.ts` | `['notifications', profileId]` | High (mutations + RPC) |
| `useSystemBroadcasts` | `useData.ts:341-373` | `hooks/useBroadcasts.ts` | `['broadcasts']` | Low |
| `useTeamTrainings` | `useData.ts:376-425` | `hooks/useTeamTrainings.ts` | `['team-trainings', storeId]` | High (3 parallel queries + computation) |
| `useStoreDeliveryRules` | `useData.ts:428-458` | `hooks/useDeliveryRules.ts` | `['delivery-rules', storeId]` | Low |

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

---

### Supabase Query Helpers (`src/lib/supabase-query.ts`)

- `createSupabaseQueryFn<T>(queryBuilder)` — wraps Supabase query in a QueryFunction
- Standard error handling: converts PostgrestError to Error
- Type-safe response unwrapping

---

### Migration Strategy

1. Create new hook files alongside `useData.ts`
2. Update all imports in consuming pages/features to point to new files
3. Verify all consumers compile
4. Delete `useData.ts`
5. Run full test suite

---

### Existing domain hooks that remain unchanged

- `useDRE.ts` — Already well-structured (132 LOC), will be wrapped by TanStack Query in Story 1.3
- `useConsultingClients.ts` — Already well-structured (345 LOC), will be wrapped in Story 1.3
- `useAgendaAdmin.ts` — Already well-structured, will be wrapped in Story 1.3
- `useFocusTrap.ts` — Pure utility hook, no data fetching, unchanged
- `useAuth.tsx` — Context provider, wraps Supabase Auth — unchanged (not server state)

---

## Acceptance Criteria

- [ ] `@tanstack/react-query` installed and QueryClientProvider configured in App.tsx
- [ ] `src/hooks/useData.ts` deleted — all 8 hooks extracted to individual files
- [ ] All extracted hooks use TanStack Query `useQuery`/`useMutation`
- [ ] All consuming pages/features updated with new import paths
- [ ] Hook API surface preserved — consumers require zero logic changes (only import path changes)
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes — all existing tests updated for new file locations

## Files to Create

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

## Files to Modify

- `src/App.tsx` — add QueryClientProvider
- All files importing from `useData.ts` — update import paths
- `src/hooks/useData.ts` — DELETE after migration

## Files to Delete

- `src/hooks/useData.ts`

---

## Cross-References

- **PRD Overview:** See `docs/prd/00-overview.md`
- **Requirements:** See `docs/prd/01-requirements.md` (REQ-16 through REQ-19)
- **Story 1.1 (prerequisite):** See `docs/prd/02-story-1.1.md`
- **Story 1.2 (parallel):** See `docs/prd/03-story-1.2.md`
- **Story 1.4 (parallel):** See `docs/prd/05-story-1.4.md`
- **Data Layer Architecture:** See `docs/architecture/02-data-layer.md`
- **Migration Strategy:** See `docs/architecture/03-migration.md`

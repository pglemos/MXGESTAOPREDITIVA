# Supabase Data Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the application to fetch real data from Supabase, replacing the static mock data.

**Architecture:** The application state in `src/stores/main.ts` will transition from local static data to asynchronous fetching via `supabase-js`. Components will handle `isLoading` and `error` states.

**Tech Stack:** React, TypeScript, Supabase JS Client.

---

### Task 1: Verify Data Mapping
**Files:**
- Modify: `scripts/inspect-supabase-data.ts`

- [ ] **Step 1: Inspect existing database tables**
Run: `npx ts-node scripts/inspect-supabase-data.ts`
Expected: List of tables in Supabase that contain the data from `ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx`.

### Task 2: Refactor Application Store
**Files:**
- Modify: `src/stores/main.ts`

- [ ] **Step 1: Add loading and error states to the store**
- [ ] **Step 2: Implement `fetchData` function using `supabase.from(...).select('*')`**
- [ ] **Step 3: Replace initial state with empty or loading state**

### Task 3: Update Dashboard Components
**Files:**
- Modify: `src/pages/AdminDashboard.tsx`, `src/pages/ManagerDashboard.tsx`, etc.

- [ ] **Step 1: Add `useEffect` to trigger `fetchData` on mount**
- [ ] **Step 2: Add conditional rendering for loading and error states**
- [ ] **Step 3: Verify the components use the data fetched from Supabase**

---

### Self-Review
1. **Spec Coverage:** Covers integration of store, components, and Supabase client.
2. **Placeholder Scan:** No placeholders found.
3. **Type Consistency:** Used `supabase-js` standard types.

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-08-supabase-integration-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
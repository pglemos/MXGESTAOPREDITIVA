# Implementation Plan - Admin/Consultancy Command Center (AIOX Method)

Refactor the `PainelConsultor.tsx` and associated configurations to transform the admin view into a surgical operational command center for the entire network.

## Objective
Enable full control over the multi-store operation:
- **Operational View**: Real-time projection, gap analysis, and discipline status across all units.
- **Data Governance**: Capability to reprocess the base directly from the UI.
- **Rule Management**: Configuration of goals and benchmarks (20/60/33) per store within the system.

## Key Files
- `src/pages/PainelConsultor.tsx`: The primary network-wide dashboard.
- `src/pages/Reprocessamento.tsx`: Interface for data recalculation.
- `src/pages/GoalManagement.tsx`: Unified goal and benchmark configuration.
- `src/hooks/useGoals.ts`: Hook for managing store-level targets.
- `src/hooks/useData.ts`: Access to network diagnostics.

## Implementation Steps

### 1. Enhanced Network View (`PainelConsultor.tsx`)
- **Refined KPI Bar**:
    - "Total Network Sales" vs "Total Network Goal".
    - "Active Gap" (Nominal value of missing units to goal).
    - "Discipline Score" (% of stores with 100% check-in).
- **Store Performance Matrix**:
    - Column for **Operational Status** (Auto-calculated from pacing + discipline).
    - Column for **Trend** (Based on projection vs target).
    - Integrated **"Quick Actions"** per store (Send alert, View unit cockpit).

### 2. Reprocessing Engine (`Reprocessamento.tsx`)
- Implement a UI to trigger the `epic11_reprocess` logic.
- Add a "Process Cycle" button that recalculates all month-to-date metrics.
- Show a status log of the reprocessing task (Pending/In Progress/Completed).

### 3. Native Configuration Management (`GoalManagement.tsx`)
- Create a unified screen to edit:
    - **Monthly Goals**: Set nominal sales targets per store.
    - **Benchmarks**: Set custom conversion rates (Lead->Agd, etc.) if they deviate from the 20/60/33 standard.
- Remove any dependency on external spreadsheet-based configurations for these core metrics.

### 4. Logic & Hooks
- Update `useAllStoreGoals` to support `updateGoal` and `updateBenchmark` mutations.
- Ensure `getOperationalStatus` utility correctly weights both results (sales) and process (discipline).

## Verification & Testing

### Manual Verification
- Verify the "Network Gap" value updates correctly when a store goal is changed.
- Trigger a reprocessing task and verify the log entry in `reprocess_logs`.
- Change a benchmark for a specific store and check if the "Gargalo" diagnostic on that store's dashboard reacts to the new rule.
- Ensure the "Discipline" metric correctly flags stores with missing check-ins.

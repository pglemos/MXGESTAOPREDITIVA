# System Architecture - MX Performance

**Status:** ACTIVE
**Version:** 1.1 (Operational quality update)
**Responsible:** @architect (Aria)

## 1. Tech Stack
- **Frontend Framework:** React 19 (Functional Components, Hooks)
- **Build Tool:** Vite 6.2 (Fast HMR, ESBuild minification)
- **Language:** TypeScript 5.8 (Strict mode, Path aliases `@/*`)
- **Styling:** TailwindCSS 4.1 + CSS Variables + Radix UI
- **Animations:** Motion (Framer Motion) 12
- **State Management:** React Hooks (Context + Custom Hooks)
- **Database Client:** Supabase JS 2.102 (Singleton Pattern)
- **Routing:** React Router 7 (Clean URL pattern)

## 2. Directory Structure
```
/src
  /app          (Legacy/Ghost - Scheduled for removal)
  /atoms        (Design System Core)
  /molecules    (Composite UI Components)
  /organisms    (Complex Business Components)
  /features     (Domain-specific logic/UI)
  /hooks        (Business Logic Abstractions)
  /lib          (Utilities & Calculations)
  /pages        (Route entrypoints)
  /stores       (Global state)
  /test         (E2E Smoke Tests)
  /types        (Canonical Database & UI Types)
```

## 3. Core Patterns
- **Atomic Design:** Strict hierarchy (Atoms -> Molecules -> Organisms).
- **Logic Sharding:** Business logic extracted from pages into custom hooks (`useSellerMetrics`, `useTacticalPrescription`).
- **Singleton Supabase:** Single client instance to prevent authentication loops.
- **Temporal Modeling:** D-1/D-0 logic for check-in production and daily agendamento.

## 4. System-Level Technical Debt
- **[CRITICAL] Root Pollution:** Large number of legacy audit and script files in the root directory (`*.mjs`, `*.cjs`, `*.png`).
- **[HIGH] Unit Test Gap:** Strong E2E presence (Playwright) but missing unit tests for complex business calculations in `src/lib/calculations.ts`.
- **[MEDIUM] Ghost Directory:** `src/app` contains redundant logic and must be physically deleted.
- **[LOW] Dependency Drift:** Some devDependencies are slightly ahead/behind, needs lockfile cleanup.

---
**Audit Date:** April 11, 2026
**Approval:** Orion (Master Orchestrator)

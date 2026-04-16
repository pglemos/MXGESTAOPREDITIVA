# Architecture — EPIC-UI-01 Overview

> Generated: 2026-04-15 | Architect: Aria | Phase: UI Analysis & Planning
> Epic: EPIC-UI-01 — Design System Completion & Architecture Hardening

---

## Introduction

This document defines the architectural blueprint for **EPIC-UI-01: Design System Completion & Architecture Hardening** — a brownfield enhancement to MX Performance's frontend that addresses critical technical debt, completes the Atomic Design system, introduces server state management (TanStack Query), activates runtime validation (Zod), and extracts monolithic page components into reusable organisms.

### Relationship to Existing Architecture

This document **supplements** the existing `docs/brownfield-architecture.md` (513 lines of analysis). It does not replace it. Where the brownfield-architecture.md describes the **current state**, this document prescribes the **target state and migration path**. All decisions are grounded in actual codebase analysis — every hook, component, token, and page has been read and accounted for.

---

## Existing Project Analysis

### Current Project State

- **Primary Purpose:** Role-based performance management platform for automotive retail networks (4 roles: admin, gerente, vendedor, dono) with consulting CRM, DRE financial analysis, scheduling, and gamification
- **Current Tech Stack:** React 19.0 + TypeScript 5.8.2 + Vite 6.2 + Tailwind CSS v4.1 (native) + Supabase 2.102 + react-router-dom 7.13 + Motion 12 + Recharts 3.7 + CVA 0.7 + Zod 4.3 (unused) + Sonner 2.0
- **Architecture Style:** Component-based SPA with Atomic Design (partially adopted), lazy-loaded routes, role-based rendering via `RoleSwitch`
- **Deployment Method:** Vercel (`vercel --prod`) with `vercel.json`, Bun as package manager

### Identified Constraints

1. **Zero-downtime requirement** — Enhancement must be deployed incrementally; no big-bang refactor
2. **Portuguese-first UI** — All new components must use Brazilian Portuguese for labels/empty states
3. **Tailwind v4 native** — No `tailwind.config.js`; tokens defined in `@theme` blocks in `index.css`
4. **Supabase direct** — No ORM; all queries via `supabase.from().select()` pattern
5. **Lazy-loading mandate** — All pages must remain lazy-loaded via `React.lazy()`
6. **Role-based access** — New components must respect 4-role `RoleSwitch` pattern
7. **CVA pattern** — All variant styling must use `class-variance-authority` consistently
8. **`@` path alias** — All imports use `@/` prefix (configured in `vite.config.ts`)

---

## Enhancement Scope and Integration Strategy

### Enhancement Overview

**Enhancement Type:** Architectural refactoring + design system completion
**Scope:** 5 stories covering atom/molecule creation, organism extraction, TanStack Query migration, Zod activation, and page integration
**Integration Impact:** Medium — touches hooks layer, component layer, and page layer without changing routes or database schema

### Integration Approach

**Code Integration Strategy:** Incremental additive — new components are created alongside existing ones, pages are refactored one at a time to consume them, with each story independently deployable

**Database Integration:** No schema changes. TanStack Query wraps existing Supabase queries. Zod validates response shapes at hook boundaries.

**API Integration:** No new APIs. All data continues to flow through `supabase.from()` queries wrapped in TanStack Query query functions.

**UI Integration:** New organisms extracted from existing page code consume existing atoms/molecules (Typography, Button, Card, Badge, Input, Skeleton). Modal molecule wraps `@radix-ui/react-dialog` already in `package.json`.

### Compatibility Requirements

- **Existing API Compatibility:** 100% — no Supabase query changes, only query orchestration layer
- **Database Schema Compatibility:** 100% — no migrations, no new tables
- **UI/UX Consistency:** All new components use existing `mx-*` design tokens, `cn()` utility, CVA variants
- **Performance Impact:** Positive — TanStack Query adds caching, deduplication, and stale-while-revalidate. Initial bundle increase ~15KB (gzipped) for `@tanstack/react-query`.

---

## Tech Stack Alignment

### Existing Technology Stack

| Category | Technology | Version | Usage in Enhancement | Notes |
|----------|-----------|---------|---------------------|-------|
| Framework | React | 19.0 | Unchanged | Used for all components |
| Language | TypeScript | 5.8.2 | Unchanged | Strict mode for new code |
| Build | Vite | 6.2+ | Add TanStack Query to vendor chunks | `vite.config.ts:19-26` |
| Styling | Tailwind CSS | 4.1+ | Unchanged | `@theme` tokens in `index.css` |
| Routing | react-router-dom | 7.13+ | Unchanged | Lazy loading preserved |
| Animation | Motion | 12.x | Unchanged | `AnimatePresence` in organisms |
| Variants | CVA | 0.7+ | Used in all new atoms/molecules | Consistent with Button/Badge patterns |
| Dialog | @radix-ui/react-dialog | 1.1+ | Wraps Modal molecule | Already in `package.json` |
| Validation | Zod | 4.3+ | Activated for runtime schemas | Currently unused dependency |
| Icons | Lucide React | 0.575+ | Unchanged | |
| Toast | Sonner | 2.0+ | Unchanged | |
| Charts | Recharts | 3.7+ | Unchanged | |
| Testing | Bun test + Testing Library | — | New test files per component | `bun test` in `package.json:17` |
| E2E | Playwright | 1.58+ | Integration tests for organisms | `test:e2e` in `package.json:18` |

### New Technology Additions

| Technology | Version | Purpose | Rationale | Integration Method |
|-----------|---------|---------|-----------|-------------------|
| `@tanstack/react-query` | ^5.x | Server state management (caching, deduplication, background refetch, optimistic updates) | Replaces 22 manual `useState+useEffect+useCallback` hooks (TD-01); proven in brownfield React apps; minimal API surface | `npm install @tanstack/react-query`; `QueryClientProvider` in `App.tsx` |
| `@tanstack/react-query-devtools` | ^5.x | Dev-time query inspector | Debug aid for migration; tree-shaken in production | Conditional import in `App.tsx` |

**No other new dependencies.** Zod is already present. Radix Dialog is already present. Everything else exists.

---

## Cross-References

- **Component Architecture:** See `docs/architecture/01-component-arch.md`
- **Data Layer:** See `docs/architecture/02-data-layer.md`
- **Migration Strategy:** See `docs/architecture/03-migration.md`
- **Testing & Deployment:** See `docs/architecture/04-testing-deploy.md`
- **PRD:** See `docs/prd/00-overview.md`
- **Front-End Spec:** See `docs/front-end-spec.md`

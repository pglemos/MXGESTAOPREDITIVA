# MX Performance Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the **MX Performance (Gestão Preditiva)** codebase, reflecting the massive universal UI standardization (Story 6.1.2.1) and the established atomic design patterns. It serves as the definitive engineering compass for development agents.

### Document Scope
**Comprehensive documentation of the entire system**, with deep focus on:
1. **Atomic Design Layer** (comprehensive-fix track).
2. **PDI/Wizard Logic** (modulo-pdi track).
3. **Core Automation Engines** (Manager Rituals & Reports).

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-04-10 | 1.0 | Initial brownfield system mapping | Aria (@architect) |

---

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System
- **Main Entry**: `src/main.tsx` (Vite client entry)
- **Configuration**: `src/lib/config.ts`, `.env` (Supabase keys)
- **Auth Provider**: `src/hooks/useAuth.tsx` (Central Auth Context)
- **Core Business Logic**: `src/lib/calculations.ts`, `src/lib/automation/`
- **Database Connection**: `src/lib/supabase.ts`
- **UI Base**: `src/index.css` (Tailwind 4 + Custom Tokens)

### Enhancement Impact Areas (Active Tracks)
- **UI Standardization**: `src/components/atoms/`, `src/components/molecules/`
- **PDI/Wizard**: `src/features/pdi/WizardPDI.tsx`, `src/app/admin/gerente/pdi-wizard.tsx`
- **Performance/Ranking**: `src/hooks/useRanking.ts`, `src/pages/Ranking.tsx`

---

## High Level Architecture

### Technical Summary
The project is a modern **Serverless React Application** built on **React 19**, **Vite 6**, and **Tailwind 4**. It utilizes a **Client-Side Direct** pattern to interact with **Supabase** for data persistence and authentication.

### Actual Tech Stack
| Category | Technology | Version | Notes |
|----------|------------|---------|--------|
| Frontend Framework | React | 19.0.0 | High-performance client rendering |
| Build Tool | Vite | 6.2.0 | Ultra-fast HMR and build |
| Styling | Tailwind CSS | 4.1.14 | Using new @tailwindcss/vite plugin |
| Components | Radix UI | Latest | Headless primitives for accessible UI |
| Database/Auth | Supabase | 2.102.1 | Direct client-side integration |
| Animations | Motion | 12.23.24 | Smooth UI transitions |
| Icons | Lucide React | 0.575.0 | Consistent iconography |
| Testing | Bun + Playwright | 1.3+ | Fast unit and E2E testing |

---

## Source Tree and Module Organization

### Project Structure (Actual)
```text
src/
├── app/                  # Application Routes (App Router-like structure)
│   ├── admin/            # Admin-only features (Stores, PDI Config)
│   └── dashboard/        # Manager-specific views
├── components/
│   ├── atoms/            # CANONICAL UI: Standardized primitive components (Button, Input)
│   ├── molecules/        # Functional units (Card, FormField, MXScoreCard)
│   ├── organisms/        # Complex components (PowerRankingList)
│   └── ui/               # Original shadcn/ui components (LEGACY - favor atoms/)
├── features/             # Domain-specific logic
│   ├── feedback/         # Reports and Printable Feedbacks
│   └── pdi/              # Personal Development Plan (PDI) Wizard
├── hooks/                # Business logic and Supabase consumers
├── lib/                  # Utilities and Heavy Orchestration
│   ├── api/              # Low-level service wrappers
│   ├── automation/       # CRITICAL: Morning Report and Feedback Engines
│   └── validation/       # Data sanitization and business rules
├── pages/                # Views (Legacy mapping to routes)
└── stores/               # Context Providers (Finance, Users)
```

### Key Modules and Their Purpose
- **Atomic Design System**: `src/components/atoms/` - Definitive UI primitives with baked-in typography and status variants.
- **Automation Engines**: `src/lib/automation/` - Background-ready logic for generating complex reports (Matinal, Weekly).
- **PDI Wizard**: `src/features/pdi/` - Multi-step process for professional development planning.
- **Ranking Engine**: `src/hooks/useRanking.ts` - High-performance data aggregation from Supabase.

---

## Technical Debt and Known Issues

### Critical Technical Debt
1. **Component Duplication**: `src/components/ui/` vs `src/components/atoms/`. **Policy: Use `atoms/` for all new work.**
2. **State Management**: Heavy reliance on prop drilling or direct Supabase calls in multiple places. No centralized cache layer (e.g., React Query).
3. **Complex Logic in Pages**: Some files in `src/pages/` (like `VendedorHome.tsx`) are oversized (>1000 lines). **Action: Shard into features/ or hooks/.**
4. **Calculations Sync**: `src/lib/calculations.ts` has an `.orig` file, suggesting manual merge issues.

### Workarounds and Gotchas
- **Auth Provider Dualism**: Existence of `auth-provider.tsx` and `useAuth.tsx`. Ensure context consistency.
- **Tailwind 4 Tokens**: Custom prefix `gap-mx-xs` and `rounded-mx-md` must be followed (defined in `index.css`).

---

## Integration Points and External Dependencies

### External Services
| Service | Purpose | Integration |
|---------|---------|-------------|
| Supabase | DB, Auth, RLS | Client-side SDK |
| WhatsApp | Script Generation | Logic in `lib/automation/whatsapp/` |
| Resend | Email Notifications | `lib/automation/email/` |

---

## Development and Deployment
- **Local Dev**: `npm run dev` (Port 3000)
- **Deployment**: Vercel (`npm run deploy`)
- **Type Safety**: TypeScript 5.8 (Strict mode enabled)
- **Linting**: Custom token linter (`npm run lint:tokens`)

---

## Appendix - Coding Conventions (AIOX Standard)
1. **Prefer `atoms/` over `ui/`** for base components.
2. **Business logic belongs in Hooks**, not Components.
3. **Heavy computations** go to `src/lib/automation/` or `src/lib/calculations.ts`.
4. **Naming**: Use `PascalCase` for components, `camelCase` for hooks/utils.
5. **A11y**: All atoms must use Radix primitives and pass accessibility audits.

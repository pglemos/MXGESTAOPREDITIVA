# MX Gestao Preditiva — Brownfield Architecture Analysis

> Generated: 2026-04-15 | Architect: Aria | Phase: UI Analysis & Planning

---

## 1. Executive Summary

MX Gestao Preditiva (aka MX Performance) is a **role-based performance management platform** for automotive retail networks. It serves 4 distinct user roles (admin, gerente, vendedor, dono) with a consulting/CRM module, scheduling (Agenda), DRE financial views, and gamification (rankings, checkins, PDI).

The application is a mature brownfield SPA built on **React 19 + TypeScript + Vite 6 + Tailwind CSS v4** with a custom design token system. The codebase follows **Atomic Design** for UI primitives and uses Supabase for auth/database.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.x |
| Language | TypeScript | ~5.8.2 |
| Build | Vite | 6.2+ |
| Styling | Tailwind CSS | 4.1+ (with @tailwindcss/vite plugin) |
| Routing | react-router-dom | 7.13+ |
| State | React hooks (useState/useEffect) + Supabase client | — |
| Auth | Supabase Auth (email/password) | 2.102+ |
| Database | Supabase Postgres (via `postgres` driver + supabase-js) | 3.4+ |
| Animation | Motion (framer-motion successor) | 12.x |
| Charts | Recharts | 3.7+ |
| Icons | Lucide React | 0.575+ |
| Validation | Zod | 4.3+ |
| Notifications | Sonner | 2.0+ |
| Variants | class-variance-authority (CVA) | 0.7+ |
| Utilities | clsx + tailwind-merge | 2.1+ / 3.5+ |
| Date | date-fns | 4.1+ |
| Excel Export | xlsx | 0.18+ |
| Dialogs | @radix-ui/react-dialog | 1.1+ |
| Testing | Bun test + Playwright + Testing Library | — |
| Deployment | Vercel | — |

---

## 3. Project Structure

```
src/
├── App.tsx                      # Root: routing, auth guard, error boundary
├── index.css                    # Tailwind v4 @theme tokens + custom utilities
├── assets/                      # SVG logo, images
├── components/
│   ├── Layout.tsx               # Main shell: header, sidebar, drawer, mobile nav
│   ├── LegacyModuleShell.tsx    # Page content wrapper (bg ornaments + padding)
│   ├── atoms/                   # 6 primitives
│   │   ├── Badge.tsx            # Variant badges (CVA)
│   │   ├── Button.tsx           # Variant buttons (CVA, asChild support)
│   │   ├── Input.tsx            # Styled input
│   │   ├── Skeleton.tsx         # Loading placeholder
│   │   ├── Textarea.tsx         # Styled textarea
│   │   └── Typography.tsx       # Polymorphic text (CVA, variant + tone)
│   ├── molecules/               # 5 composed components
│   │   ├── Breadcrumb.tsx       # Navigation breadcrumb
│   │   ├── Card.tsx             # Card + CardHeader/Title/Description/Content/Footer
│   │   ├── FormField.tsx        # Label + Input + error with icon support
│   │   ├── MXScoreCard.tsx      # KPI card with skeleton (memoized)
│   │   └── MXScoreCard.test.ts  # Unit test
│   ├── organisms/               # 1 complex component
│   │   └── DataGrid.tsx         # Responsive table (desktop) / cards (mobile)
│   └── admin/
│       └── AdminNetworkView.tsx # Admin-specific component
├── pages/                       # 39 page components (all lazy-loaded)
├── features/
│   ├── consultoria/
│   │   ├── types.ts             # 11 interfaces (Client, Visit, DRE, etc.)
│   │   └── components/
│   │       ├── DREView.tsx      # Full DRE financial statement (500 LOC)
│   │       └── GoogleCalendarView.tsx # Google Calendar integration
│   ├── feedback/
│   │   ├── WeeklyStoreReport.tsx
│   │   └── PrintableFeedback.tsx
│   └── pdi/
│       └── WizardPDI.tsx        # PDI creation wizard
├── hooks/                       # 22 hooks (data + auth + domain logic)
├── lib/
│   ├── utils.ts                 # cn(), toCamelCase, toSnakeCase, getAvatarUrl
│   ├── supabase.ts              # Supabase client init
│   ├── calculations.ts          # MX Score / Funnel calculations
│   ├── export.ts                # XLSX export utilities
│   ├── api/                     # API helpers (manager, stores)
│   ├── services/                # Checkin service
│   ├── automation/              # Cron, email, reports, training engines
│   └── validation/              # Checkin & legacy normalizer validators
└── types/
    ├── database.ts              # Supabase table type definitions
    ├── index.ts                 # Re-exports
    └── postgres.d.ts            # Postgres type augmentations
```

---

## 4. Routing Architecture

### 4.1 Route Map

**Total Routes: ~35** (39 page files, some redirects)

| Path | Role | Page |
|------|------|------|
| `/login` | Public | Login |
| `/` | All | RoleRedirect |
| `/home` | Vendedor/Gerente | VendedorHome |
| `/checkin` | Vendedor | Checkin |
| `/historico` | Vendedor/Gerente | Historico |
| `/ranking` | All | Ranking |
| `/treinamentos` | Role-switched | Vendedor/Gerente/Consultor Treinamentos |
| `/feedback` | Role-switched | Vendedor/Gerente Feedback |
| `/notificacoes` | Role-switched | Notificacoes/ConsultorNotificacoes |
| `/perfil` | All | Perfil |
| `/loja`, `/loja/:storeSlug` | Gerente | DashboardLoja |
| `/equipe` | Gerente/Admin | Equipe |
| `/metas` | Gerente/Admin | GoalManagement |
| `/funil` | Gerente/Admin | Funil |
| `/pdi` | Role-switched | Vendedor/Gerente PDI |
| `/rotina` | Gerente/Admin | RotinaGerente |
| `/painel` | Admin | PainelConsultor |
| `/lojas` | Admin/Dono | Lojas |
| `/agenda` | Admin | AgendaAdmin |
| `/consultoria` | Admin | Redirect → /consultoria/clientes |
| `/consultoria/clientes` | Admin | ConsultoriaClientes |
| `/consultoria/clientes/:clientId` | Admin | ConsultoriaClienteDetalhe |
| `/consultoria/clientes/:clientId/visitas/:visitNumber` | Admin | ConsultoriaVisitaExecucao |
| `/produtos` | Admin | ProdutosDigitais |
| `/configuracoes` | Admin | Configuracoes |
| `/configuracoes/operacional` | Admin | OperationalSettings |
| `/configuracoes/reprocessamento` | Admin | Reprocessamento |
| `/relatorio-matinal` | Admin/Gerente | MorningReport |
| `/relatorios/performance-vendas` | Admin | SalesPerformance |
| `/relatorios/performance-vendedores` | Admin | SellerPerformance |
| `/auditoria` | Gerente/Admin | AiDiagnostics |

### 4.2 Role-Based Access Pattern

Access control uses a **RoleSwitch** component at the route level:

```tsx
<RoleSwitch 
  vendedor={<VendedorPDI />} 
  gerente={<GerentePDI />} 
  dono={<GerentePDI />} 
  admin={<GerentePDI />} 
/>
```

Fallback roles without explicit admin prop default to vendedor. Unauthorized roles get `<Navigate to="/home" replace />`.

### 4.3 Route Guards

- `ProtectedRoute`: Checks `profile` from `useAuth()`, redirects to `/login` if absent
- `RoleRedirect`: Redirects `/` based on role (admin→/painel, dono→/lojas, gerente→/loja, vendedor→/home)
- Legacy redirects: `/settings` → `/configuracoes`, `/funnel` → `/funil`, etc.

---

## 5. Design System Analysis

### 5.1 Token Architecture (Tailwind v4 `@theme`)

**Color Tokens:**
- Brand: `--color-brand-primary` (#22C55E green), `--color-brand-secondary` (#0D3B2E dark green)
- Status: success/warning/error/info with surface variants
- Typography: primary/secondary/tertiary/label
- Surface: default/alt/overlay/elevated
- Border: default/subtle/strong
- Green scale: 50-950 (brand palette)
- Legacy indigo aliases → green (migration remnant)

**Spacing Tokens:** `mx-0` through `mx-5xl` (0 to 12rem) + layout-specific tokens

**Radius Tokens:** `mx-sm` (0.5rem) through `mx-4xl` (3rem) + `mx-full`

**Shadow Tokens:** `mx-sm` through `mx-elite` + semantic glows

**Typography Scale:** nano(8px), micro(9px), tiny(10px), huge(12rem)

### 5.2 Component Inventory

| Layer | Count | Components |
|-------|-------|-----------|
| Atoms | 6 | Typography, Button, Input, Badge, Skeleton, Textarea |
| Molecules | 5 | Card (6 sub-components), MXScoreCard, FormField, Breadcrumb, MXScoreCard.test |
| Organisms | 1 | DataGrid |
| Admin | 1 | AdminNetworkView |
| Feature | 3 | DREView, GoogleCalendarView, WizardPDI, WeeklyStoreReport, PrintableFeedback |

### 5.3 CVA Variant Patterns

Atoms use `class-variance-authority` for type-safe variant styling:
- **Button**: 8 variants (primary/secondary/success/warning/info/danger/outline/ghost) × 4 sizes
- **Badge**: 8 variants mirroring Button
- **Typography**: 7 variants (h1/h2/h3/p/caption/tiny/mono) × 7 tones (default/brand/success/warning/info/error/muted/white)

### 5.4 Pattern: Polymorphic Typography

Typography uses an `as` prop for semantic HTML element control, defaulting based on variant (caption/tiny/mono → span, else variant name as tag).

---

## 6. Layout Architecture

### 6.1 Shell Structure

```
┌─────────────────────────────────────────────────────┐
│ HEADER (sticky, white, h-mx-header/80px)            │
│ [Logo] MX PERFORMANCE    [StoreSwitch] [🔍] [🔔] [👤]│
├──────┬──────────────────────────────────────────────┤
│      │                                              │
│SIDE  │  MAIN CONTENT AREA                           │
│BAR   │  (Outlet — renders page)                     │
│(w-20)│  bg-white rounded-3xl shadow                 │
│      │                                              │
│ icon │                                              │
│ icon │                                              │
│ icon │                                              │
│      │                                              │
│[logout]                                              │
├──────┴──────────────────────────────────────────────┤
│ MOBILE BAR (fixed bottom, md:hidden)                │
│ [Home] [Checkin] [MENU] [Ranking] [Profile]         │
└─────────────────────────────────────────────────────┘
```

### 6.2 Navigation Configuration

Navigation is defined via `navConfig: Record<string, NavCategory[]>` keyed by role:

- **admin**: 3 categories (Governança MX: 7 items, Rituais MX: 7 items, Sustentação: 2 items)
- **dono**: 2 categories (Visão Executiva: 4 items, Acompanhamento: 2 items)
- **gerente**: 2 categories (Operação Loja: 4 items, Gestão de Gente: 3 items)
- **vendedor**: 2 categories (Meu Ritual: 4 items, Evolução: 3 items)

### 6.3 Sidebar Drawer Pattern

Clicking a category icon opens a hover-sensitive drawer panel (AnimatePresence + motion.div) with sub-items. The drawer uses `onMouseLeave` to auto-close.

### 6.4 Mobile Bottom Bar

A fixed bottom navigation bar with role-adaptive quick links + a centered "hamburger" button that opens a full-screen bottom sheet.

---

## 7. Data Layer Architecture

### 7.1 Auth Hook (`useAuth.tsx`)

- Context-based auth provider wrapping the entire app
- Supabase session management + `users` table profile fetch
- Multi-store membership resolution with `activeStoreId`
- Dev bypass mode via localStorage for development
- Zero-trust validation: checks membership on every login
- Role normalization: admin/consultor → admin, dono/owner → dono, gerente/manager → gerente

### 7.2 Data Hooks Pattern

All data hooks follow a consistent pattern:
```typescript
function useXxx() {
  const { profile, storeId, role } = useAuth()
  const [data, setData] = useState(...)
  const [loading, setLoading] = useState(true)
  
  const fetch = useCallback(async () => {
    // role-based query construction
    // supabase.from('table').select().eq(...)
  }, [deps])
  
  useEffect(() => { fetch() }, [fetch])
  
  return { data, loading, error, refetch: fetch, ...mutators }
}
```

**Key hooks (22 total):**
- `useAuth` — Auth state + role/membership resolution
- `useData` — Feedbacks, PDIs, Notifications, Trainings, Team Trainings, Delivery Rules, System Broadcasts
- `useTeam` — Team members + store data
- `useStoreSales` — Store sales metrics
- `useGoals` — Goal management
- `useRanking` — Seller rankings
- `useCheckins` — Daily check-in data
- `useCheckinAuditor` — Check-in audit/validation
- `useSellerMetrics` — Individual seller KPIs
- `useManagerRoutine` — Manager routine tracking
- `usePDI_MX` — PDI management
- `useTacticalPrescription` — AI tactical recommendations
- `useNetworkHierarchy` — Multi-store hierarchy
- `useOperationalSettings` — Operational config
- `useConsultingClients` — Consulting CRM client management
- `useConsultingAgenda` — Google Calendar integration for consulting
- `useDRE` — DRE financial statement data + compute
- `useAgendaAdmin` — Agenda page state management

### 7.3 Supabase Integration

- Client initialized in `src/lib/supabase.ts`
- Direct table queries via `supabase.from('table')` pattern
- No ORM or query abstraction layer
- Some RPC calls: `supabase.rpc('send_broadcast_notification', ...)`
- Foreign key joins: `select('*, seller:users!fkey(name)')`
- Soft delete pattern: `active` flag on stores/users

---

## 8. Feature Modules

### 8.1 Consultoria CRM

**Routes:** `/consultoria/*` (admin-only)

**Domain Types (`features/consultoria/types.ts`):**
- `ConsultingClient` — Client with CNPJ, status, modality
- `ConsultingClientUnit` — Multi-unit support
- `ConsultingClientContact` — Contact persons
- `ConsultingAssignment` — Consultant assignment (responsavel/auxiliar/viewer)
- `ConsultingVisit` — Visit with 7-step methodology, checklist, status tracking
- `ConsultingFinancial` — Legacy financial summary
- `DREFinancial` — Detailed DRE with ~40 financial fields
- `DREComputed` — Auto-calculated DRE indicators
- `ConsultingMethodologyStep` — Visit methodology template

**Components:**
- `DREView.tsx` — Full DRE financial statement with annual 12-month table, CRUD modal, section collapsibles, computed indicators
- `GoogleCalendarView.tsx` — Google Calendar API integration for event sync

### 8.2 Agenda Admin

**Route:** `/agenda` (admin-only)

A comprehensive scheduling page with:
- Month calendar view with visit dots
- Date/status filter pills
- Metrics dashboard (total/agendadas/em andamento/concluidas/canceladas)
- Visit list grouped by date with relative labels
- Day detail sidebar panel
- Schedule modal with client selection, date/time, duration, consultant assignment
- Visit lifecycle: agendada → em_andamento → concluida | cancelada

**Hook:** `useAgendaAdmin.ts` — Manages all state, Supabase queries, filtering, calendar computation

### 8.3 Performance & Gamification

- **Checkin** (`/checkin`) — Daily metric input (leads, agendamentos, visitas, vendas)
- **Ranking** (`/ranking`) — Leaderboard
- **Funil** (`/funil`) — Sales funnel visualization
- **MX Score** — Computed diagnostic score via `lib/calculations.ts`
- **PDI** — Personal Development Plan with wizard, skills assessment, action tracking

---

## 9. Build Configuration

### 9.1 Vite Config

- Plugins: React + Tailwind CSS (v4 native integration)
- Path alias: `@` → `src/`
- Build target: `esnext`, minify with `esbuild`
- CSS code splitting enabled
- Manual chunk splitting:
  - `vendor-react`: react, react-dom, react-router-dom
  - `vendor-utils`: date-fns, clsx, tailwind-merge
  - `vendor-ui`: lucide-react, motion, sonner
  - `vendor-charts`: recharts
  - `vendor-export`: xlsx
  - `vendor-supabase`: @supabase/supabase-js

### 9.2 Lazy Loading

All 39 pages are lazy-loaded via `React.lazy()` with `Suspense` fallback (custom spinner).

---

## 10. Technical Debt & Issues

### 10.1 Critical Issues

| ID | Area | Issue | Severity |
|----|------|-------|----------|
| TD-01 | Architecture | **No state management layer** — All data flows through individual hooks with duplicated fetch/mutation logic. No React Query/SWR for cache invalidation, optimistic updates, or stale-while-revalidate. | High |
| TD-02 | Types | **No Zod runtime validation** — Zod is a dependency but unused in hooks. Supabase responses cast with `as Type` without runtime validation. | Medium |
| TD-03 | Components | **Organism layer severely underpopulated** — Only 1 organism (DataGrid). Complex UIs (AgendaAdmin 768 LOC, DREView 500 LOC) are monolithic page components instead of composed organisms. | High |
| TD-04 | Routing | **No route-level code splitting boundaries** — All routes under a single `<Layout>` outlet. Feature modules could have separate bundles. | Medium |
| TD-05 | Accessibility | **Missing focus trap on modals** — DREView modal and AgendaAdmin modal lack consistent focus trapping (only DREView uses `useFocusTrap` partially). | Medium |
| TD-06 | Design System | **Legacy indigo→green aliases** in tokens suggest incomplete migration. Token cleanup needed. | Low |
| TD-07 | Hooks | **useData.ts is 458 LOC mega-hook file** — Contains 7 unrelated hooks in a single file. Should be split per domain. | Medium |
| TD-08 | Auth | **Dev bypass via localStorage** — Security risk if accidentally deployed. No environment guard beyond `import.meta.env.DEV`. | Low |
| TD-09 | Components | **Inconsistent modal patterns** — Some use Radix Dialog, others use raw div overlay. No shared Modal organism. | Medium |
| TD-10 | Performance | **No virtualization** for long lists (DataGrid renders all rows). No pagination hooks for large datasets. | Medium |

### 10.2 Design System Gaps

| Gap | Description |
|-----|-------------|
| No Select/Dropdown atom | All dropdowns use raw `<select>` elements (AgendaAdmin, DREView, Layout store switcher) |
| No Modal/Dialog organism | Modals built inline with raw div overlays |
| No Tabs atom | Tab-like navigation built inline when needed |
| No Toast/Alert organism | Relies entirely on Sonner (acceptable but no custom wrapper) |
| No Avatar atom | Avatar rendering duplicated in Layout |
| No Tooltip atom | Tooltips built via CSS `group-hover` patterns |
| No Accordion/Collapse atom | Collapsible sections in DREView built inline |
| No DatePicker atom | Date inputs use native `<input type="date/time">` |
| No EmptyState organism | Empty states built ad-hoc per page |
| No PageHeader molecule | Page headers duplicated across all pages with same pattern |

---

## 11. Improvement Areas

### 11.1 Architecture Improvements

1. **Extract shared modal organism** — Create `<Modal>` organism wrapping Radix Dialog for consistency
2. **Split useData.ts** into domain-specific hook files (`useFeedbacks.ts`, `usePDIs.ts`, `useNotifications.ts`, etc.)
3. **Add React Query / TanStack Query** for server state management with cache invalidation, optimistic updates, and background refetching
4. **Create PageHeader molecule** — Repeated pattern: title + subtitle + action buttons
5. **Create EmptyState molecule** — Standardized empty state with icon + message + optional CTA
6. **Add Zod schemas** for Supabase response validation at hook boundaries
7. **Create feature-level route wrappers** with error boundaries per module

### 11.2 Component Library Expansion

Priority atoms/molecules to build:
1. **Select** atom — CVA-styled select with consistent look
2. **Avatar** atom — Image/initial fallback with sizes
3. **Tooltip** atom — Accessible tooltip via Radix
4. **Tabs** molecule — Tab navigation
5. **Modal** organism — Standard dialog shell with focus trap
6. **PageHeader** molecule — Title + subtitle + actions bar
7. **EmptyState** molecule — Empty data display
8. **Accordion** molecule — Collapsible sections
9. **DatePicker** molecule — Calendar-based date selection (reusable from Agenda patterns)
10. **StatusBadge** molecule — Visit/status-specific badges with dot indicators

### 11.3 Performance Improvements

1. Add `React.memo` to page components receiving stable props
2. Implement virtualization for DataGrid with `@tanstack/react-virtual`
3. Add pagination hooks for consulting clients and visit lists
4. Debounce filter changes in AgendaAdmin
5. Consider `startTransition` for non-urgent state updates

### 11.4 Accessibility Improvements

1. Add consistent focus trapping to all modals
2. Add `aria-live` regions for dynamic content updates (filtering, loading states)
3. Ensure all form controls have associated labels (some raw selects in AgendaAdmin lack proper labeling)
4. Add keyboard navigation support for calendar grid
5. Add skip-links for sidebar navigation sections

### 11.5 Developer Experience

1. Add Storybook for component documentation and visual testing
2. Create a page template/generator CLI for new pages
3. Extract page header pattern into shared component
4. Add MSW (Mock Service Worker) for API mocking in tests
5. Consider extracting the navigation config into a separate file for clarity

---

## 12. Page Inventory (39 pages)

| Page File | Route | Role | LOC Estimate | Complexity |
|-----------|-------|------|-------------|------------|
| AgendaAdmin | /agenda | Admin | ~768 | Very High |
| DREView (feature) | embedded | Admin | ~500 | Very High |
| ConsultoriaClienteDetalhe | /consultoria/clientes/:id | Admin | — | High |
| ConsultoriaVisitaExecucao | /consultoria/.../visitas/:n | Admin | — | High |
| ConsultoriaClientes | /consultoria/clientes | Admin | — | Medium |
| DashboardLoja | /loja | Gerente | — | High |
| PainelConsultor | /painel | Admin | — | High |
| Lojas | /lojas | Admin/Dono | — | Medium |
| Equipe | /equipe | Gerente/Admin | — | Medium |
| GoalManagement | /metas | Gerente/Admin | — | Medium |
| Funil | /funil | Gerente/Admin | — | Medium |
| VendedorHome | /home | Vendedor | — | Medium |
| Checkin | /checkin | Vendedor | — | Medium |
| Login | /login | Public | — | Low |
| NotFound | * | All | — | Low |
| Configuracoes | /configuracoes | Admin | — | Low |
| Perfil | /perfil | All | — | Low |

---

## 13. Integration Points

| Integration | Direction | Implementation |
|-------------|-----------|---------------|
| Supabase Auth | Inbound | Email/password auth, session management |
| Supabase DB | Inbound/Outbound | Direct table queries, RPC functions |
| Google Calendar API | Outbound | OAuth flow, event read/sync via `useConsultingAgenda` |
| Vercel | Deployment | `vercel --prod` via npm script |
| WhatsApp | Outbound | Script generator in `lib/automation/whatsapp/` |
| Email (Resend) | Outbound | Weekly feedback + matinal report templates |
| XLSX Export | Outbound | Client-side Excel generation via `xlsx` library |

---

## 14. Key Architectural Decisions

1. **Atomic Design adopted but underutilized** — Atoms/molecules are solid, but organism layer has only DataGrid. Complex pages are monolithic.
2. **No global state store** — Everything is hook-local with prop drilling. Works for current scale but creates data duplication.
3. **Server state = client state** — No distinction between server-cached data and UI state. Leads to unnecessary refetches.
4. **Tailwind v4 native** — Using `@theme` blocks for tokens, `@utility` for custom utilities. No `tailwind.config.js`.
5. **Motion for animations** — Consistent use of `motion/react` for enter/exit animations with `AnimatePresence`.
6. **Lazy loading everything** — All pages lazy-loaded, which is excellent for initial bundle size.
7. **Role-based rendering at route level** — `RoleSwitch` component pattern is clean and explicit.
8. **Portuguese-first UI** — All user-facing text in Brazilian Portuguese. No i18n framework.

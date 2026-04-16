# Front-End UI/UX Specification — MX Performance

**Epic:** EPIC-UI-01 — Design System Completion & Architecture Hardening
**Status:** ACTIVE
**Version:** 2.0
**Date:** April 15, 2026
**Author:** @ux-design-expert (Uma)
**Template:** front-end-spec-tmpl v1.0

---

## Table of Contents

1. [UX Goals & Principles](#1-ux-goals--principles)
2. [Information Architecture](#2-information-architecture)
3. [Design System Specification](#3-design-system-specification)
4. [Component Specifications](#4-component-specifications)
5. [Interaction Patterns](#5-interaction-patterns)
6. [Responsive Behavior](#6-responsive-behavior)
7. [Accessibility Requirements](#7-accessibility-requirements)

---

## 1. UX Goals & Principles

### 1.1 Target Personas

#### Persona 1: Admin / Consultor (Administrator)
- **Role:** `admin`
- **Profile:** External consultant managing multiple client stores. Power user with daily agenda management, client CRM, and store diagnostics.
- **Primary Tasks:** Schedule/manage consultoria visits (Agenda), manage client CRM (`/consultoria/clientes`), view admin dashboard (`/painel`), configure operational settings, manage goals/benchmarks.
- **Key Pages:** `/painel`, `/agenda`, `/consultoria/clientes`, `/consultoria/clientes/:id`, `/lojas`, `/metas`, `/configuracoes`
- **UX Needs:** Dense information display, batch operations, calendar-centric workflow, cross-store visibility.
- **Navigation:** Full access to "Governança MX", "Rituais MX", and "Sustentação" categories.

#### Persona 2: Gerente (Store Manager)
- **Role:** `gerente`
- **Profile:** Store-level manager responsible for daily operations, team performance, and ritual execution.
- **Primary Tasks:** Monitor store dashboard (`/loja`), manage team (`/equipe`), execute daily routine (`/rotina`), manage feedback/PDI, assign trainings.
- **Key Pages:** `/loja`, `/equipe`, `/rotina`, `/ranking`, `/feedback`, `/pdi`, `/treinamentos`
- **UX Needs:** Quick status overview, action-oriented cards, team performance visibility, notification of overdue tasks.
- **Navigation:** "Operação Loja" and "Gestão de Gente" categories.

#### Persona 3: Vendedor (Salesperson)
- **Role:** `vendedor`
- **Profile:** Frontline salesperson performing daily check-ins, tracking personal metrics, and following development plans.
- **Primary Tasks:** Daily check-in (`/checkin`), view history (`/historico`), track ranking (`/ranking`), access feedback/PDI/trainings.
- **Key Pages:** `/home`, `/checkin`, `/historico`, `/ranking`, `/feedback`, `/pdi`
- **UX Needs:** Simple, mobile-first interface, large touch targets, minimal cognitive load, gamification elements (ranking, badges).
- **Navigation:** "Meu Ritual" and "Evolução" categories.

#### Persona 4: Dono (Owner)
- **Role:** `dono`
- **Profile:** Business owner with executive visibility across their stores. Read-heavy role with high-level metrics.
- **Primary Tasks:** View store performance, track goals, monitor funnels, read reports.
- **Key Pages:** `/lojas`, `/loja`, `/metas`, `/funil`, `/relatorio-matinal`, `/feedback`
- **UX Needs:** Executive dashboards, multi-store comparison, clean data visualization, minimal editing interfaces.
- **Navigation:** "Visão Executiva" and "Acompanhamento" categories.

### 1.2 Usability Goals

| Goal | Metric | Target |
|---|---|---|
| Task completion rate | Core workflows (checkin, scheduling, feedback) | >95% |
| Time to complete daily check-in | From app open to submission | <60 seconds |
| Mobile usability | Touch target compliance (44px minimum) | 100% |
| Error recovery | Users can undo/cancel destructive actions | All destructive actions confirmed |
| Learnability | New users complete first check-in without help | Zero training required |
| Consistency | All forms use same validation pattern | 100% Zod coverage post-migration |

### 1.3 Design Principles

1. **Mobile-First, Elite Desktop** — Every feature works on mobile first; desktop receives enhanced density and multi-panel layouts.
2. **Green Identity** — Brand green (#22C55E) is the primary accent. Use sparingly for CTAs, active states, and positive metrics.
3. **Bold Typography Hierarchy** — Uppercase, black-weight headings with tight tracking create the MX signature. Never mix weights below `font-bold`.
4. **Dark Accents on White** — The workspace is white-based for readability; dark accents (`mx-black`, `brand-secondary`) provide contrast and structure.
5. **Progressive Disclosure** — Show essential information first; use drawers, modals, and accordions for detail layers.
6. **Atomic Composition** — Every UI element traces to a design system atom. No inline styles for spacing/color/radius.
7. **Role-Adaptive Navigation** — The sidebar/drawer and bottom bar dynamically configure per role. Users never see navigation irrelevant to their role.
8. **Motion with Purpose** — Animate to communicate state changes (enter/exit, reorder, expand). Respect `prefers-reduced-motion`.

---

## 2. Information Architecture

### 2.1 Site Map (Mermaid)

```mermaid
graph TD
    ROOT[MX Performance] --> AUTH[Auth Layer]
    ROOT --> LAYOUT[App Layout]

    AUTH --> LOGIN[/login]

    LAYOUT --> ADMIN_SIDE[Admin Sidebar]
    LAYOUT --> GERENTE_SIDE[Gerente Sidebar]
    LAYOUT --> VENDEDOR_SIDE[Vendedor Sidebar]
    LAYOUT --> DONO_SIDE[Dono Sidebar]

    ADMIN_SIDE --> A1[/painel - Admin Dashboard]
    ADMIN_SIDE --> A2[/lojas - Store List]
    ADMIN_SIDE --> A3[/agenda - Visit Calendar]
    ADMIN_SIDE --> A4[/consultoria/clientes - CRM List]
    ADMIN_SIDE --> A5[/metas - Goal Management]
    ADMIN_SIDE --> A6[/relatorios/performance-vendas - Benchmarks]
    ADMIN_SIDE --> A7[/funil - Funnel View]
    ADMIN_SIDE --> A8[/checkin - Daily Check-in]
    ADMIN_SIDE --> A9[/ranking - Arena Ranking]
    ADMIN_SIDE --> A10[/relatorio-matinal - Morning Report]
    ADMIN_SIDE --> A11[/feedback - Feedback Hub]
    ADMIN_SIDE --> A12[/treinamentos - Trainings]
    ADMIN_SIDE --> A13[/produtos - Digital Products]
    ADMIN_SIDE --> A14[/notificacoes - Notifications]
    ADMIN_SIDE --> A15[/configuracoes/operacional - Operational Settings]
    ADMIN_SIDE --> A16[/configuracoes - System Settings]

    A4 --> A4D[/consultoria/clientes/:id - Client Detail]
    A4D --> A4D_TAB1[Tab: Overview]
    A4D --> A4D_TAB2[Tab: Visits]
    A4D --> A4D_TAB3[Tab: Financial / DRE]

    GERENTE_SIDE --> G1[/loja - Store Dashboard]
    GERENTE_SIDE --> G2[/equipe - Team Management]
    GERENTE_SIDE --> G3[/rotina - Daily Routine]
    GERENTE_SIDE --> G4[/ranking - Arena Ranking]
    GERENTE_SIDE --> G5[/feedback - Structured Feedback]
    GERENTE_SIDE --> G6[/pdi - PDI Management]
    GERENTE_SIDE --> G7[/treinamentos - Trainings]

    VENDEDOR_SIDE --> V1[/home - Seller Home]
    VENDEDOR_SIDE --> V2[/checkin - Daily Check-in]
    VENDEDOR_SIDE --> V3[/historico - History]
    VENDEDOR_SIDE --> V4[/ranking - Arena Ranking]
    VENDEDOR_SIDE --> V5[/feedback - My Feedback]
    VENDEDOR_SIDE --> V6[/pdi - My PDI]
    VENDEDOR_SIDE --> V7[/treinamentos - My Trainings]

    DONO_SIDE --> D1[/lojas - My Stores]
    DONO_SIDE --> D2[/loja - Store Performance]
    DONO_SIDE --> D3[/metas - Goals]
    DONO_SIDE --> D4[/funil - Funnel]
    DONO_SIDE --> D5[/relatorio-matinal - Morning Report]
    DONO_SIDE --> D6[/feedback - Feedback/PDI]

    LAYOUT --> SHARED[Shared Routes]
    SHARED --> S1[/perfil - User Profile]
    SHARED --> S2[/notificacoes - Notifications]
```

### 2.2 Navigation Structure

#### Desktop: Icon Sidebar + Hover Drawer

```
┌─────────────────────────────────────────────────────────┐
│ HEADER (h-mx-header = 80px, sticky)                     │
│ [Logo] [Store Switcher] [Search] [Notifications] [User] │
├──────┬──────────────────────────────────────────────────┤
│ SIDE │ WORKSPACE (rounded-mx-3xl, white, shadow-mx-sm) │
│ BAR  │                                                    │
│ 80px │  ┌──────────────────────────────────────────────┐│
│      │  │ <Outlet /> — Page Content                    ││
│ Icons│  │                                               ││
│ +    │  │                                               ││
│ Draw │  │                                               ││
│ er   │  └──────────────────────────────────────────────┘│
│      │                                                    │
│[Logo │ DRAWER (280px, animated, opens on icon click)     │
│ out] │ Shows sub-items for active category               │
└──────┴──────────────────────────────────────────────────┘
```

**Behavior:**
- Sidebar shows category icons only (80px width, `w-mx-20`)
- Clicking a category icon opens the drawer (280px, `w-mx-sidebar-expanded`) with sub-items
- Clicking same category again closes the drawer
- `mouseLeave` on the entire sidebar+drawer area closes the drawer
- Active category icon gets `bg-brand-secondary text-white` styling
- Drawer position: fixed, left offset 136px (`--spacing-mx-layout-drawer-left`)

#### Mobile: Bottom Navigation Bar

```
┌─────────────────────────────────┐
│                                 │
│   PAGE CONTENT                  │
│   (pb-20 for bottom bar)        │
│                                 │
├─────────────────────────────────┤
│ [Home] [Team/Check] [MENU] [🏆] [👤] │
│    Dark bg (mx-black)           │
│    Rounded corners              │
│    Center button elevated       │
└─────────────────────────────────┘
```

**Behavior:**
- Fixed bottom bar: `bg-mx-black`, `rounded-mx-2xl`, 120px height (`h-mx-2xl`)
- Center "Menu" button is elevated (`-translate-y-1`), green (`bg-brand-primary`), larger
- Bottom bar items change by role:
  - **Vendedor:** Home, Checkin, [Menu], Ranking, Profile
  - **Gerente/Admin:** Home, Team, [Menu], Ranking, Profile
  - **Dono:** Home, Stores, [Menu], Ranking, Profile
- Full menu opens as a bottom sheet modal with spring animation

### 2.3 Role-Based Access Matrix

| Route | Admin | Gerente | Vendedor | Dono |
|---|:---:|:---:|:---:|:---:|
| `/painel` | R/W | — | — | — |
| `/lojas` | R/W | — | — | R |
| `/loja` | R/W | R/W | — | R |
| `/agenda` | R/W | — | — | — |
| `/consultoria/*` | R/W | — | — | — |
| `/equipe` | R/W | R/W | — | — |
| `/checkin` | R | R/W | R/W | — |
| `/ranking` | R | R | R | R |
| `/metas` | R/W | — | — | R |
| `/feedback` | R/W | R/W | R | R |
| `/pdi` | R/W | R/W | R | R |
| `/configuracoes` | R/W | — | — | — |
| `/home` | — | — | R | — |
| `/historico` | — | — | R | — |
| `/rotina` | — | R/W | — | — |

### 2.4 Key Page Layouts

#### `/agenda` — Calendar Grid + Visit List

```
┌───────────────────────────────────────────────────────┐
│ PAGE HEADER                                          │
│ [Green Bar] Agenda MX          [Metrics Cards] [+BTN]│
├───────────────────────────────────────────────────────┤
│ FILTER BAR                                           │
│ Period: [Hoje][Semana][Próx.Semana][Mês][Todos]      │
│ Status: [Todos][Agendadas][Andamento][Concluídas]... │
├───────────────────────────────┬───────────────────────┤
│ CALENDAR (2/3)               │ DAY DETAIL (1/3)      │
│ ┌─────────────────────────┐  │ ┌──────────────────┐  │
│ │ [<] April 2026 [Hoje] [>]│  │ │ Selected Day    │  │
│ │ Dom Seg Ter Qua Qui ... │  │ │ Visit cards     │  │
│ │ [1][2][3][4][5][6][7]   │  │ │ Link to detail  │  │
│ │ [8][9]... colored dots  │  │ │ [+Schedule]     │  │
│ └─────────────────────────┘  │ └──────────────────┘  │
│                               │                       │
│ VISIT LIST (grouped by date)  │                       │
│ ┌─────────────────────────┐  │                       │
│ │ Today, April 15 (2)     │  │                       │
│ │ [Card: Client A 09:00]  │  │                       │
│ │ [Card: Client B 14:00]  │  │                       │
│ │ Tomorrow, April 16 (1)  │  │                       │
│ │ [Card: Client C 10:00]  │  │                       │
│ └─────────────────────────┘  │                       │
└───────────────────────────────┴───────────────────────┘
```

On mobile (< xl): Calendar, then Visit List, no sidebar detail panel.

#### `/consultoria/clientes/:id` — Client Detail (3 Tabs)

```
┌───────────────────────────────────────────────────────┐
│ [< Back] Client Name            [Actions]             │
│ Tabs: [Overview] [Visits] [Financial]                 │
├───────────────────────────────────────────────────────┤
│ TAB CONTENT (animated transitions)                    │
│                                                       │
│ Overview: Client info + Units + Contacts + Assignments│
│ Visits:  Visit timeline (1-7) with status badges      │
│ Financial: DRE annual table with inline editing       │
└───────────────────────────────────────────────────────┘
```

#### `/checkin` — Daily Check-In Form

```
┌───────────────────────────────────────────────────────┐
│ CHECK-IN HEADER                                       │
│ [Date Scope Toggle] [Historical Date Picker]          │
├───────────────────────────────────────────────────────┤
│ METRIC CARDS (grid)                                   │
│ [Leads] [Agd.Cartão] [Agd.Net] [Vnd.Porta]...        │
│ Each: Label, +/- buttons, value display               │
├───────────────────────────────────────────────────────┤
│ FUNNEL SUMMARY (auto-calculated)                      │
│ Visual funnel with conversion rates                   │
├───────────────────────────────────────────────────────┤
│ NOTES                                                 │
│ [Textarea for observations]                           │
│ Zero Reason selector (if all metrics are 0)           │
├───────────────────────────────────────────────────────┤
│ [SUBMIT] — with confirmation toast                    │
└───────────────────────────────────────────────────────┘
```

---

## 3. Design System Specification

### 3.1 Existing Design Tokens

All tokens defined in `src/index.css` `@theme { }` block.

#### 3.1.1 Color Tokens

| Category | Token | Value | Usage |
|---|---|---|---|
| Brand | `brand-primary` | `#22C55E` | CTAs, active states, accents |
| Brand | `brand-secondary` | `#0D3B2E` | Primary buttons, sidebar active |
| Dark | `mx-black` | `#0A0A0B` | Primary dark background |
| Dark | `pure-black` | `#000000` | Absolute black borders |
| Status | `status-success` | `#10b981` | Positive indicators |
| Status | `status-warning` | `#f59e0b` | Caution states |
| Status | `status-error` | `#ef4444` | Errors, destructive |
| Status | `status-info` | `#3b82f6` | Informational |
| Surface | `surface-default` | `#ffffff` | Card/panel backgrounds |
| Surface | `surface-alt` | `#f8fafc` | Alternate surface |
| Border | `border-default` | `#f1f5f9` | Standard borders |
| Border | `border-strong` | `#e2e8f0` | Strong emphasis |
| Text | `text-primary` | `#0A0A0B` | Primary text |
| Text | `text-secondary` | `#475569` | Secondary text |
| Text | `text-tertiary` | `#94a3b8` | Muted/caption text |

Green scale: `mx-green-50` through `mx-green-950` (11 steps).

#### 3.1.2 Spacing Scale

| Token | Value |
|---|---|
| `mx-tiny` | 0.25rem |
| `mx-xs` | 0.5rem |
| `mx-sm` | 1rem |
| `mx-md` | 1.5rem |
| `mx-lg` | 2rem |
| `mx-xl` | 3rem |
| `mx-2xl` | 4rem |
| `mx-3xl` | 6rem |
| `mx-4xl` | 8rem |

#### 3.1.3 Radius Scale

| Token | Value |
|---|---|
| `mx-sm` | 0.5rem |
| `mx-md` | 0.75rem |
| `mx-lg` | 1rem |
| `mx-xl` | 1.25rem |
| `mx-2xl` | 1.5rem |
| `mx-3xl` | 2rem |
| `mx-4xl` | 3rem |
| `mx-full` | 9999px |

#### 3.1.4 Shadow Scale

| Token | Value |
|---|---|
| `mx-sm` | `0 1px 2px 0 rgba(0,0,0,0.05)` |
| `mx-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` |
| `mx-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` |
| `mx-xl` | `0 20px 25px -5px rgba(0,0,0,0.1)` |
| `mx-elite` | `0 25px 50px -12px rgba(0,0,0,0.25)` |
| `mx-glow-brand` | `0 0 20px rgba(34,197,94,0.3)` |

#### 3.1.5 Typography

- **Primary font:** Plus Jakarta Sans (weights 200–800)
- **Monospace font:** JetBrains Mono (for tabular numbers via `font-mono-numbers`)

Typography variants defined via CVA in `Typography.tsx`: `h1`, `h2`, `h3`, `p`, `caption`, `tiny`, `mono` with tone overrides: `default`, `brand`, `success`, `warning`, `info`, `error`, `muted`, `white`.

### 3.2 Existing Components

#### Atoms (6)

| Component | File | API Pattern | Variants |
|---|---|---|---|
| Typography | `atoms/Typography.tsx` | CVA, `as` prop, `tone` prop | h1, h2, h3, p, caption, tiny, mono |
| Button | `atoms/Button.tsx` | CVA, `forwardRef`, `asChild` | primary, secondary, success, warning, info, danger, outline, ghost × default, sm, lg, icon |
| Input | `atoms/Input.tsx` | `forwardRef`, native attrs | Single variant |
| Textarea | `atoms/Textarea.tsx` | `forwardRef`, native attrs | Single variant |
| Badge | `atoms/Badge.tsx` | CVA | default, brand, secondary, success, warning, info, danger, outline, ghost |
| Skeleton | `atoms/Skeleton.tsx` | `variant` prop | rect, circle |

**Convention:** All atoms use `cn()` from `@/lib/utils`, CVA for variant management, `forwardRef` for DOM access, and compose Typography for text content.

#### Molecules (4)

| Component | File | Sub-components |
|---|---|---|
| Card | `molecules/Card.tsx` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| FormField | `molecules/FormField.tsx` | Wraps Input + label + error with icon support |
| Breadcrumb | `molecules/Breadcrumb.tsx` | NavLink-based breadcrumb with `aria-current="page"` |
| MXScoreCard | `molecules/MXScoreCard.tsx` | Memoized card with score display, tone variants, and Skeleton sub-export |

#### Organisms (1)

| Component | File | Features |
|---|---|---|
| DataGrid | `organisms/DataGrid.tsx` | Generic typed table (desktop) + card list (mobile), loading skeleton, empty state, AnimatePresence row animations, row click handler, responsive column visibility |

### 3.3 New Component Specifications

The following components are specified to close the gaps identified in the PRD (EPIC-UI-01).

---

## 4. Component Specifications

### 4.1 New Atoms

#### 4.1.1 Select

**Purpose:** Reusable styled `<select>` replacement to eliminate inline `<select>` elements found in `AgendaAdmin.tsx:649`, `AgendaAdmin.tsx:702`, `AgendaAdmin.tsx:717-741`, and `ConsultoriaClienteDetalhe.tsx`.

**File:** `src/components/atoms/Select.tsx`

**Props:**
```typescript
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}
```

**Visual States:**
| State | Border | Ring | Background | Shadow |
|---|---|---|---|---|
| Default | `border-border-default` | none | `bg-white` | `shadow-inner` |
| Hover | `border-border-strong` | none | `bg-white` | `shadow-inner` |
| Focus | `border-brand-primary/30` | `ring-4 ring-brand-primary/5` | `bg-white` | `shadow-inner` |
| Error | `border-status-error` | `ring-4 ring-status-error/5` | `bg-white` | `shadow-inner` |
| Disabled | `border-border-default` | none | `bg-surface-alt` | none, `opacity-50` |

**Styling:**
```
h-mx-14 sm:h-12 rounded-mx-md px-4 text-sm font-bold text-text-primary
appearance-none — custom chevron via CSS or Lucide icon wrapper
```

**Accessibility:** Native `<select>` semantics preserved. Label association via `id`/`htmlFor`. Error state announced via `aria-invalid` and `aria-describedby`.

**Composition Pattern:**
```tsx
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="relative">
      <select
        className={cn(baseStyles, error && errorStyles, className)}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} aria-hidden />
    </div>
  )
)
```

---

#### 4.1.2 Avatar

**Purpose:** Consistent user/client avatar with image fallback to initials. Replaces inline avatar pattern in `Layout.tsx:219-225`.

**File:** `src/components/atoms/Avatar.tsx`

**Props:**
```typescript
interface AvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}
```

**Sizes:**
| Size | Dimensions | Font Size | Radius |
|---|---|---|---|
| `sm` | `w-8 h-8` | `text-xs` | `rounded-mx-md` |
| `md` | `w-10 h-10` | `text-sm` | `rounded-mx-md` |
| `lg` | `w-12 h-12` | `text-base` | `rounded-mx-lg` |
| `xl` | `w-16 h-16` | `text-lg` | `rounded-mx-xl` |

**Visual Behavior:**
- If `src` provided: display `<img>` with `object-cover`
- Fallback: display first character of `name` in uppercase, centered, `font-black text-brand-primary bg-surface-alt border border-border-default`
- Image error: graceful fallback to initials

**Accessibility:** `alt=""` decorative when used alongside visible name; `alt="Avatar de {name}"` when standalone.

---

#### 4.1.3 Tooltip

**Purpose:** Accessible tooltip for icon-only buttons and truncated text. Extends the inline tooltip pattern already used in `Layout.tsx:260-262`.

**File:** `src/components/atoms/Tooltip.tsx`

**Props:**
```typescript
interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
  delayMs?: number
}
```

**Implementation Strategy:** CSS-only tooltip using `group-hover` and absolute positioning (matching the existing pattern in Layout.tsx sidebar tooltips). No Radix dependency needed.

**Styling:**
```
bg-brand-secondary text-white text-mx-micro font-black uppercase
tracking-widest rounded-mx-md px-3 py-1.5 shadow-mx-lg
opacity-0 invisible -> group-hover:opacity-100 group-hover:visible
transition-all z-[70] whitespace-nowrap
```

**Accessibility:** `role="tooltip"` on the tooltip element. Trigger element receives `aria-describedby` pointing to tooltip ID.

---

#### 4.1.4 DatePicker

**Purpose:** Styled date input wrapper for the date fields used in agenda scheduling and historical lookups. Uses native `<input type="date">` with consistent MX styling.

**File:** `src/components/atoms/DatePicker.tsx`

**Props:**
```typescript
interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  icon?: React.ReactNode
}
```

**Styling:** Extends `Input.tsx` base styles with calendar icon overlay. Same visual states as Input (default, focus, error, disabled).

**Mobile Behavior:** Native date picker triggered on tap (browser native `<input type="date">`).
**Desktop Behavior:** Same native browser picker. Custom calendar widget is out of scope for this iteration.

---

#### 4.1.5 Accordion

**Purpose:** Collapsible sections for page content with progressive disclosure. Used in settings pages, FAQ sections, and detail views.

**File:** `src/components/atoms/Accordion.tsx`

**Props:**
```typescript
interface AccordionItemProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

interface AccordionProps {
  children: React.ReactNode
  className?: string
  type?: 'single' | 'multiple'
}
```

**Behavior:**
- `single`: Only one item open at a time
- `multiple`: Multiple items can be open simultaneously
- Animated height transition via `motion.div` with `AnimatePresence`
- Chevron icon rotates 180° when expanded

**Styling:**
- Header: `flex items-center justify-between p-mx-md bg-surface-alt/50 rounded-mx-lg cursor-pointer`
- Content: `p-mx-md space-y-mx-sm overflow-hidden`
- Border: `border border-border-default rounded-mx-xl`

**Accessibility:** `role="button"`, `aria-expanded`, `aria-controls` on header. `role="region"`, `aria-labelledby` on content panel.

---

#### 4.1.6 EmptyState

**Purpose:** Consistent empty state display across all list/table views. Replaces ad-hoc empty patterns in `DataGrid.tsx:51-59`, `AgendaAdmin.tsx:427-435`.

**File:** `src/components/atoms/EmptyState.tsx`

**Props:**
```typescript
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}
```

**Styling:**
```
flex flex-col items-center justify-center py-20 text-center
gap-mx-md text-text-label
```
- Icon: 48px, `text-text-tertiary`
- Title: Typography `h3`
- Description: Typography `caption` with `tone="muted"`
- Action: Button `variant="secondary" size="sm"`

---

### 4.2 New Molecules

#### 4.2.1 PageHeader

**Purpose:** Standardized page header with title, description, breadcrumb slot, and action area. Replaces duplicated header patterns across 39 pages.

**File:** `src/components/molecules/PageHeader.tsx`

**Props:**
```typescript
interface PageHeaderProps {
  title: string
  titleAccent?: string
  description?: string
  breadcrumb?: BreadcrumbItem[]
  actions?: React.ReactNode
  className?: string
}
```

**Layout:**
```
┌───────────────────────────────────────────────────┐
│ [Breadcrumb]                                      │
│ [Green Bar] Title ACCENT                          │
│ description text                                  │
│                                    [Action Btns]  │
└───────────────────────────────────────────────────┘
```

**Styling (from AgendaAdmin.tsx:230-237):**
- Green bar: `w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md`
- Title: Typography `h1` with optional `<span className="text-mx-green-700">` for accent word
- Description: Typography `caption` with `tone="muted"`, `pl-mx-md`
- Actions area: `flex flex-wrap items-center gap-mx-sm`
- Bottom border: `border-b border-border-default pb-10`

**Responsive:** Stacks vertically on mobile (`flex-col lg:flex-row`).

---

#### 4.2.2 StatusBadge

**Purpose:** Semantic status badge for visit statuses, check-in states, assignment roles. Replaces inline `getVisitStatusBadge()` in `AgendaAdmin.tsx:47-55`.

**File:** `src/components/molecules/StatusBadge.tsx`

**Props:**
```typescript
type StatusType = 'agendada' | 'em_andamento' | 'concluída' | 'cancelada' | 'active' | 'inactive' | 'pending' | 'overdue'

interface StatusBadgeProps {
  status: StatusType
  label?: string
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}
```

**Status Mapping:**

| Status | Badge Variant | Dot Color | Default Label |
|---|---|---|---|
| `agendada` | outline + green border | `bg-brand-primary` | AGENDADA |
| `em_andamento` | info | `bg-status-info` | EM ANDAMENTO |
| `concluída` | success | `bg-status-success` | CONCLUÍDA |
| `cancelada` | danger | `bg-status-error` | CANCELADA |
| `active` | success | `bg-status-success` | ATIVO |
| `inactive` | ghost | `bg-text-tertiary` | INATIVO |
| `pending` | warning | `bg-status-warning` | PENDENTE |
| `overdue` | danger | `bg-status-error` | ATRASADO |

**Size Variants:**
- `sm`: `px-2 py-0.5 text-mx-micro`
- `md`: `px-3 py-1 text-mx-tiny`

**Optional Dot:** When `dot={true}`, renders a 6px colored circle before the label text.

**Implementation:** Wraps the existing `Badge` atom with status-to-variant mapping logic.

---

#### 4.2.3 ModalShell

**Purpose:** Unified modal pattern wrapping `@radix-ui/react-dialog` with MX styling, focus trapping, and consistent behavior. Replaces raw div overlays in `AgendaAdmin.tsx:628-764` and `DREView.tsx`.

**File:** `src/components/molecules/ModalShell.tsx`

**Props:**
```typescript
interface ModalShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
}
```

**Size Mapping:**

| Size | Max Width | Token |
|---|---|---|
| `sm` | 400px | `max-w-md` |
| `md` | 512px | `max-w-lg` |
| `lg` | 680px | `max-w-xl` |
| `xl` | 280px (sidebar width) | `max-w-mx-sidebar-expanded` |

**Layout:**
```
┌─────────────────────────────────────────┐
│ OVERLAY: bg-mx-black/60 backdrop-blur-md│
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ HEADER (sticky)                 │    │
│  │ [Icon] Title         [Close X] │    │
│  │ description                     │    │
│  ├─────────────────────────────────┤    │
│  │ CONTENT (scrollable)            │    │
│  │                                 │    │
│  │ <children />                    │    │
│  │                                 │    │
│  ├─────────────────────────────────┤    │
│  │ FOOTER                          │    │
│  │ [Cancel] [Confirm]              │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Animation:** `motion.div` with `initial={{ opacity: 0, scale: 0.95 }}` → `animate={{ opacity: 1, scale: 1 }}`.

**Focus Management:**
- Radix Dialog handles focus trap automatically
- First focusable element receives focus on open
- Focus returns to trigger on close
- `Escape` closes the modal

**Styling Details:**
- Modal card: `bg-white border-none shadow-mx-xl rounded-mx-3xl overflow-hidden`
- Header: `p-mx-lg border-b border-border-default sticky top-0 bg-white z-10`
- Content: `p-mx-lg overflow-y-auto max-h-[70vh]`
- Footer: `p-mx-lg border-t border-border-default flex justify-end gap-mx-sm`
- Close button: `w-mx-xl h-mx-xl rounded-mx-xl bg-surface-alt`

---

### 4.3 New Organisms

#### 4.3.1 AgendaCalendar

**Purpose:** Extract calendar grid from `AgendaAdmin.tsx:330-412` into a reusable organism.

**File:** `src/components/organisms/AgendaCalendar.tsx`

**Props:**
```typescript
interface CalendarDay {
  date: Date
  day: number
  isCurrentMonth: boolean
}

interface AgendaCalendarProps {
  calendarDays: CalendarDay[]
  visitsByDate: Record<string, Visit[]>
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  monthLabel: string
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onScheduleNew: (date: Date) => void
  getVisitDotColor: (status: string) => string
  className?: string
}
```

**Visual Structure:**
- Navigation header: prev/next buttons + month label + "Hoje" quick link
- 7-column grid with weekday headers (Dom–Sáb)
- Each cell: date number + colored dot indicators (max 3 visible + "+N" overflow)
- Today: `bg-brand-primary text-white` on date number
- Selected: `ring-2 ring-brand-primary ring-inset bg-brand-primary/10`
- Outside month: `opacity-40 bg-surface-alt/50`

**Responsive:**
- Desktop: Full grid visible
- Mobile: Same grid, cells reduce padding to `p-mx-xs`

---

#### 4.3.2 VisitCard

**Purpose:** Extract visit card from `AgendaAdmin.tsx:460-546` into a reusable organism.

**File:** `src/components/organisms/VisitCard.tsx`

**Props:**
```typescript
interface VisitCardProps {
  visit: {
    id: string
    client_id: string
    client_name: string
    visit_number: number
    scheduled_at: string
    duration_hours: number
    modality?: string
    objective?: string
    status: string
    consultant?: { name: string }
  }
  onStart?: (id: string) => void
  onCancel?: (id: string) => void
  onDelete?: (id: string) => void
  linkTo: string
  className?: string
}
```

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ [Date Badge] [Client Name + Time/Duration] [Status] │
│               [Objective]         [Consultant]      │
│               [Modality]      [Start][Cancel][>]    │
└─────────────────────────────────────────────────────┘
```

**Conditional Rendering:**
- Left colored border: `border-l-4 border-l-status-warning` for expired, `border-l-status-info` for in-progress
- Action buttons visible only for their respective status
- Objective text hidden on mobile (`hidden lg:block`)
- Consultant hidden on small screens (`hidden md:flex`)

---

#### 4.3.3 DRETable

**Purpose:** Extract DRE annual financial table from `DREView.tsx` into a reusable organism.

**File:** `src/components/organisms/DRETable.tsx`

**Props:**
```typescript
interface DRETableProps {
  sections: DRESection[]
  months: string[]
  data: Record<string, any>
  editable?: boolean
  onCellChange?: (section: string, field: string, month: string, value: number) => void
  className?: string
}
```

**Visual:**
- Horizontal scrolling table with 13+ columns (field + 12 months)
- Section header rows with `bg-surface-alt/50 font-black uppercase`
- Editable cells with inline `<input type="number">` when `editable={true}`
- Computed total rows with `font-mono-numbers`
- Min-width: `min-w-mx-elite-wide` (1400px)

---

#### 4.3.4 DREForm

**Purpose:** Extract DRE edit form modal from `DREView.tsx:394-495` into organism.

**File:** `src/components/organisms/DREForm.tsx`

**Props:**
```typescript
interface DREFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  section: DRESection | null
  initialValues: Record<string, any>
  onSubmit: (data: Record<string, any>) => Promise<void>
}
```

**Implementation:** Uses ModalShell for consistent modal behavior. Contains a grid of Input fields organized by section fields. Submit triggers Zod validation.

---

#### 4.3.5 MetricsBar

**Purpose:** Extract the inline metrics cards pattern from `AgendaAdmin.tsx:240-261` and similar dashboard pages.

**File:** `src/components/organisms/MetricsBar.tsx`

**Props:**
```typescript
interface MetricItem {
  label: string
  value: string | number
  tone?: 'default' | 'brand' | 'success' | 'warning' | 'error' | 'info'
}

interface MetricsBarProps {
  metrics: MetricItem[]
  loading?: boolean
  columns?: number
  className?: string
}
```

**Styling:**
- Grid layout: `grid grid-cols-{N} gap-mx-xs`
- Each metric: `Card p-mx-md border-none shadow-mx-md bg-white text-center`
- Value: Typography `h2` with optional tone color
- Label: Typography `tiny` with `tone="muted"`
- Loading: Skeleton placeholders

---

## 5. Interaction Patterns

### 5.1 Calendar Interaction (Agenda)

**Flow:**
1. User lands on `/agenda` → calendar shows current month
2. Days with visits display colored dot indicators (status-colored)
3. Click on a day:
   - Desktop (xl+): Day detail panel updates on right sidebar; visit list scrolls to that date
   - Mobile: Visit list scrolls to that date section
4. Click "Hoje" button → navigate to current month, select today
5. Click prev/next month arrows → month navigation with animation
6. Click on empty day → schedule modal opens with date pre-filled
7. Click on day with visits → detail panel shows visit cards with links

**Calendar Day States:**
```
Default:     bg-white, hover:bg-brand-primary/5
Today:       date number has bg-brand-primary text-white circle
Selected:    ring-2 ring-brand-primary ring-inset + bg-brand-primary/10
Outside:     opacity-40 bg-surface-alt/50
Has Visits:  colored bars (max 3) + "+N" overflow indicator
```

### 5.2 Modal Flows

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

### 5.3 Form Validation Patterns

**Zod Schema at Hook Boundary:**
- Each form defines a Zod schema (e.g., `visitScheduleSchema`, `checkinFormSchema`)
- Schemas are used in `react-hook-form` via `zodResolver` OR manually via `schema.parse()`
- Validation errors displayed inline below each field using `FormField` error slot
- Toast notifications for submission errors via `sonner`

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

### 5.4 Loading States

**Skeleton Loading (DataGrid Pattern):**
```tsx
<div className="space-y-mx-sm animate-in fade-in duration-500">
  {[1, 2, 3, 4, 5].map((i) => (
    <Skeleton key={i} className="h-mx-20 w-full rounded-mx-xl" />
  ))}
</div>
```

**MXScoreCard Skeleton:**
- Exported as `MXScoreCard.Skeleton` — compound component pattern
- Mimics the score card layout with shimmer placeholders

**Page-Level Loading:**
- Full-page skeleton matching the expected layout structure
- `animate-pulse` on all skeleton elements
- Hidden accessible text: `<div className="sr-only">Carregando...</div>`

**Button Loading:**
- Text changes to action verb (e.g., "AGENDANDO..." instead of "AGENDAR VISITA")
- `disabled` state prevents double-submission

### 5.5 Toast Notifications

**Library:** `sonner` (already in use across codebase)

**Patterns:**
- **Success:** `toast.success(message)` — green, auto-dismiss 3s
- **Error:** `toast.error(message)` — red, auto-dismiss 5s
- **Warning:** `toast.warning(message)` — amber
- Position: bottom-right (default)

### 5.6 List Animation

**Pattern (from DataGrid):**
```tsx
<AnimatePresence mode="popLayout">
  {data.map((item) => (
    <motion.tr
      key={item.id}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  ))}
</AnimatePresence>
```

- `layout` prop for smooth reorder
- `mode="popLayout"` for enter/exit without layout shift
- Mobile cards: additional `y: 10` slide-in

### 5.7 Filter/Segment Control Pattern

**Used In:** AgendaAdmin (date filter, status filter), DashboardLoja (view mode), Checkin (metric scope)

**Pattern:**
```
┌─────────────────────────────────────────┐
│ [Active: bg-brand-primary text-white]   │
│ [Inactive: bg-surface-alt text-secondary]│
└─────────────────────────────────────────┘
```

**Styling:**
- Active: `bg-brand-primary text-white shadow-mx-sm`
- Inactive: `bg-surface-alt text-text-secondary hover:bg-border-default`
- Common: `px-3 py-1.5 rounded-mx-lg text-xs font-black uppercase tracking-widest transition-all`
- Implemented as `<button type="button">` elements in a flex row

---

## 6. Responsive Behavior

### 6.1 Breakpoints

| Breakpoint | Width | Target |
|---|---|---|
| `sm` | 640px | Large phones, small tablets |
| `md` | 768px | Tablets (sidebar appears) |
| `lg` | 1024px | Small desktops |
| `xl` | 1280px | Desktop (multi-column layouts) |

### 6.2 Navigation Responsive Behavior

| Breakpoint | Navigation | Layout |
|---|---|---|
| < `md` (Mobile) | Bottom bar (fixed, `bg-mx-black`) + bottom sheet menu | Single column, full-width workspace |
| `md`–`xl` (Tablet) | Icon sidebar (80px) + hover drawer | Sidebar + workspace |
| `xl`+ (Desktop) | Icon sidebar (80px) + hover drawer | Sidebar + workspace + multi-column grids |

### 6.3 Component Responsive Behavior

#### DataGrid
- **Desktop (md+):** Full `<table>` with all non-`mobileOnly` columns, sticky header
- **Mobile (<md):** Card list layout with all non-`desktopOnly` columns, first column as title row

#### Agenda Page
- **Desktop (xl+):** 3-column grid — calendar (2/3) + day detail sidebar (1/3)
- **Mobile/Tablet (<xl):** Calendar + visit list stacked, no sidebar

#### Card
- Same styling across breakpoints; parent controls grid layout
- Padding responsive via `sm:h-10 sm:px-4` on buttons within cards

#### Button
- **Mobile:** `h-mx-11` (44px touch target)
- **Desktop:** `sm:h-10` (40px visual)

#### Input
- **Mobile:** `h-mx-14` (56px touch target)
- **Desktop:** `sm:h-12` (48px)

#### Page Layout
- **Mobile:** `p-mx-sm`, single column
- **Desktop:** `p-mx-md`, multi-column grids
- Workspace padding: `gap-mx-md`

### 6.4 Bottom Bar Behavior

- Visible only on `<md` screens (`md:hidden`)
- Fixed position: `fixed bottom-mx-sm left-mx-sm right-mx-sm`
- Height: `h-mx-2xl` (120px from `--spacing-mx-2xl = 4rem` — but actual bar is 88px via `h-mx-2xl`)
- Dark background with rounded corners: `bg-mx-black rounded-mx-2xl`
- Content pages must account for bottom bar with `pb-20` or `pb-mx-2xl`

### 6.5 Mobile Menu (Bottom Sheet)

- Full-screen overlay: `fixed inset-0 bg-mx-black/60 backdrop-blur-md z-[100]`
- Bottom sheet: slides up from bottom with spring animation (`type: spring, damping: 25, stiffness: 200`)
- Sheet background: `bg-white rounded-t-mx-4xl`
- Drag handle: centered pill at top (`w-mx-xl h-1.5 bg-surface-alt rounded-mx-full`)
- Close: X button, tap overlay, or `Escape` key
- Focus trap applied via `useFocusTrap`

---

## 7. Accessibility Requirements

### 7.1 WCAG 2.1 AA Compliance Targets

| Criterion | Level | Current State | Target |
|---|---|---|---|
| 1.1.1 Non-text Content | A | Partial (some icons lack `aria-hidden`) | All decorative icons: `aria-hidden="true"`; meaningful icons: `aria-label` |
| 1.3.1 Info and Relationships | A | Good (semantic nav, headings) | All forms use `<label>` + `id` association |
| 1.4.3 Contrast (Minimum) | AA | Green on white passes (4.58:1) | Verify all text meets 4.5:1 |
| 2.1.1 Keyboard | A | Partial (drawer not keyboard navigable) | All interactive elements reachable via Tab |
| 2.1.2 No Keyboard Trap | A | Good (Escape closes mobile menu) | Modal focus trap includes Escape close |
| 2.4.1 Bypass Blocks | A | Implemented (skip link exists) | Maintain skip link |
| 2.4.3 Focus Order | A | Partial | Logical tab order in all modals and drawers |
| 2.4.7 Focus Visible | AA | Good (`focus-visible:ring-4`) | Consistent across all components |
| 4.1.2 Name, Role, Value | A | Partial (modals lack ARIA) | All modals: `role="dialog"`, `aria-modal="true"` |

### 7.2 Focus Management

**Current Implementation:**
- Skip link: `<a href="#main-content">` with `sr-only focus:not-sr-only` styling (Layout.tsx:154-156)
- Focus trap hook: `useFocusTrap` in `src/hooks/useFocusTrap.ts` (applied to mobile menu only)
- Focus visible: `focus-visible:ring-4 focus-visible:ring-brand-primary/15` on all interactive elements

**Required Enhancements:**
1. **Modal Focus Trap:** All ModalShell instances must use Radix Dialog's built-in focus management
2. **Drawer Focus:** Sidebar drawer should trap focus when open (currently mouse-only)
3. **Return Focus:** After modal/drawer close, focus returns to trigger element
4. **Announcement:** Dynamic content updates announced via `aria-live="polite"` regions

### 7.3 Keyboard Navigation

| Element | Key | Action |
|---|---|---|
| Sidebar category button | `Enter` / `Space` | Toggle drawer |
| Sidebar category button | `Escape` | Close drawer |
| Mobile menu | `Escape` | Close bottom sheet |
| Modal | `Escape` | Close modal |
| Modal | `Tab` | Cycle through focusable elements (trapped) |
| Calendar day | `Enter` / `Space` | Select date |
| Calendar day | `Arrow keys` | Navigate between days |
| DataGrid row | `Enter` | Trigger row click action |
| Accordion header | `Enter` / `Space` | Toggle expand/collapse |
| Select | Native | Browser native select keyboard behavior |
| Filter buttons | `Tab` / `Enter` | Navigate and activate |

### 7.4 ARIA Patterns

**Navigation (Layout.tsx):**
- Sidebar: `<aside aria-label="Menu Lateral Principal">`
- Sidebar nav: `<nav aria-label="Módulos de Gestão">`
- Category buttons: `aria-label="Abrir módulo: {name}"`, `aria-expanded`, `aria-controls="drawer-navigation"`
- Drawer: `role="navigation"`, `aria-label="Opções do módulo {name}"`
- Bottom bar: `<nav aria-label="Barra de Navegação Rápida">`
- Active link: `aria-current="page"`

**Mobile Menu:**
- Overlay: `role="presentation"`
- Sheet: `role="dialog"`, `aria-modal="true"`, `aria-label="Menu Mobile Principal"`

**Modals (ModalShell):**
- Radix Dialog provides: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- Close button: `aria-label` on close icon

**DataGrid:**
- Table: Standard `<table>` with `<thead>`, `<tbody>`, `<th scope="col">`
- Row click: `cursor-pointer` + keyboard handler on `<tr>` (via `onRowClick`)

**Forms:**
- All inputs: `<label htmlFor>` + `<input id>` association
- Error messages: `role="alert"` on error text
- Invalid inputs: `aria-invalid="true"`
- Required fields: `aria-required="true"`

**Tooltips:**
- Trigger: `aria-describedby` pointing to tooltip element
- Tooltip: `role="tooltip"`

### 7.5 Reduced Motion

Already implemented in `src/index.css:149-161`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

All Motion (Framer Motion) animations must respect this media query. Components should use `useReducedMotion()` from `motion/react` to conditionally disable animations.

### 7.6 Screen Reader Considerations

- **Skeleton loading:** `<div className="sr-only">Carregando...</div>` inside Skeleton
- **Icon-only buttons:** Always have `aria-label` (e.g., `aria-label="Atualizar"`, `aria-label="Abrir menu mobile"`)
- **Decorative icons:** Always `aria-hidden="true"` (enforced in Button atom via `decoratedChildren` logic)
- **Status indicators:** Use StatusBadge which conveys status via text, not just color
- **Dynamic lists:** Wrap in `aria-live="polite"` region for auto-announcements
- **Progress bars:** `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

### 7.7 Touch Target Compliance

- Minimum touch target: 44×44px (WCAG 2.5.5 Level AAA target, adopted as standard)
- Mobile bottom bar buttons: `w-mx-xl h-mx-xl` (48×48px with `--spacing-mx-xl = 3rem`)
- Button sizes: Mobile `h-mx-11` (44px), Desktop `sm:h-10` (40px)
- Input sizes: Mobile `h-mx-14` (56px), Desktop `sm:h-12` (48px)
- All interactive elements have minimum 8px spacing between them

---

## Appendix A: Component Dependency Map

```
Atoms (New)
├── Select ──────── depends on: cn, Lucide ChevronDown
├── Avatar ──────── depends on: cn
├── Tooltip ──────── depends on: cn
├── DatePicker ──── depends on: Input
├── Accordion ──── depends on: cn, motion, Lucide ChevronDown
└── EmptyState ──── depends on: Typography, Button

Molecules (New)
├── PageHeader ──── depends on: Typography, Breadcrumb
├── StatusBadge ──── depends on: Badge
└── ModalShell ──── depends on: @radix-ui/react-dialog, Typography, cn, motion

Organisms (New)
├── AgendaCalendar ── depends on: Card, Typography, cn
├── VisitCard ────── depends on: Card, Typography, StatusBadge, Badge, Button
├── DRETable ──────── depends on: cn, Typography
├── DREForm ──────── depends on: ModalShell, Input
└── MetricsBar ────── depends on: Card, Typography, Skeleton
```

## Appendix B: Migration Priority

| Priority | Component | Replaces | Story |
|---|---|---|---|
| P0 | Select | 4 inline `<select>` in AgendaAdmin | 1.1 |
| P0 | ModalShell | 2 raw div overlays (AgendaAdmin, DREView) | 1.2 |
| P1 | StatusBadge | `getVisitStatusBadge()` in AgendaAdmin | 1.1 |
| P1 | PageHeader | Header patterns in 15+ pages | 1.1 |
| P1 | Avatar | Inline avatar in Layout.tsx | 1.1 |
| P1 | EmptyState | Empty patterns in DataGrid, AgendaAdmin | 1.1 |
| P2 | AgendaCalendar | Calendar grid in AgendaAdmin (330-412) | 1.2 |
| P2 | VisitCard | Visit card in AgendaAdmin (460-546) | 1.2 |
| P2 | MetricsBar | Metric cards in AgendaAdmin (240-261) | 1.2 |
| P2 | DRETable | DRE table in DREView | 1.2 |
| P2 | DREForm | DRE modal in DREView | 1.2 |
| P3 | Tooltip | Inline tooltips in Layout.tsx | 1.1 |
| P3 | DatePicker | Date inputs in agenda forms | 1.1 |
| P3 | Accordion | Future use in settings/detail pages | 1.1 |

## Appendix C: File Naming Convention

```
src/components/
├── atoms/
│   ├── Typography.tsx        (existing)
│   ├── Button.tsx            (existing)
│   ├── Input.tsx             (existing)
│   ├── Textarea.tsx          (existing)
│   ├── Badge.tsx             (existing)
│   ├── Skeleton.tsx          (existing)
│   ├── Select.tsx            (NEW)
│   ├── Avatar.tsx            (NEW)
│   ├── Tooltip.tsx           (NEW)
│   ├── DatePicker.tsx        (NEW)
│   ├── Accordion.tsx         (NEW)
│   └── EmptyState.tsx        (NEW)
├── molecules/
│   ├── Card.tsx              (existing)
│   ├── FormField.tsx         (existing)
│   ├── Breadcrumb.tsx        (existing)
│   ├── MXScoreCard.tsx       (existing)
│   ├── PageHeader.tsx        (NEW)
│   ├── StatusBadge.tsx       (NEW)
│   └── ModalShell.tsx        (NEW)
├── organisms/
│   ├── DataGrid.tsx          (existing)
│   ├── AgendaCalendar.tsx    (NEW)
│   ├── VisitCard.tsx         (NEW)
│   ├── DRETable.tsx          (NEW)
│   ├── DREForm.tsx           (NEW)
│   └── MetricsBar.tsx        (NEW)
```

Each component follows the existing pattern:
- `forwardRef` for DOM access
- `cn()` for className merging
- CVA for variant management
- Named exports only (no default exports from atoms/molecules)
- Compound components via `Object.assign` (e.g., `MXScoreCard.Skeleton`)

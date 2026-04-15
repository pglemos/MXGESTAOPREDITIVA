# Frontend Specification — MX Performance

**Status:** ACTIVE
**Version:** 1.0
**Date:** April 15, 2026
**Responsible:** @ux-design-expert

---

## 1. Executive Summary

MX Performance is a role-based retail management platform built with React 19, Tailwind CSS 4, and Supabase. The frontend follows an Atomic Design methodology (Atoms → Molecules → Organisms → Features → Pages) with a comprehensive design token system. The application serves four distinct user roles — **Vendedor** (salesperson), **Gerente** (store manager), **Dono** (owner), and **Admin** (consultant) — each with tailored navigation, dashboards, and operational workflows.

The UX approach emphasizes:
- **Dark Elite aesthetic** with green brand identity (#22C55E primary)
- **Mobile-first responsive design** with a persistent bottom navigation bar
- **Role-driven information architecture** via a collapsible sidebar + drawer pattern on desktop
- **Predictive performance culture** — gamified ranking ("Arena"), tactical prescriptions, and structured feedback loops
- **Lazy-loaded routes** with Suspense boundaries and skeleton loading states
- **Motion/animation** via Framer Motion (`motion/react`) for page transitions, list animations, and micro-interactions
- **Toast notifications** via Sonner for operational feedback
- **Supabase Auth** with multi-tenant store membership, store switching, and zero-trust validation

---

## 2. Design System

### 2.1 Tokens

All tokens are defined in `src/index.css` within the `@theme { }` block for Tailwind CSS 4 compatibility.

#### 2.1.1 Colors — Brand & Core

| Token | Value | Usage |
|---|---|---|
| `--color-mx-black` | `#0A0A0B` | Primary dark background |
| `--color-pure-black` | `#000000` | Absolute black (mobile bar border) |
| `--color-brand-primary` | `#22C55E` | Primary brand green — CTAs, active states, accents |
| `--color-brand-secondary` | `#0D3B2E` | Secondary brand dark green — primary button bg, sidebar active |

#### 2.1.2 Colors — Status Semantics

| Token | Value | Usage |
|---|---|---|
| `--color-status-success` | `#10b981` | Positive indicators, confirmation |
| `--color-status-success-surface` | `rgba(16, 185, 129, 0.05)` | Success background tint |
| `--color-status-warning` | `#f59e0b` | Caution, ranking, arena highlights |
| `--color-status-warning-surface` | `rgba(245, 158, 11, 0.05)` | Warning background tint |
| `--color-status-error` | `#ef4444` | Errors, destructive actions, danger |
| `--color-status-error-surface` | `rgba(239, 68, 68, 0.05)` | Error background tint |
| `--color-status-info` | `#3b82f6` | Informational states |
| `--color-status-info-surface` | `rgba(59, 130, 246, 0.05)` | Info background tint |

#### 2.1.3 Colors — Surface & Borders

| Token | Value | Usage |
|---|---|---|
| `--color-surface-default` | `#ffffff` | Card/panel backgrounds |
| `--color-surface-alt` | `#f8fafc` | Alternate surface, input backgrounds |
| `--color-border-default` | `#f1f5f9` | Standard borders |
| `--color-border-subtle` | `#f1f5f9` | Subtle divider borders |
| `--color-border-strong` | `#e2e8f0` | Strong emphasis borders |

#### 2.1.4 Colors — Typography

| Token | Value | Usage |
|---|---|---|
| `--color-text-primary` | `#0A0A0B` | Primary body text |
| `--color-text-secondary` | `#475569` | Secondary/supporting text |
| `--color-text-tertiary` | `#94a3b8` | Caption, muted, tertiary text |

#### 2.1.5 Colors — Elevated Surfaces

| Token | Value | Usage |
|---|---|---|
| `--color-surface-overlay` | `#1A1A1D` | Overlay backgrounds |
| `--color-surface-elevated` | `#121214` | Elevated dark surfaces |

#### 2.1.6 Colors — Green Scale (Brand Palette)

| Token | Value |
|---|---|
| `--color-mx-green-50` | `#f0fdf4` |
| `--color-mx-green-100` | `#dcfce7` |
| `--color-mx-green-200` | `#bbf7d0` |
| `--color-mx-green-300` | `#86efac` |
| `--color-mx-green-400` | `#4ade80` |
| `--color-mx-green-500` | `#22c55e` |
| `--color-mx-green-600` | `#16a34a` |
| `--color-mx-green-700` | `#15803d` |
| `--color-mx-green-800` | `#166534` |
| `--color-mx-green-900` | `#14532d` |
| `--color-mx-green-950` | `#052e16` |

Legacy aliases (`--color-mx-indigo-*`) map directly to the corresponding `--color-mx-green-*` tokens for backward compatibility.

#### 2.1.7 Radius Scale

| Token | Value | Usage |
|---|---|---|
| `--radius-mx-sm` | `0.5rem` | Small elements, small buttons |
| `--radius-mx-md` | `0.75rem` | Buttons, inputs |
| `--radius-mx-lg` | `1rem` | Cards (inner), medium containers |
| `--radius-mx-xl` | `1.25rem` | Large buttons |
| `--radius-mx-2xl` | `1.5rem` | Cards, major containers |
| `--radius-mx-3xl` | `2rem` | Primary card radius, workspace panels |
| `--radius-mx-4xl` | `3rem` | Mobile menu bottom sheet |
| `--radius-mx-full` | `9999px` | Pills, avatars, badges |

#### 2.1.8 Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `--spacing-mx-0` | `0` | Reset |
| `--spacing-mx-tiny` | `0.25rem` | Micro gaps |
| `--spacing-mx-xs` | `0.5rem` | Tight spacing |
| `--spacing-mx-sm` | `1rem` | Standard small |
| `--spacing-mx-md` | `1.5rem` | Medium padding/gap |
| `--spacing-mx-lg` | `2rem` | Large padding/gap |
| `--spacing-mx-xl` | `3rem` | Extra-large gap |
| `--spacing-mx-2xl` | `4rem` | Section spacing |
| `--spacing-mx-3xl` | `6rem` | Hero spacing |
| `--spacing-mx-4xl` | `8rem` | Maximum spacing |
| `--spacing-mx-5xl` | `12rem` | Extreme spacing |
| `--spacing-mx-10` | `2.5rem` | Fixed height elements |
| `--spacing-mx-14` | `3.5rem` | Fixed height elements |
| `--spacing-mx-20` | `5rem` | Fixed height elements |
| `--spacing-mx-48` | `12rem` | Large fixed containers |
| `--spacing-mx-64` | `16rem` | Extra large containers |
| `--spacing-mx-96` | `24rem` | Hero sections |

#### 2.1.9 Shadow Scale

| Token | Value | Usage |
|---|---|---|
| `--shadow-mx-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | Subtle elevation |
| `--shadow-mx-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.1)` | Cards, buttons |
| `--shadow-mx-lg` | `0 10px 15px -3px rgba(0, 0, 0, 0.1)` | Elevated cards |
| `--shadow-mx-xl` | `0 20px 25px -5px rgba(0, 0, 0, 0.1)` | Drawers, modals |
| `--shadow-mx-elite` | `0 25px 50px -12px rgba(0, 0, 0, 0.25)` | Hero elements, confetti overlay |

#### 2.1.10 Semantic Glows

| Token | Value | Usage |
|---|---|---|
| `--shadow-mx-glow-brand` | `0 0 20px rgba(34, 197, 94, 0.3)` | Highlight glow on score cards |
| `--shadow-mx-glow-white` | `0 0 20px rgba(255, 255, 255, 0.5)` | White glow for dark contexts |

#### 2.1.11 Typography Scale (Extended)

| Token | Value | Usage |
|---|---|---|
| `--font-size-mx-nano` | `8px` | Smallest labels |
| `--font-size-mx-micro` | `9px` | Micro labels |
| `--font-size-mx-tiny` | `10px` | Small labels, captions |
| `--font-size-mx-huge` | `12rem` | Decorative large text |

#### 2.1.12 Letter Spacing

| Token | Value | Usage |
|---|---|---|
| `--letter-spacing-mx-tight` | `-0.05em` | Headings |
| `--letter-spacing-mx-wide` | `0.2em` | Badges, labels |
| `--letter-spacing-mx-wider` | `0.3em` | Uppercase labels |
| `--letter-spacing-mx-widest` | `0.4em` | Ultra-wide tracking |

#### 2.1.13 Layout Tokens

| Token | Value | Usage |
|---|---|---|
| `--spacing-mx-layout-offset-top` | `104px` | Sticky content top offset (header height + padding) |
| `--spacing-mx-layout-offset-bottom` | `120px` | Bottom offset for mobile bar |
| `--spacing-mx-layout-drawer-left` | `136px` | Drawer navigation left offset |
| `--height-mx-layout-viewport` | `calc(100vh - 120px)` | Scrollable viewport height |
| `--width-mx-sidebar-collapsed` | `80px` | Collapsed sidebar width |
| `--width-mx-sidebar-expanded` | `280px` | Expanded drawer width |
| `--width-mx-header` | `100%` | Full-width header |
| `--height-mx-header` | `80px` | Header height |
| `--width-mx-hero` | `50vw` | Hero image width |
| `--height-mx-hero` | `50vw` | Hero image height |
| `--height-mx-chart` | `400px` | Chart container height |

#### 2.1.14 Table Layout Thresholds

| Token | Value | Usage |
|---|---|---|
| `--spacing-mx-table` | `800px` | Standard table min-width |
| `--spacing-mx-table-wide` | `1200px` | Wide table min-width |
| `--spacing-mx-elite-table` | `1000px` | Elite table min-width |
| `--spacing-mx-elite-wide` | `1400px` | Elite wide table min-width |
| `--spacing-mx-label-lg` | `120px` | Label min-width in reports |

#### 2.1.15 Effects

| Token | Value | Usage |
|---|---|---|
| `--blur-mx-huge` | `80px` | Heavy blur for decorative elements |

### 2.2 Typography

**Font Families:**
- **Primary:** Plus Jakarta Sans (`200..800` weight range, italic supported)
- **Monospace:** JetBrains Mono (`100..800` weight range, italic supported) — used for numbers, tabular data via `font-mono-numbers` utility

**Typography Variants (CVA-based):**

| Variant | Font Size | Weight | Tracking | Transform | Leading | Color |
|---|---|---|---|---|---|---|
| `h1` | `text-4xl md:text-5xl` | `font-black` (900) | `tracking-tighter` | `uppercase` | `leading-none` | `text-text-primary` |
| `h2` | `text-2xl md:text-3xl` | `font-black` (900) | `tracking-tighter` | `uppercase` | `leading-none` | `text-text-primary` |
| `h3` | `text-xl` | `font-black` (900) | `tracking-tight` | `uppercase` | `leading-none` | `text-text-primary` |
| `p` | `text-sm` | `font-bold` (700) | `tracking-tight` | `uppercase` | `leading-relaxed` | `text-text-secondary` |
| `caption` | `text-mx-tiny` (10px) | `font-black` (900) | `tracking-mx-wider` (0.3em) | `uppercase` | — | `text-text-tertiary` |
| `tiny` | `text-mx-micro` (9px) | `font-black` (900) | `tracking-widest` | `uppercase` | — | Default inherited |
| `mono` | `text-sm` | `font-black` (900) | Default | — | — | Default inherited |

**Tone Overrides:**

| Tone | Color |
|---|---|
| `default` | Inherited |
| `brand` | `text-mx-green-700` |
| `success` | `text-status-success` |
| `warning` | `text-status-warning` |
| `info` | `text-status-info` |
| `error` | `text-status-error` |
| `muted` | `text-text-tertiary` |
| `white` | `text-white` |

**Semantic Element (`as` prop):** `h1` | `h2` | `h3` | `h4` | `h5` | `h6` | `p` | `span` | `label` | `div`

### 2.3 Color System

#### Brand Colors
- **Primary:** `#22C55E` (Green 500) — used for all CTAs, active navigation states, positive accents
- **Secondary:** `#0D3B2E` (Dark green) — primary buttons, sidebar active state, login left panel
- **Full green palette:** 50–950 scale available

#### Status Colors
- **Success:** `#10b981` — confirmed actions, positive metrics
- **Warning:** `#f59e0b` — caution states, ranking highlights
- **Error:** `#ef4444` — errors, destructive actions, validation failures
- **Info:** `#3b82f6` — informational badges, digital channel

#### Surface Colors
- **Default:** `#ffffff` — primary background
- **Alt:** `#f8fafc` — secondary background, input fills
- **Overlay:** `#1A1A1D` — mobile menu overlay
- **Elevated:** `#121214` — dark elevated surfaces

#### Border Colors
- **Default:** `#f1f5f9` — standard card/input borders
- **Subtle:** `#f1f5f9` — dividers
- **Strong:** `#e2e8f0` — emphasis borders

### 2.4 Spacing & Layout

**Spacing Scale:** See section 2.1.8. The scale follows a consistent progression from `0` → `12rem` with named tokens.

**Breakpoints (Tailwind defaults):**

| Prefix | Min-width | Usage |
|---|---|---|
| `sm` | `640px` | Small tablets |
| `md` | `768px` | Tablets — sidebar becomes visible, mobile bar hides |
| `lg` | `1024px` | Desktop — full layout, login split panel |
| `xl` | `1280px` | Large desktop |

**Key Layout Dimensions:**
- Header: `80px` height, sticky top
- Sidebar collapsed: `80px` wide, icon-only buttons (`48px` × `48px`)
- Drawer expanded: `280px` wide
- Mobile bottom bar: `64px` height (`h-mx-2xl`), rounded, dark background
- Workspace main: `flex-1`, `rounded-mx-3xl`, white bg
- Content padding: `p-mx-sm md:p-mx-md` (1rem → 1.5rem)

---

## 3. Component Library

### 3.1 Atoms (6)

#### 3.1.1 Typography

**File:** `src/components/atoms/Typography.tsx`
**Description:** Polymorphic text component with variant-based styling via CVA. Renders as any HTML heading/paragraph/span element.

**Variants:** `h1`, `h2`, `h3`, `p`, `caption`, `tiny`, `mono`
**Tones:** `default`, `brand`, `success`, `warning`, `info`, `error`, `muted`, `white`

**Props Interface:**
| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `string` | `"p"` | Visual typography style |
| `tone` | `string` | `"default"` | Color tone override |
| `as` | `string` | Auto-derived | Semantic HTML element |
| `htmlFor` | `string` | — | For label elements |
| `className` | `string` | — | Additional classes |

**Accessibility:** Supports `as="label"` with `htmlFor` for form association. ForwardRef compatible.

---

#### 3.1.2 Button

**File:** `src/components/atoms/Button.tsx`
**Description:** Primary action component with variant styling, size scaling, and polymorphic rendering via `asChild` pattern.

**Variants:**

| Variant | Visual |
|---|---|
| `primary` | Dark green bg (`brand-secondary`), white text, green shadow glow |
| `secondary` | White bg, dark green text, border, hover to green border |
| `success` | Green bg, white text |
| `warning` | Amber bg, white text |
| `info` | Blue bg, white text |
| `danger` | Red bg, white text, hover rose-600 |
| `outline` | White bg, border-strong, text-primary |
| `ghost` | Transparent, text-secondary, hover bg |

**Sizes:**

| Size | Height | Other |
|---|---|---|
| `default` | `44px` (mobile) / `40px` (desktop) | `px-6` / `px-4` |
| `sm` | `36px` | `px-3`, `rounded-mx-sm` |
| `lg` | `56px` | `px-8`, `rounded-mx-lg` |
| `icon` | `44px` × `44px` (mobile) / `40px` × `40px` (desktop) | Square |

**Props Interface:**
| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `string` | `"primary"` | Visual variant |
| `size` | `string` | `"default"` | Size preset |
| `asChild` | `boolean` | `false` | Render as child element (polymorphic) |
| All native `<button>` props | — | — | — |

**Accessibility:** SVG children auto-receive `aria-hidden="true"` and `focusable="false"`. Focus ring: `focus-visible:ring-4 focus-visible:ring-brand-primary/20`. Active state: `active:scale-95`.

---

#### 3.1.3 Badge

**File:** `src/components/atoms/Badge.tsx`
**Description:** Inline status/label indicator with variant-based coloring.

**Variants:**

| Variant | Visual |
|---|---|
| `default` | Green bg, white text, shadow-sm |
| `brand` | Green bg, white text, shadow-md, hover black |
| `secondary` | Dark green bg, white text, hover black |
| `success` | Success green bg, white text |
| `warning` | Amber bg, white text |
| `info` | Blue bg, white text |
| `danger` | Red bg, white text |
| `outline` | White bg, border-strong, text-primary |
| `ghost` | Transparent, text-secondary |

**Props Interface:**
| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `string` | `"default"` | Visual variant |
| `className` | `string` | — | Additional classes |
| `children` | `ReactNode` | — | Content (auto-wrapped in Typography if string) |

---

#### 3.1.4 Input

**File:** `src/components/atoms/Input.tsx`
**Description:** Styled form input element with focus ring, border transitions, and responsive height.

**Visual:** `rounded-mx-md`, `border-border-default`, `bg-white`, `shadow-inner`, `font-bold`, `text-sm`
**Focus:** `focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5`
**Height:** `56px` (mobile) / `48px` (desktop)
**File input:** Styled transparently.

**Props Interface:** Extends `React.InputHTMLAttributes<HTMLInputElement>` — all native input props supported.

---

#### 3.1.5 Textarea

**File:** `src/components/atoms/Textarea.tsx`
**Description:** Multi-line text input with rounded styling, minimum height, and resize disabled.

**Visual:** `rounded-mx-2xl`, `border-border-default`, `bg-white`, `shadow-inner`, `min-h-[120px]`, `resize-none`
**Focus:** `focus:border-brand-primary/30 focus:ring-8 focus:ring-brand-primary/5`

**Props Interface:** Extends `React.TextareaHTMLAttributes<HTMLTextAreaElement>` — all native textarea props supported.

---

#### 3.1.6 Skeleton

**File:** `src/components/atoms/Skeleton.tsx`
**Description:** Animated loading placeholder with pulse animation.

**Variants:**

| Variant | Visual |
|---|---|
| `rect` (default) | `rounded-mx-xl` |
| `circle` | `rounded-mx-full` |

**Props Interface:**
| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'rect' \| 'circle'` | `'rect'` | Shape variant |
| `className` | `string` | — | Additional classes (used for dimensions) |

**Accessibility:** Contains `sr-only` text "Carregando..." for screen readers.

---

### 3.2 Molecules (3)

#### 3.2.1 Card

**File:** `src/components/molecules/Card.tsx`
**Description:** Primary container component with sub-components for structured content layouts.

**Sub-components:**

| Component | Description | Visual |
|---|---|---|
| `Card` | Root container | `rounded-mx-3xl`, `border-border-default`, `bg-white`, `shadow-mx-sm`, `overflow-hidden` |
| `CardHeader` | Header section | `p-mx-lg`, `border-b border-border-subtle`, `bg-surface-alt/30` |
| `CardTitle` | Title element (`<h3>`) | `text-2xl font-black uppercase tracking-tight` |
| `CardDescription` | Subtitle/description | `text-mx-tiny font-black text-text-tertiary uppercase tracking-widest` |
| `CardContent` | Body content | `p-mx-lg` |
| `CardFooter` | Footer section | `p-mx-lg`, `border-t border-border-subtle`, `bg-surface-alt/10` |

All sub-components use `React.forwardRef` and accept standard HTML div/heading attributes.

---

#### 3.2.2 FormField

**File:** `src/components/molecules/FormField.tsx`
**Description:** Complete form field wrapper combining label, input, optional icon, and error message display.

**Features:**
- Auto-generated `id` via `React.useId()` when not provided
- Associated `<label>` with `htmlFor`
- Optional leading icon with focus color transition
- Error state: red border, error ring, animated error message with `role="alert"`

**Props Interface:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | **Required** | Field label text |
| `error` | `string` | — | Error message (displays red) |
| `id` | `string` | Auto-generated | Field ID for label association |
| `icon` | `ReactNode` | — | Leading icon element |
| All native `<input>` props | — | — | — |

---

#### 3.2.3 MXScoreCard

**File:** `src/components/molecules/MXScoreCard.tsx`
**Description:** KPI/metric display card with icon, label, value, and subtitle. Used extensively on dashboards.

**Features:**
- Memoized for performance (`React.memo`)
- Static `Skeleton` sub-component for loading states
- Optional highlight mode with brand glow ring
- Hover: icon scale-up, shadow elevation increase
- Decorative background blur circle

**Props Interface:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | **Required** | Metric label |
| `value` | `string \| number` | **Required** | Metric value |
| `sub` | `string` | **Required** | Subtitle text |
| `icon` | `any` (Lucide) | **Required** | Icon component |
| `tone` | `'brand' \| 'success' \| 'warning' \| 'error'` | **Required** | Color tone for icon container |
| `description` | `string` | — | Accessible description |
| `isHighlight` | `boolean` | `false` | Brand glow ring + highlight |

**Usage:** `MXScoreCard` + `MXScoreCard.Skeleton`

---

### 3.3 Organisms (1)

#### 3.3.1 DataGrid

**File:** `src/components/organisms/DataGrid.tsx`
**Description:** Generic, responsive data table component with dual rendering — desktop table view and mobile card view. Memoized for performance.

**Features:**
- **Desktop:** `<table>` with sticky header, column alignment, animated rows via `AnimatePresence`
- **Mobile:** Card-based layout via `Card` component, first column featured as title
- **Loading:** 5-row skeleton state
- **Empty:** Centered icon + message
- **Row interaction:** Clickable rows with hover state and cursor
- **Column visibility:** `mobileOnly` and `desktopOnly` flags per column
- **Animation:** Fade-in/fade-out on rows, slide on mobile cards

**Column Interface (`Column<T>`):**

| Prop | Type | Description |
|---|---|---|
| `key` | `string` | Data property key |
| `header` | `string` | Column header label |
| `width` | `string` | CSS width class |
| `align` | `'left' \| 'center' \| 'right'` | Cell alignment |
| `render` | `(item: T, index: number) => ReactNode` | Custom cell renderer |
| `mobileOnly` | `boolean` | Only show on mobile |
| `desktopOnly` | `boolean` | Only show on desktop |

**DataGrid Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `Column<T>[]` | **Required** | Column definitions |
| `data` | `T[]` | **Required** | Row data (must have `id`) |
| `loading` | `boolean` | — | Show skeleton loading |
| `emptyMessage` | `string` | `"Nenhum registro localizado na malha."` | Empty state message |
| `rowClassName` | `string` | — | Additional row classes |
| `onRowClick` | `(item: T) => void` | — | Row click handler |
| `minWidth` | `string` | `"min-w-mx-table"` | Table min-width |
| `stickyHeader` | `boolean` | `true` | Sticky table header |

---

### 3.4 Layout Components

#### 3.4.1 Layout Shell

**File:** `src/components/Layout.tsx`
**Description:** Main application shell providing header, sidebar, workspace, drawer navigation, and mobile navigation bar. Role-aware navigation configuration.

**Structure:**
```
┌─────────────────────────────────────────┐
│ Header (sticky, 80px)                   │
│ [Logo] [MX PERFORMANCE] [Store▼] [🔍] [🔔] [User] │
├──────┬──────────────────────────────────┤
│ Side │  Workspace (Outlet)              │
│ bar  │  (white, rounded-3xl)            │
│ 80px │                                  │
│      │                                  │
├──────┴──────────────────────────────────┤
│ Mobile Bar (md:hidden, fixed bottom)    │
└─────────────────────────────────────────┘
```

#### 3.4.2 Sidebar

- **Collapsed icon bar:** `80px` wide, vertical icon buttons per navigation category
- **Active state:** `bg-brand-secondary text-white shadow-mx-lg`
- **Hover tooltip:** Appears right of sidebar via absolute positioning
- **Drawer expansion:** On category click, opens a `280px` panel to the right with navigation links
- **Close:** X button or mouse leave
- **Logout:** Bottom icon button with red hover state

#### 3.4.3 Header

- **Left:** MX Logo (clickable → `/`) + "MX PERFORMANCE" branding
- **Center-right:** Store switcher (dono/admin only, native `<select>`), Search button, Notifications bell with unread badge
- **Right:** User profile button (name, role level, avatar)

#### 3.4.4 Mobile Navigation

**Bottom Bar (`md:hidden`):**
- Fixed, dark background (`bg-mx-black`), `rounded-mx-2xl`
- 5 slots: Home, Role-specific action, Central Menu button (elevated green), Ranking, Profile
- Role-specific slot: Vendedor → Checkin, Gerente/Admin → Equipe

**Mobile Menu (overlay):**
- Full-screen overlay with backdrop blur
- Bottom sheet with spring animation
- Organized by navigation categories
- Active link highlighted in green
- Sign out button at bottom

#### 3.4.5 Navigation Configuration (by Role)

**Admin:**
| Category | Items |
|---|---|
| Governança MX | Painel Geral, Lojas, Consultoria, Metas, Benchmarks, Funil |
| Rituais MX | Checkin, Ranking, Matinal Oficial, Feedback/PDI, Treinamentos, Produtos Digitais, Notificações |
| Sustentação | Configuração Operacional, Configurações |

**Dono:**
| Category | Items |
|---|---|
| Visão Executiva | Minhas Lojas, Performance, Metas, Funil |
| Acompanhamento | Matinal Oficial, Feedback/PDI |

**Gerente:**
| Category | Items |
|---|---|
| Operação Loja | Painel da Loja, Equipe, Rotina Diária, Ranking |
| Gestão de Gente | Feedback Estruturado, PDI, Treinamentos |

**Vendedor:**
| Category | Items |
|---|---|
| Meu Ritual | Home, Lançamento Diário, Histórico, Ranking |
| Evolução | Feedback, PDI, Treinamentos |

---

### 3.5 Feature Components

#### 3.5.1 GoogleCalendarView

**File:** `src/features/consultoria/components/GoogleCalendarView.tsx`
**Description:** Google Calendar integration view for consulting clients. Shows connected status, event list, and connect/disconnect flow.

**Props:** `clientId: string`
**Key behaviors:** Connect OAuth flow, refresh events, display events with time/location, empty/error states.

#### 3.5.2 WizardPDI

**File:** `src/features/pdi/WizardPDI.tsx`
**Description:** Full-screen modal wizard for creating PDI (Individual Development Plan) sessions. 4-step flow with radar chart visualization.

**Steps:**
1. **Especialista** — Select collaborator and job level
2. **Metas (7 min)** — Set 6/12/24-month personal and professional goals
3. **Mapeamento (10 min)** — Rate competencies on a scale with slider inputs, organized by technical/behavioral
4. **Plano de Ação (11 min)** — Define 5 development actions linked to top competency gaps, with radar chart and suggested actions from MX methodology

**Props:** `onClose: () => void, onSuccess: () => void`
**Charts:** Recharts `RadarChart` for competency mapping
**Accessibility:** Hidden `<table>` in step 4 for screen reader access to radar chart data.

#### 3.5.3 PrintableFeedback

**File:** `src/features/feedback/PrintableFeedback.tsx`
**Description:** Print-optimized feedback report component. Uses inline `<style>` with `@media print` rules and legacy HTML table layout.

**Sections:** Seller summary, Conversion analysis (real vs ideal), Team comparison, Diagnostic + Action orientation, Best practices reference.
**Print support:** Dedicated `@media print` styles.

#### 3.5.4 WeeklyStoreReport

**File:** `src/features/feedback/WeeklyStoreReport.tsx`
**Description:** Print-optimized weekly store performance report with ranking table, funnel conversion analysis, and diagnostics.

**Sections:** Team results by seller (with ranking), Funnel conversion (real vs ideal MX Criterion 20/60/33), Diagnostic + Action plan, Footer with audit signature.
**Print support:** Dedicated `@media print` styles.

#### 3.5.5 LegacyModuleShell

**File:** `src/components/LegacyModuleShell.tsx`
**Description:** Wrapping shell for legacy page content with decorative background elements and responsive padding.

---

## 4. Page Inventory

### 4.1 Public Pages

| # | Route | Component | Access | Purpose |
|---|---|---|---|---|
| 1 | `/login` | `Login` | Public | Authentication — split panel layout (brand left, form right) |
| 2 | `/privacy` | `Privacy` | Public | Privacy policy |
| 3 | `/terms` | `Terms` | Public | Terms of service |
| 4 | `*` | `NotFound` | Public | 404 fallback |

### 4.2 Authenticated — Common

| # | Route | Component | Access | Purpose |
|---|---|---|---|---|
| 5 | `/` | `RoleRedirect` | All | Redirects to role-specific dashboard |
| 6 | `/ranking` | `Ranking` | All | Sales ranking/Arena |
| 7 | `/perfil` | `Perfil` | All | User profile management |
| 8 | `/notificacoes` | `Notificacoes` | V,G,D | Notifications list |
| 9 | `/metas` | `GoalManagement` | All | Goal management |

### 4.3 Vendedor Pages

| # | Route | Component | Access | Purpose |
|---|---|---|---|---|
| 10 | `/home` | `VendedorHome` | V,G,D | Personal performance dashboard — MX ScoreCards, Arena, Channel Matrix, Weekly Sprint, MX Routine |
| 11 | `/checkin` | `Checkin` | V only | Daily check-in terminal — retrospective (yesterday), agenda (today), funnel validation |
| 12 | `/historico` | `Historico` | V,G,D | Check-in history |
| 13 | `/feedback` | `VendedorFeedback` | V | View received feedback |
| 14 | `/pdi` | `VendedorPDI` | V | View personal PDI |
| 15 | `/treinamentos` | `VendedorTreinamentos` | V | Training catalog |

### 4.4 Gerente Pages

| # | Route | Component | Access | Purpose |
|---|---|---|---|---|
| 16 | `/loja` | `DashboardLoja` | G | Store performance dashboard |
| 17 | `/loja/:storeSlug` | `DashboardLoja` | G | Specific store dashboard |
| 18 | `/equipe` | `Equipe` | G,D,A | Team management |
| 19 | `/funil` | `Funil` | G,D,A | Sales funnel view |
| 20 | `/feedback` | `GerenteFeedback` | G,D,A | Create/manage feedback |
| 21 | `/pdi` | `GerentePDI` | G,D,A | Manage PDI sessions (includes WizardPDI) |
| 22 | `/pdi/:id/print` | `PDIPrint` | G,D,A | Printable PDI document |
| 23 | `/treinamentos` | `GerenteTreinamentos` | G | Training management |
| 24 | `/rotina` | `RotinaGerente` | G,A | Daily routine management |
| 25 | `/relatorio-matinal` | `MorningReport` | G,D,A | Official morning report |

### 4.5 Dono Pages

| # | Route | Component | Access | Purpose |
|---|---|---|---|---|
| 26 | `/lojas` | `Lojas` | D,A | Store listing/selection |

### 4.6 Admin Pages

| # | Route | Component | Access | Purpose |
|---|---|---|---|---|
| 27 | `/painel` | `PainelConsultor` | A | Consultant panel/overview |
| 28 | `/consultoria` | `Consultoria` | A | Consulting module overview |
| 29 | `/consultoria/clientes` | `ConsultoriaClientes` | A | Consulting client list |
| 30 | `/consultoria/clientes/:clientId` | `ConsultoriaClienteDetalhe` | A | Client detail with Google Calendar |
| 31 | `/consultoria/clientes/:clientId/visitas/:visitNumber` | `ConsultoriaVisitaExecucao` | A | Visit execution |
| 32 | `/produtos` | `ProdutosDigitais` | A | Digital products management |
| 33 | `/treinamentos` | `ConsultorTreinamentos` | A | Training administration |
| 34 | `/notificacoes` | `ConsultorNotificacoes` | A | Notification management |
| 35 | `/configuracoes` | `Configuracoes` | A | System settings |
| 36 | `/configuracoes/operacional` | `OperationalSettings` | A | Operational configuration |
| 37 | `/configuracoes/reprocessamento` | `Reprocessamento` | A | Data reprocessing |
| 38 | `/auditoria` | `AiDiagnostics` | G,A | AI diagnostics/audit |

### 4.7 Report Pages

| # | Route | Component | Access | Purpose |
|---|---|---|---|---|
| 39 | `/relatorios/performance-vendas` | `SalesPerformance` | A | Sales performance benchmarks |
| 40 | `/relatorios/performance-vendedores` | `SellerPerformance` | A | Individual seller performance |

**Total: 40 routes (38 unique pages + RoleRedirect + redirect routes)**

---

## 5. User Flows

### 5.1 Vendedor Flow

```
Login → RoleRedirect → /home (VendedorHome)
  │
  ├─→ Check-in (/checkin)
  │     ├─ Select scope: "Registro Diário" or "Ajuste Técnico"
  │     ├─ Optional: Change reference date
  │     ├─ Fill retrospective (yesterday): Leads, Visitas, Vendas (Porta/Carteira/Internet)
  │     ├─ Fill agenda (today): Agenda Carteira, Agenda Internet
  │     ├─ Funnel validation (auto)
  │     ├─ Zero reason (if all zero)
  │     ├─ Notes (optional, 280 chars)
  │     └─ Submit → Success toast → Navigate to /home
  │
  ├─→ Ranking (/ranking) — Arena de Elite
  │
  ├─→ Feedback (/feedback) — View received feedback reports
  │
  ├─→ PDI (/pdi) — View personal development plan
  │
  ├─→ Treinamentos (/treinamentos) — Access training catalog
  │     └─ Tactical prescription on /home if gap detected
  │
  ├─→ Perfil (/perfil) — Edit profile, change password
  │
  └─→ Notificações (/notificacoes)
```

### 5.2 Gerente Flow

```
Login → RoleRedirect → /loja (DashboardLoja)
  │
  ├─→ Equipe (/equipe) — Team management, individual performance
  │
  ├─→ Rotina Diária (/rotina) — Daily routine checklist
  │
  ├─→ Ranking (/ranking) — Team ranking view
  │
  ├─→ Feedback (/feedback) — Create structured feedback for team members
  │     └─ Generates PrintableFeedback
  │
  ├─→ PDI (/pdi) — Manage PDI sessions
  │     ├─ Open WizardPDI (4-step modal)
  │     └─ Print PDI (/pdi/:id/print)
  │
  ├─→ Treinamentos (/treinamentos) — Assign/manage trainings
  │
  ├─→ Metas (/metas) — Goal management
  │
  ├─→ Funil (/funil) — Sales funnel analysis
  │
  └─→ Relatório Matinal (/relatorio-matinal)
```

### 5.3 Dono Flow

```
Login → RoleRedirect → /lojas (Store listing)
  │
  ├─→ Select store → /loja/:storeSlug (DashboardLoja)
  │
  ├─→ Performance (/loja) — Aggregated metrics
  │
  ├─→ Metas (/metas) — Cross-store goals
  │
  ├─→ Funil (/funil) — Funnel overview
  │
  ├─→ Relatório Matinal (/relatorio-matinal)
  │
  ├─→ Feedback (/feedback) — View/manage feedback
  │
  └─→ Store switcher (header dropdown) for multi-store navigation
```

### 5.4 Admin Flow

```
Login → RoleRedirect → /painel (PainelConsultor)
  │
  ├─→ Governança MX
  │     ├─ Lojas (/lojas) — All stores listing
  │     ├─ Consultoria
  │     │     ├─ Clientes (/consultoria/clientes)
  │     │     ├─ Cliente Detalhe (/consultoria/clientes/:id)
  │     │     │     └─ Google Calendar integration
  │     │     └─ Visita Execução (/consultoria/clientes/:id/visitas/:num)
  │     ├─ Metas (/metas)
  │     ├─ Benchmarks (/relatorios/performance-vendas)
  │     └─ Funil (/funil)
  │
  ├─→ Rituais MX
  │     ├─ Checkin (/checkin) — View/audit checkins
  │     ├─ Ranking (/ranking)
  │     ├─ Matinal (/relatorio-matinal)
  │     ├─ Feedback/PDI (/feedback, /pdi)
  │     ├─ Treinamentos (/treinamentos) — Admin training management
  │     ├─ Produtos Digitais (/produtos)
  │     └─ Notificações (/notificacoes)
  │
  ├─→ Sustentação
  │     ├─ Configuração Operacional (/configuracoes/operacional)
  │     ├─ Configurações (/configuracoes)
  │     └─ Reprocessamento (/configuracoes/reprocessamento)
  │
  ├─→ Auditoria (/auditoria) — AI diagnostics
  │
  └─→ Relatórios
        ├─ Performance Vendas (/relatorios/performance-vendas)
        └─ Performance Vendedores (/relatorios/performance-vendedores)
```

---

## 6. Responsive Design

### 6.1 Mobile Approach

The application is **mobile-first** with a distinct mobile navigation paradigm:

- **Bottom navigation bar** (`md:hidden`): Fixed at bottom, dark background, rounded, 5-slot layout
  - Home (role-dependent icon)
  - Role action (Vendedor: Checkin, Gerente/Admin: Equipe)
  - Central floating Menu button (green, elevated, `-translate-y`)
  - Ranking
  - Profile

- **Mobile menu**: Full overlay with spring-animated bottom sheet, organized by category groups, active link in green

### 6.2 Breakpoint Behavior

| Breakpoint | Sidebar | Nav Bar | Layout | Card Grid |
|---|---|---|---|---|
| `< 640px` (mobile) | Hidden | Bottom bar | Single column | 1 column |
| `sm` (640px+) | Hidden | Bottom bar | Single column | 2 columns (scorecards) |
| `md` (768px+) | Icon sidebar visible | Hidden | Sidebar + workspace | 2-3 columns |
| `lg` (1024px+) | Icon sidebar + drawer | Hidden | Full layout with aside | 3-4 columns, aside panels |
| `xl` (1280px+) | Full sidebar | Hidden | Maximum width | 4+ columns |

### 6.3 Touch Targets

- All interactive elements: minimum `44px` height on mobile (`h-mx-11` = 44px default button)
- Icon buttons: `48px` × `48px` (`w-mx-xl h-mx-xl`)
- NumberInput stepper buttons: `56px` × `56px` (`w-mx-14 h-mx-14`)
- Submit button: `96px` height (`h-mx-3xl`)
- Active press states: `active:scale-95` or `active:scale-[0.98]`

### 6.4 Scroll Behavior

- Workspace: `overflow-y-auto no-scrollbar` (custom utility hides scrollbar)
- Drawer: `overflow-y-auto no-scrollbar`
- Content areas use `pb-32` (bottom padding) to offset mobile bar on scroll

---

## 7. Accessibility (a11y)

### 7.1 Current State

#### Implemented
- **`role` attributes:** `banner` (header), `main` (workspace), `navigation` (sidebar, mobile bar, drawer, mobile menu categories), `dialog` (mobile menu), `list` (rules list in Checkin), `alert` (form errors), `tooltip` (sidebar tooltip), `presentation` (overlay)
- **`aria-label`:** Present on all icon buttons (search, notifications, profile, nav items, logout, close)
- **`aria-expanded` + `aria-controls`:** Sidebar category buttons control drawer
- **`aria-current="page"`:** Active navigation links
- **`aria-live="polite"`:** Live total updates in Checkin sidebar
- **`aria-modal="true"`:** WizardPDI dialog
- **`aria-hidden="true"`:** Decorative elements (background blurs, dividers, icons in buttons via auto-props)
- **`sr-only`:** Skeleton loading text, store switcher label
- **Focus management:** `focus-visible:ring-4` with brand color on all interactive elements
- **Keyboard nav:** `NavLink` and `<button>` elements are natively keyboard-accessible
- **Screen reader table:** WizardPDI step 4 includes hidden `<table>` with `<caption>` for radar chart data
- **Form labels:** `FormField` auto-generates IDs and associates labels; Login form uses explicit `<label htmlFor>`
- **Select accessibility:** Store switcher has `<label>` with `sr-only`

#### Partial / Needs Improvement
- **Login page:** Custom-styled inputs with `<label>` elements but no explicit `id`/`htmlFor` association (labels use className-based positioning)
- **Checkin page:** `NumberInput` component lacks explicit label association (uses visual `Typography` for labels)
- **Select elements:** Several `<select>` elements throughout (Checkin, WizardPDI) lack explicit `<label>` associations
- **Color contrast:** Some `opacity-40` text on light backgrounds may fail WCAG AA (e.g., `text-text-tertiary opacity-40`)
- **Skip navigation:** No "Skip to main content" link
- **Focus trap:** Mobile menu and WizardPDI dialog lack focus trapping
- **Reduced motion:** No `prefers-reduced-motion` handling for animations

### 7.2 NFR-17 Compliance Status

| Criterion | Status | Notes |
|---|---|---|
| Keyboard navigation | **PARTIAL** | All buttons/links keyboard accessible; missing focus traps in modals |
| Screen reader support | **PARTIAL** | ARIA roles present; missing some label associations |
| Color contrast | **PARTIAL** | Brand colors meet AA on white; muted text with opacity may fail |
| Form accessibility | **PARTIAL** | FormField molecule is accessible; many inline forms are not |
| Touch targets (mobile) | **PASS** | Minimum 44px on all interactive elements |
| Focus indicators | **PASS** | `focus-visible:ring-4` on all interactive elements |
| Reduced motion | **FAIL** | No `prefers-reduced-motion` media query |
| Skip navigation | **FAIL** | No skip link |

---

## 8. Performance UX

### 8.1 Lazy Loading

All page components are lazy-loaded via `React.lazy()` with `<Suspense>` boundaries:

```tsx
const Login = lazy(() => import('@/pages/Login'))
const VendedorHome = lazy(() => import('@/pages/VendedorHome'))
// ... all 38 pages
```

**Spinner fallback:** Custom spinner component with branded animation (green border ring + "MX PERFORMANCE" text).

### 8.2 Skeleton States

Pages implement full skeleton layouts matching the expected content structure:
- **VendedorHome:** Header skeleton → 4 MXScoreCard.Skeleton → Card skeleton with grid
- **DataGrid:** 5 skeleton rows matching row height
- **MXScoreCard:** Dedicated `.Skeleton` sub-component

### 8.3 Error States

- **ErrorBoundary:** Top-level React error boundary with:
  - Branded error screen (dark background, MX logo)
  - "Algo deu errado" message
  - Reload button
  - Dev-only error stack trace display
- **Data loading errors:** Toast notifications via Sonner (`toast.error()`)
- **Empty states:** DataGrid shows centered icon + "Nenhum registro localizado na malha."
- **Auth errors:** Login page inline error display with lockout countdown

### 8.4 Toast Notifications

**Library:** Sonner
**Configuration:** `<Toaster richColors position="top-right" />`
**Usage patterns:**
- `toast.success()` — Successful operations (checkin saved, profile updated)
- `toast.error()` — Validation errors, API failures, lockout messages
- Includes emoji in some success messages (e.g., "🎉 Vitória!")

### 8.5 Loading States

- **Auth bootstrap:** Full-screen spinner on dark background
- **Page transitions:** Suspense fallback spinner
- **Data loading:** Page-specific skeleton layouts matching content structure
- **Button loading:** Spinner icon replacing content (e.g., Login submit, Checkin submit)
- **Refresh:** `animate-spin` on RefreshCw icons

---

## 9. UX Technical Debt

### UX-01: Missing Focus Traps in Modals
- **Severidade:** HIGH
- **Description:** The mobile menu overlay (`role="dialog"`) and WizardPDI modal (`aria-modal="true"`) do not implement focus trapping. Tab key navigation escapes the modal context.
- **Impact:** Keyboard-only and screen reader users can tab to background content behind open modals, creating confusion and violating WCAG 2.1 SC 2.4.3 (Focus Order).

### UX-02: No Skip Navigation Link
- **Severidade:** HIGH
- **Description:** No "Skip to main content" link is present. The first tab stop is the logo button in the header.
- **Impact:** Keyboard users must tab through the entire header and sidebar before reaching main content on every page navigation. Violates WCAG 2.1 SC 2.4.1 (Bypass Blocks).

### UX-03: Reduced Motion Not Respected
- **Severidade:** MEDIUM
- **Description:** Framer Motion animations (`AnimatePresence`, `motion.div`, `animate-spin`, `animate-float`, `animate-bounce`) run unconditionally. No `prefers-reduced-motion` media query is implemented.
- **Impact:** Users with vestibular disorders or motion sensitivity experience discomfort from auto-playing animations. Violates WCAG 2.1 SC 2.3.3 (Animation from Interactions).

### UX-04: Missing Label Associations on Inline Forms
- **Severidade:** MEDIUM
- **Description:** The Login page, Checkin page (`NumberInput`), and WizardPDI use visual labels (Typography/capitalized text) without proper `<label htmlFor>` or `aria-labelledby` associations. Custom-styled `<select>` elements in Checkin and WizardPDI lack visible programmatic labels.
- **Impact:** Screen readers cannot determine the purpose of form fields. Autocomplete and form-filling tools may not work correctly.

### UX-05: Low Contrast on Muted Text
- **Severidade:** MEDIUM
- **Description:** Several patterns use `text-text-tertiary` (`#94a3b8`) combined with `opacity-40` or `opacity-60`, producing effective contrast ratios below WCAG AA (4.5:1 for small text).
- **Impact:** Users with low vision or color vision deficiency may be unable to read muted labels, timestamps, and tertiary information.

### UX-06: No Inline Form Validation in Login
- **Severidade:** LOW
- **Description:** Login form validates only on submit. Email format and password length are not validated inline with real-time feedback.
- **Impact:** Users only discover input errors after pressing submit, requiring a full round-trip. Minor friction increase.

### UX-07: Login Inputs Not Using Atom Components
- **Severidade:** LOW
- **Description:** Login page uses custom-styled `<input>` elements instead of the `Input` atom and `FormField` molecule. This creates visual inconsistency and bypasses the established component system.
- **Impact:** Maintainers must update styles in two places. Visual behavior may diverge from the design system.

### UX-08: Decorative Background Elements Not Optimized
- **Severidade:** LOW
- **Description:** Multiple pages render decorative blur circles (`bg-brand-primary/5 rounded-mx-full blur-3xl`) with large dimensions. These gradient elements are not GPU-accelerated and may cause repaints on lower-end devices.
- **Impact:** Potential jank on scroll in data-heavy pages, particularly on mobile devices with limited GPU memory.

### UX-09: No Breadcrumb Navigation
- **Severidade:** LOW
- **Description:** Deep pages (e.g., `/consultoria/clientes/:id/visitas/:num`) have no breadcrumb trail. Users rely solely on the sidebar/drawer or browser back button for orientation.
- **Impact:** Users may lose context of their position within the app hierarchy, particularly admin users navigating nested consulting flows.

### UX-10: Hardcoded Legacy Color Classes
- **Severidade:** LOW
- **Description:** PrintableFeedback and WeeklyStoreReport use hardcoded CSS color classes (`header-blue: #335c67`, `status-bom: #059669`, etc.) via inline `<style>` blocks instead of design tokens.
- **Impact:** These print components do not align with the MX green brand system and cannot be updated centrally through token changes.

---

## 10. Recommendations

### Priority 1 — Accessibility Compliance (Immediate)

1. **Add focus trap utility** to all modal/dialog components (mobile menu, WizardPDI). Consider `focus-trap-react` or a custom hook.
2. **Add skip navigation link** as the first focusable element in the Layout shell, targeting `#main-content`.
3. **Implement `prefers-reduced-motion`** via a global CSS media query that disables `animate-*` classes and wraps Framer Motion animations in a reduced-motion check.
4. **Audit and fix all form label associations** — convert Login inputs to use `FormField`, add `aria-label` or `aria-labelledby` to Checkin NumberInputs and all `<select>` elements.

### Priority 2 — Design System Consolidation (Short-term)

5. **Replace Login custom inputs** with `Input` atom + `FormField` molecule for consistency.
6. **Audit opacity values** on `text-text-tertiary` elements — replace `opacity-40`/`opacity-60` patterns with dedicated lighter color tokens that meet WCAG AA.
7. **Tokenize print component colors** — migrate PrintableFeedback and WeeklyStoreReport from inline styles to design tokens.

### Priority 3 — UX Enhancements (Medium-term)

8. **Add breadcrumb navigation** for nested routes (consultoria, pdi, relatórios).
9. **Implement real-time form validation** on Login and Checkin fields with debounced inline error messages.
10. **Optimize decorative elements** — use `will-change: transform` or CSS containment (`contain: layout paint`) on blur circles, or replace with static CSS gradients.
11. **Add loading state standardization** — create a page-level loading pattern that all routes follow, with consistent skeleton structure.

### Priority 4 — Delight & Polish (Long-term)

12. **Add page transition animations** between routes for smoother perceived navigation.
13. **Implement optimistic UI updates** for check-in submissions and profile edits.
14. **Add micro-interactions** to score cards (number counting animation on mount).
15. **Create a notification dropdown panel** in the header (currently the bell icon has no dropdown).

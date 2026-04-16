# Story 1.1: Atomic Design Foundation

## Status: Draft
## Epic: EPIC-UI-01 — Design System Completion & Architecture Hardening
## Priority: High
## Risk: Low
## Prerequisites: None
## Estimated Effort: 4-6 hours (AI agent execution)

---

## User Story

As a developer,
I want a complete set of foundational atoms and molecules,
so that I can build complex UIs from consistent, reusable building blocks.

---

## Acceptance Criteria

- [ ] All 6 atoms export from `src/components/atoms/` with proper TypeScript interfaces
- [ ] All 2 molecules export from `src/components/molecules/` with proper TypeScript interfaces
- [ ] All components follow CVA + `cn()` pattern from existing Button/Badge
- [ ] All components use MX design tokens only (no raw Tailwind colors like `bg-gray-100`)
- [ ] `npm run typecheck` passes with zero new errors
- [ ] `npm run lint` passes
- [ ] Unit tests for StatusBadge mapping logic

---

## Technical Specification

### Atoms to Create (6)

#### 1. Select.tsx
Custom select wrapping native `<select>` with CVA variants matching Input styling.

**Props:**
```typescript
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}
```

**Variants:**
- `variant`: default, outline (matching Input patterns)
- `size`: default, sm, lg

**Visual States:**
| State | Border | Ring | Background | Shadow |
|---|---|---|---|---|
| Default | `border-border-default` | none | `bg-white` | `shadow-inner` |
| Hover | `border-border-strong` | none | `bg-white` | `shadow-inner` |
| Focus | `border-brand-primary/30` | `ring-4 ring-brand-primary/5` | `bg-white` | `shadow-inner` |
| Error | `border-status-error` | `ring-4 ring-status-error/5` | `bg-white` | `shadow-inner` |
| Disabled | `border-border-default` | none | `bg-surface-alt` | none, `opacity-50` |

**Styling:** `h-mx-14 sm:h-12 rounded-mx-md px-4 text-sm font-bold text-text-primary` with `appearance-none` and custom chevron.

**Accessibility:** Native `<select>` semantics preserved. Label association via `id`/`htmlFor`. Error state announced via `aria-invalid` and `aria-describedby`. Forward ref support.

**Reference:** Inline selects in `AgendaAdmin.tsx:649,702,717` and `DREView.tsx:406-410`.

**Dependencies:** `cn`, Lucide `ChevronDown`

---

#### 2. Avatar.tsx
Image with fallback to initials circle.

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
| `md` (default) | `w-10 h-10` | `text-sm` | `rounded-mx-md` |
| `lg` | `w-12 h-12` | `text-base` | `rounded-mx-lg` |
| `xl` | `w-16 h-16` | `text-lg` | `rounded-mx-xl` |

**Visual Behavior:**
- If `src` provided: display `<img>` with `object-cover`
- Fallback: display first character of `name` in uppercase, centered, `font-black text-brand-primary bg-surface-alt border border-border-default`
- Image error: graceful fallback to initials

**Dependencies:** `cn`

---

#### 3. Tooltip.tsx
CSS-only tooltip on hover/focus using `group-hover` pattern.

**Props:**
```typescript
interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
  delayMs?: number
}
```

**Implementation:** CSS-only using `group-hover` and absolute positioning (matching existing pattern in `Layout.tsx` sidebar tooltips). No new dependencies.

**Styling:** `bg-brand-secondary text-white text-mx-micro font-black uppercase tracking-widest rounded-mx-md px-3 py-1.5 shadow-mx-lg opacity-0 invisible -> group-hover:opacity-100 group-hover:visible transition-all z-[70] whitespace-nowrap`

**Accessibility:** `role="tooltip"` on tooltip element. Trigger receives `aria-describedby` pointing to tooltip ID.

**Dependencies:** `cn`

---

#### 4. DatePicker.tsx
Styled date input wrapping native `<input type="date|month">`.

**Props:**
```typescript
interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  icon?: React.ReactNode
}
```

**Behavior:** Reuses Input base classes with date-specific styling. Native date picker on mobile (browser native). Custom calendar widget out of scope. Forward ref support.

**Dependencies:** `Input` atom, `cn`

---

#### 5. Accordion.tsx
Collapsible sections with animated expand/collapse using Motion.

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
- Chevron icon rotates 180deg when expanded

**Styling:**
- Header: `flex items-center justify-between p-mx-md bg-surface-alt/50 rounded-mx-lg cursor-pointer`
- Content: `p-mx-md space-y-mx-sm overflow-hidden`
- Border: `border border-border-default rounded-mx-xl`

**Accessibility:** `role="button"`, `aria-expanded`, `aria-controls` on header. `role="region"`, `aria-labelledby` on content panel.

**Reference:** Inline collapse logic in `DREView.tsx:418-453`.

**Dependencies:** `cn`, `motion` (framer-motion), Lucide `ChevronDown`

---

#### 6. EmptyState.tsx
Empty state placeholder with icon, message, and optional CTA.

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

**Styling:** `flex flex-col items-center justify-center py-20 text-center gap-mx-md text-text-label`
- Icon: 48px, `text-text-tertiary`
- Title: Typography `h3`
- Description: Typography `caption` with `tone="muted"`
- Action: Button `variant="secondary" size="sm"`

**Reference:** Inline empty states in `AgendaAdmin.tsx:427-435,573-576,578-584`, `DataGrid.tsx:51-59`, `DREView.tsx:234-239`.

**Dependencies:** `Typography`, `Button`, `cn`

---

### Molecules to Create (2)

#### 7. PageHeader.tsx
Consistent page header with title, subtitle, and actions slot.

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
+----------------------------------------------------+
| [Breadcrumb]                                       |
| [Green Bar] Title ACCENT                           |
| description text                                   |
|                                   [Action Btns]    |
+----------------------------------------------------+
```

**Styling (from AgendaAdmin.tsx:230-237):**
- Green bar: `w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md`
- Title: Typography `h1` with optional `<span className="text-mx-green-700">` for accent word
- Description: Typography `caption` with `tone="muted"`, `pl-mx-md`
- Actions area: `flex flex-wrap items-center gap-mx-sm`
- Bottom border: `border-b border-border-default pb-10`

**Responsive:** Stacks vertically on mobile (`flex-col lg:flex-row`).

**Reference:** Duplicated header pattern in `AgendaAdmin.tsx:230-272`, `DREView`.

**Dependencies:** `Typography`, `Breadcrumb`, `cn`

---

#### 8. StatusBadge.tsx
Domain-aware status badge mapping. Wraps existing `Badge` atom with status-to-variant mapping logic.

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

**Reference:** Inline `getVisitStatusBadge()` in `AgendaAdmin.tsx:47-55`.

**Dependencies:** `Badge` atom, `cn`

---

## Files to Create

| # | File Path | Type |
|---|-----------|------|
| 1 | `src/components/atoms/Select.tsx` | Atom |
| 2 | `src/components/atoms/Select.test.ts` | Test |
| 3 | `src/components/atoms/Avatar.tsx` | Atom |
| 4 | `src/components/atoms/Avatar.test.ts` | Test |
| 5 | `src/components/atoms/Tooltip.tsx` | Atom |
| 6 | `src/components/atoms/DatePicker.tsx` | Atom |
| 7 | `src/components/atoms/EmptyState.tsx` | Atom |
| 8 | `src/components/atoms/EmptyState.test.ts` | Test |
| 9 | `src/components/atoms/Accordion.tsx` | Atom |
| 10 | `src/components/molecules/PageHeader.tsx` | Molecule |
| 11 | `src/components/molecules/PageHeader.test.ts` | Test |
| 12 | `src/components/molecules/StatusBadge.tsx` | Molecule |

## Files to Modify

| # | File Path | Change |
|---|-----------|--------|
| 1 | (none currently) | No barrel export files exist for atoms/ or molecules/ directories |

> **Note:** Existing project uses direct file imports (e.g., `import { Button } from '@/components/atoms/Button'`). No `index.ts` barrel files to update.

---

## Component Dependency Map

```
Atoms (New)
├── Select ──────── depends on: cn, Lucide ChevronDown
├── Avatar ──────── depends on: cn
├── Tooltip ──────── depends on: cn
├── DatePicker ──── depends on: Input atom, cn
├── Accordion ──── depends on: cn, motion, Lucide ChevronDown
└── EmptyState ──── depends on: Typography, Button, cn

Molecules (New)
├── PageHeader ──── depends on: Typography, Breadcrumb, cn
└── StatusBadge ──── depends on: Badge atom, cn
```

---

## Integration Verification

- [ ] Existing pages render unchanged
- [ ] All existing tests pass (`npm test`)
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds

---

## Definition of Done

- [ ] All 8 components implemented with TypeScript interfaces
- [ ] CVA variants for visual states (Select, StatusBadge)
- [ ] Accessibility attributes (ARIA roles, keyboard navigation for Accordion, Tooltip)
- [ ] Responsive behavior defined (PageHeader stacks on mobile)
- [ ] All quality gates pass (lint, typecheck, build, tests)
- [ ] No raw Tailwind color classes — MX design tokens only
- [ ] Forward refs on Select and DatePicker

---

## Cross-References

- **PRD Overview:** `docs/prd/00-overview.md`
- **Requirements:** `docs/prd/01-requirements.md` (REQ-01 through REQ-09)
- **Story 1.2 (depends on this):** `docs/prd/03-story-1.2.md`
- **Component Architecture:** `docs/architecture/01-component-arch.md`
- **Front-End Spec:** `docs/front-end-spec.md` Sections 4.1-4.2

# STORY-01: Missing Atoms & Molecules

**Epic:** EPIC-UI-01 — Design System Completion & Architecture Hardening
**Prerequisites:** None
**Estimated Effort:** 4-6 hours (AI agent execution)
**Risk:** Low

---

## Goal

Fill the Atomic Design gaps by creating all missing atoms and molecules needed by downstream stories.

## Scope

- Create 6 new atoms: `Select`, `Avatar`, `Tooltip`, `DatePicker`, `Accordion`, `EmptyState`
- Create 2 new molecules: `PageHeader`, `StatusBadge`

---

## Detailed Requirements

### Atoms (`src/components/atoms/`)

#### 1. Select.tsx
Custom select wrapping native `<select>` with CVA variants matching Input styling. Must support:
- `variant`: default, outline (matching Input patterns)
- `size`: default, sm, lg
- Forward ref
- `children` for `<option>` elements
- Current inline selects in AgendaAdmin (lines 649, 702, 717) and DREView serve as reference

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

---

#### 2. Avatar.tsx
Image with fallback to initials circle. Must support:
- `src`, `alt`, `fallback` (initials string) props
- `size`: sm, default, lg
- Uses existing MX tokens for radius and colors

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

---

#### 3. Tooltip.tsx
Simple tooltip on hover/focus. Must support:
- `content`: string or ReactNode
- `side`: top, right, bottom, left
- Uses Radix or CSS-only approach (no new deps)
- `delayMs` prop

**Props:**
```typescript
interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
  delayMs?: number
}
```

**Implementation:** CSS-only tooltip using `group-hover` and absolute positioning (matching existing pattern in Layout.tsx sidebar tooltips). No Radix dependency needed.

**Styling:**
```
bg-brand-secondary text-white text-mx-micro font-black uppercase
tracking-widest rounded-mx-md px-3 py-1.5 shadow-mx-lg
opacity-0 invisible -> group-hover:opacity-100 group-hover:visible
transition-all z-[70] whitespace-nowrap
```

**Accessibility:** `role="tooltip"` on the tooltip element. Trigger element receives `aria-describedby` pointing to tooltip ID.

---

#### 4. DatePicker.tsx
Styled date input wrapping native `<input type="date|month">`. Must support:
- `type`: date, month
- Reuses Input base classes with date-specific styling
- Forward ref

**Props:**
```typescript
interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  icon?: React.ReactNode
}
```

**Mobile Behavior:** Native date picker triggered on tap (browser native `<input type="date">`).
**Desktop Behavior:** Same native browser picker. Custom calendar widget is out of scope for this iteration.

---

#### 5. Accordion.tsx
Collapsible sections with header + content. Must support:
- `items`: array of `{ id, title, content }`
- `defaultOpen`: string[] of initially open item ids
- Animated expand/collapse using Motion (already in deps)
- Replaces inline collapse logic in DREView lines 418-453

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

#### 6. EmptyState.tsx
Empty state placeholder with icon, message, and optional CTA. Must support:
- `icon`: LucideIcon component
- `title`, `description` strings
- `action` optional ReactNode (button/link)
- Replaces inline empty states in AgendaAdmin (lines 427-435, 573-576, 578-584)

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

### Molecules (`src/components/molecules/`)

#### 7. PageHeader.tsx
Consistent page header with title, subtitle, actions slot. Must support:
- `title`, `subtitle`, `icon` props
- `actions` render prop / ReactNode slot
- Replaces duplicated header patterns in AgendaAdmin (lines 230-272), DREView

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

#### 8. StatusBadge.tsx
Domain-aware status badge mapping. Must support:
- `status`: string (domain status value)
- `domain`: 'visit' | 'feedback' | 'pdi' | 'generic'
- Returns Badge with correct variant based on domain+status mapping
- Replaces inline `getVisitStatusBadge()` in AgendaAdmin (lines 47-55)

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

## Acceptance Criteria

- [ ] All 6 atoms export from `src/components/atoms/` with proper TypeScript interfaces
- [ ] All 2 molecules export from `src/components/molecules/` with proper TypeScript interfaces
- [ ] All components follow CVA + cn() pattern from existing Button/Badge
- [ ] All components use MX design tokens only (no raw Tailwind colors like `bg-gray-100`)
- [ ] `npm run typecheck` passes with zero new errors
- [ ] `npm run lint` passes
- [ ] Unit tests for StatusBadge mapping logic

## Files to Create

- `src/components/atoms/Select.tsx`
- `src/components/atoms/Avatar.tsx`
- `src/components/atoms/Tooltip.tsx`
- `src/components/atoms/DatePicker.tsx`
- `src/components/atoms/Accordion.tsx`
- `src/components/atoms/EmptyState.tsx`
- `src/components/molecules/PageHeader.tsx`
- `src/components/molecules/StatusBadge.tsx`

---

## Cross-References

- **PRD Overview:** See `docs/prd/00-overview.md`
- **Requirements:** See `docs/prd/01-requirements.md` (REQ-01 through REQ-09)
- **Story 1.2 (depends on this):** See `docs/prd/03-story-1.2.md`
- **Component Architecture:** See `docs/architecture/01-component-arch.md`
- **Front-End Spec (Component Specs):** See `docs/front-end-spec.md` Sections 4.1-4.2

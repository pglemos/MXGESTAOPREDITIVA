# STORY-02: Organism Extraction — Modal, Agenda & DRE

**Epic:** EPIC-UI-01 — Design System Completion & Architecture Hardening
**Prerequisites:** STORY-01 complete
**Estimated Effort:** 6-8 hours (AI agent execution)
**Risk:** Medium

---

## Goal

Build reusable organisms by extracting monolithic patterns from AgendaAdmin and DREView into composable components. Create a unified ModalShell molecule.

## Scope

- Create ModalShell molecule wrapping Radix Dialog
- Extract AgendaAdmin into: AgendaCalendar, VisitCard, MetricsBar organisms
- Extract DREView into: DRETable, DREForm organisms

---

## Detailed Requirements

### ModalShell Molecule (`src/components/molecules/ModalShell.tsx`)

Must wrap `@radix-ui/react-dialog` (already in deps) with:

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
│  │ <children />                    │    │
│  ├─────────────────────────────────┤    │
│  │ FOOTER                          │    │
│  │ [Cancel] [Confirm]              │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Features:**
- Integrated `useFocusTrap` as backup (Radix Dialog has built-in focus management)
- Backdrop click to close (configurable via `closeOnBackdropClick` prop)
- Escape key to close
- Consistent styling: `max-w-*` responsive, rounded-mx-2xl, shadow-mx-xl
- Animation: `motion.div` with `initial={{ opacity: 0, scale: 0.95 }}` → `animate={{ opacity: 1, scale: 1 }}`
- This replaces the raw div pattern used in AgendaAdmin (lines 628-765) and DREView (lines 394-495)

**Styling Details:**
- Modal card: `bg-white border-none shadow-mx-xl rounded-mx-3xl overflow-hidden`
- Header: `p-mx-lg border-b border-border-default sticky top-0 bg-white z-10`
- Content: `p-mx-lg overflow-y-auto max-h-[70vh]`
- Footer: `p-mx-lg border-t border-border-default flex justify-end gap-mx-sm`
- Close button: `w-mx-xl h-mx-xl rounded-mx-xl bg-surface-alt`

---

### AgendaCalendar (`src/components/organisms/AgendaCalendar.tsx`)

Extract calendar grid from AgendaAdmin lines 332-412 into standalone organism:

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

**Calendar Day States:**
```
Default:     bg-white, hover:bg-brand-primary/5
Today:       date number has bg-brand-primary text-white circle
Selected:    ring-2 ring-brand-primary ring-inset + bg-brand-primary/10
Outside:     opacity-40 bg-surface-alt/50
Has Visits:  colored bars (max 3) + "+N" overflow indicator
```

---

### VisitCard (`src/components/organisms/VisitCard.tsx`)

Extract visit list item from AgendaAdmin lines 460-548:

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

### MetricsBar (`src/components/organisms/MetricsBar.tsx`)

Extract metrics cards from AgendaAdmin lines 240-261:

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

### DRETable (`src/components/organisms/DRETable.tsx`)

Extract annual DRE table from DREView lines 312-392:

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

### DREForm (`src/components/organisms/DREForm.tsx`)

Extract modal form from DREView lines 394-495:

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

## Acceptance Criteria

- [ ] ModalShell molecule wraps Radix Dialog with consistent API
- [ ] AgendaAdmin page refactored to compose from AgendaCalendar + VisitCard + MetricsBar + Modal
- [ ] DREView refactored to compose from DRETable + DREForm + Modal
- [ ] All modals in refactored pages use ModalShell molecule (no raw div overlays)
- [ ] Focus trap active on all modals
- [ ] Visual parity — pages look identical before and after refactoring
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

## Files to Create

- `src/components/molecules/ModalShell.tsx`
- `src/components/organisms/AgendaCalendar.tsx`
- `src/components/organisms/VisitCard.tsx`
- `src/components/organisms/MetricsBar.tsx`
- `src/components/organisms/DRETable.tsx`
- `src/components/organisms/DREForm.tsx`

## Files to Modify

- `src/pages/AgendaAdmin.tsx` — refactor to use new organisms
- `src/features/consultoria/components/DREView.tsx` — refactor to use new organisms

---

## Cross-References

- **PRD Overview:** See `docs/prd/00-overview.md`
- **Requirements:** See `docs/prd/01-requirements.md` (REQ-10 through REQ-15, REQ-28)
- **Story 1.1 (prerequisite):** See `docs/prd/02-story-1.1.md`
- **Story 1.3 (parallel):** See `docs/prd/04-story-1.3.md`
- **Story 1.4 (parallel):** See `docs/prd/05-story-1.4.md`
- **Component Architecture:** See `docs/architecture/01-component-arch.md`
- **Migration Strategy:** See `docs/architecture/03-migration.md`

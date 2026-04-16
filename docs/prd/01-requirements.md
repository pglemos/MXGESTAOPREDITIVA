# PRD — EPIC-UI-01 Requirements

**Epic:** EPIC-UI-01 — Design System Completion & Architecture Hardening

---

## Key Requirements

| ID       | Requirement                                                                                                  | Priority | Story     | Category |
|----------|--------------------------------------------------------------------------------------------------------------|----------|-----------|----------|
| REQ-01   | Create Select atom with CVA variants matching Button patterns                                               | HIGH     | STORY-01  | FR       |
| REQ-02   | Create Avatar atom with image fallback to initials                                                           | HIGH     | STORY-01  | FR       |
| REQ-03   | Create Tooltip atom with hover/focus trigger                                                                 | MEDIUM   | STORY-01  | FR       |
| REQ-04   | Create DatePicker atom wrapping native date input with MX styling                                            | MEDIUM   | STORY-01  | FR       |
| REQ-05   | Create Accordion atom with collapsible sections                                                              | MEDIUM   | STORY-01  | FR       |
| REQ-07   | Create PageHeader molecule for consistent page titles                                                        | HIGH     | STORY-01  | FR       |
| REQ-08   | Create EmptyState atom with icon + message + optional CTA                                                   | HIGH     | STORY-01  | FR       |
| REQ-09   | Create StatusBadge molecule mapping domain statuses to visual variants                                       | HIGH     | STORY-01  | FR       |
| REQ-10   | Create ModalShell molecule wrapping Radix Dialog with focus trap integration                                 | CRITICAL | STORY-02  | FR       |
| REQ-11   | Create AgendaCalendar organism extracting calendar grid from AgendaAdmin                                     | HIGH     | STORY-02  | FR       |
| REQ-12   | Create VisitCard organism extracting visit list item from AgendaAdmin                                        | HIGH     | STORY-02  | FR       |
| REQ-13   | Create MetricsBar organism extracting metrics cards from AgendaAdmin header                                  | MEDIUM   | STORY-02  | FR       |
| REQ-14   | Create DRETable organism extracting annual DRE table from DREView                                           | HIGH     | STORY-02  | FR       |
| REQ-15   | Create DREForm organism extracting modal form from DREView                                                  | HIGH     | STORY-02  | FR       |
| REQ-16   | Install and configure TanStack Query (QueryClient, QueryClientProvider)                                      | CRITICAL | STORY-03  | FR       |
| REQ-17   | Split useData.ts into domain-specific hook files (useTrainings, useFeedbacks, useNotifications, etc.)        | CRITICAL | STORY-03  | FR       |
| REQ-18   | Convert split hooks to use TanStack Query useQuery/useMutation                                              | HIGH     | STORY-03  | FR       |
| REQ-19   | Create shared Supabase query helpers for TanStack Query integration                                          | HIGH     | STORY-03  | FR       |
| REQ-20   | Define Zod schemas for FeedbackFormData, PDIFormData, and DRE form data                                      | HIGH     | STORY-04  | FR       |
| REQ-21   | Apply Zod validation to all form submissions before Supabase calls                                           | HIGH     | STORY-04  | FR       |
| REQ-22   | Replace inline select elements in AgendaAdmin with Select atom                                               | MEDIUM   | STORY-05  | FR       |
| REQ-23   | Replace raw div modals with ModalShell molecule in AgendaAdmin and DREView                                   | CRITICAL | STORY-05  | FR       |
| REQ-24   | Replace inline StatusBadge logic with StatusBadge molecule in AgendaAdmin                                    | MEDIUM   | STORY-05  | FR       |
| REQ-25   | Replace inline EmptyState with EmptyState molecule in AgendaAdmin                                            | MEDIUM   | STORY-05  | FR       |
| REQ-26   | All new components must follow existing CVA + cn() patterns from Button/Badge                                | HIGH     | All       | NFR      |
| REQ-27   | All new components must use MX design tokens (not raw Tailwind colors)                                       | HIGH     | All       | NFR      |
| REQ-28   | All modals must have focus trap via useFocusTrap or Radix Dialog built-in                                    | CRITICAL | STORY-02  | NFR      |
| REQ-29   | TypeScript strict compliance — no `any` types in new components                                              | HIGH     | All       | NFR      |

**Totals:** 28 requirements — 21 Functional Requirements (FR), 4 Non-Functional Requirements (NFR)

---

## Non-Functional Requirements Detail

### REQ-26: CVA + cn() Pattern Compliance
All new components must use `class-variance-authority` for variant management and `cn()` from `@/lib/utils` for conditional className merging. Reference implementations: `Button.tsx`, `Badge.tsx`.

### REQ-27: MX Design Token Usage
All styling must use `mx-*` namespaced tokens defined in `src/index.css` `@theme { }` block. No hardcoded Tailwind colors (e.g., `bg-gray-100`), spacing, or radii.

### REQ-28: Focus Trap on All Modals
Every modal must implement keyboard focus trapping. Radix Dialog provides this automatically. Manual `useFocusTrap` usage should be replaced when ModalShell molecule is adopted.

### REQ-29: TypeScript Strict Compliance
No `any` types in new components. All props fully typed with interfaces. `forwardRef` generics correctly specified.

---

## Cross-References

- **PRD Overview:** See `docs/prd/00-overview.md`
- **Architecture:** See `docs/architecture/00-overview.md`
- **Component Architecture:** See `docs/architecture/01-component-arch.md`

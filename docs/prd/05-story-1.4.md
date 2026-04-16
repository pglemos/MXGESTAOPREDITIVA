# STORY-04: Zod Runtime Validation

**Epic:** EPIC-UI-01 — Design System Completion & Architecture Hardening
**Prerequisites:** STORY-01 complete (can run in parallel with STORY-02 and STORY-03)
**Estimated Effort:** 4-6 hours (AI agent execution)
**Risk:** Low

---

## Goal

Activate the existing Zod dependency for runtime form validation across all form-based interactions.

## Scope

- Define Zod schemas for all form data types
- Apply validation to form submissions in hooks and page components
- Create reusable validation utilities

---

## Detailed Requirements

### Schema Definitions (`src/lib/schemas/`)

#### 1. feedback.schema.ts

- `FeedbackFormSchema` validating `FeedbackFormData` fields:
  - `seller_id`: uuid string, required
  - `week_reference`: date string, required
  - `leads_week`, `agd_week`, `visit_week`, `vnd_week`: non-negative integers
  - `tx_lead_agd`, `tx_agd_visita`, `tx_visita_vnd`: numbers 0-100
  - `meta_compromisso`: number 0-100
  - `positives`, `attention_points`, `action`: string min 1
- Current unvalidated form: `useFeedbacks.createFeedback()` in useData.ts lines 92-125

#### 2. pdi.schema.ts

- `PDIFormSchema` validating `PDIFormData`:
  - `seller_id`: uuid, required
  - `meta_6m`, `meta_12m`, `meta_24m`: strings min 1
  - `action_1` through `action_5`: optional strings
  - `comp_*` fields (10 competency scores): numbers 1-10
  - `due_date`: optional date string
- Current unvalidated form: `usePDIs.createPDI()` in useData.ts lines 207-227

#### 3. dre.schema.ts

- `DREFormSchema` validating DRE form data:
  - `reference_date`: month string (YYYY-MM), required
  - All financial fields: numbers (allow negative for deductions)
  - `pro_labore`: non-negative number
- Current unvalidated form: DREView `handleSave()` lines 185-205

#### 4. agenda.schema.ts

- `ScheduleVisitSchema`:
  - `client_id`: uuid, required
  - `scheduled_at`: date string, required
  - `scheduled_time`: time string (HH:mm), required
  - `duration_hours`: number 1-12
  - `modality`: enum ['Presencial', 'Online']
- Current unvalidated form: AgendaAdmin `handleSubmitSchedule()` lines 160-194

---

### Validation Utility (`src/lib/validate.ts`)

- `validateForm<T>(schema, data)` — returns `{ success: true, data: T } | { success: false, errors: Record<string, string> }`
- Field-level error messages in Portuguese
- Toast integration helper: `showValidationErrors(errors)` using sonner

---

### Integration Points

- Wrap `createFeedback`, `createPDI`, `upsertFinancial`, `createVisit` mutation functions with Zod validation before Supabase call
- Return field-level errors to forms for inline display
- Use FormField molecule's error state for display

### Schema Pattern

```ts
import { z } from 'zod'

export const TrainingSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  type: z.string().nullable(),
  video_url: z.string().url().nullable(),
  target_audience: z.enum(['todos', 'vendedor', 'gerente', 'admin']),
  active: z.boolean(),
  created_at: z.string(),
})

export const TrainingArraySchema = z.array(TrainingSchema)

// In hook:
const result = TrainingArraySchema.safeParse(data)
if (!result.success) {
  console.error('[useTrainings] Schema validation failed:', result.error)
  throw new Error('Invalid training data from server')
}
return result.data
```

**Strategy:** Zod schemas validate data at **hook output boundaries** — after Supabase returns raw JSON, before components consume it. This catches API contract drift without changing Supabase queries.

### Additional Response Schemas

| Schema | File | Validates | Used By |
|--------|------|-----------|---------|
| `TrainingSchema` | `lib/schemas/training.schema.ts` | `trainings` + `training_progress` rows | `useTrainings` |
| `FeedbackSchema` | `lib/schemas/feedback.schema.ts` | `feedbacks` rows + join aliases | `useFeedbacks` |
| `PDISchema` | `lib/schemas/pdi.schema.ts` | `pdis` + `pdi_reviews` rows | `usePDIs` |
| `NotificationSchema` | `lib/schemas/notification.schema.ts` | `notifications` rows | `useNotifications` |
| `ConsultingClientSchema` | `lib/schemas/consulting-client.schema.ts` | `consulting_clients` + detail aggregates | `useConsultingClients` |
| `DREFinancialSchema` | `lib/schemas/dre.schema.ts` | `consulting_financials` rows (~40 fields) | `useDRE` |

---

## Acceptance Criteria

- [ ] 4 Zod schema files created covering all form types
- [ ] `validateForm` utility created with Portuguese error messages
- [ ] All form submissions validate before Supabase calls
- [ ] Invalid submissions show field-level errors (not just toast)
- [ ] `npm run typecheck` passes
- [ ] Unit tests for each schema (valid + invalid cases)

## Files to Create

- `src/lib/schemas/feedback.schema.ts`
- `src/lib/schemas/pdi.schema.ts`
- `src/lib/schemas/dre.schema.ts`
- `src/lib/schemas/agenda.schema.ts`
- `src/lib/validate.ts`
- `src/lib/schemas/__tests__/feedback.schema.test.ts`
- `src/lib/schemas/__tests__/pdi.schema.test.ts`
- `src/lib/schemas/__tests__/dre.schema.test.ts`
- `src/lib/schemas/__tests__/agenda.schema.test.ts`

## Files to Modify

- Hook files (after STORY-03 migration) — add Zod validation to mutation functions
- `src/pages/AgendaAdmin.tsx` — validate schedule form
- `src/features/consultoria/components/DREView.tsx` — validate DRE form

---

## Cross-References

- **PRD Overview:** See `docs/prd/00-overview.md`
- **Requirements:** See `docs/prd/01-requirements.md` (REQ-20, REQ-21)
- **Story 1.1 (prerequisite):** See `docs/prd/02-story-1.1.md`
- **Story 1.3 (parallel — hook migration):** See `docs/prd/04-story-1.3.md`
- **Data Layer Architecture:** See `docs/architecture/02-data-layer.md`

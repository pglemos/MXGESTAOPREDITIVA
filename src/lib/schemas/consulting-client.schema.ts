import { z } from 'zod'

export const ConsultingClientSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  legal_name: z.string().nullable(),
  cnpj: z.string().nullable(),
  product_name: z.string().nullable(),
  status: z.string(),
  notes: z.string().nullable(),
  modality: z.enum(['Presencial', 'Online']).optional(),
  current_visit_step: z.number().optional(),
  primary_store_id: z.string().nullable(),
  created_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type ConsultingClient = z.infer<typeof ConsultingClientSchema>

export function parseConsultingClient(data: unknown): ConsultingClient {
  return ConsultingClientSchema.parse(data)
}

export function parseConsultingClientArray(data: unknown): ConsultingClient[] {
  return z.array(ConsultingClientSchema).parse(data)
}

export const ConsultingClientUnitSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string(),
  name: z.string(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  is_primary: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type ConsultingClientUnit = z.infer<typeof ConsultingClientUnitSchema>

export function parseConsultingClientUnitArray(data: unknown): ConsultingClientUnit[] {
  return z.array(ConsultingClientUnitSchema).parse(data)
}

export const ConsultingClientContactSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.string().nullable(),
  is_primary: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type ConsultingClientContact = z.infer<typeof ConsultingClientContactSchema>

export function parseConsultingClientContactArray(data: unknown): ConsultingClientContact[] {
  return z.array(ConsultingClientContactSchema).parse(data)
}

export const ConsultingAssignmentSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string(),
  user_id: z.string(),
  assignment_role: z.enum(['responsavel', 'auxiliar', 'viewer']),
  active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type ConsultingAssignment = z.infer<typeof ConsultingAssignmentSchema>

export function parseConsultingAssignmentArray(data: unknown): ConsultingAssignment[] {
  return z.array(ConsultingAssignmentSchema).parse(data)
}

export const ConsultingMethodologyStepSchema = z.object({
  id: z.string().uuid(),
  visit_number: z.number(),
  objective: z.string(),
  target: z.string().nullable(),
  duration: z.string().nullable(),
  evidence_required: z.string().nullable(),
})

export type ConsultingMethodologyStep = z.infer<typeof ConsultingMethodologyStepSchema>

export function parseConsultingMethodologyStepArray(data: unknown): ConsultingMethodologyStep[] {
  return z.array(ConsultingMethodologyStepSchema).parse(data)
}

export const ConsultingFinancialSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string(),
  reference_date: z.string(),
  revenue: z.number(),
  fixed_expenses: z.number(),
  marketing_expenses: z.number(),
  investments: z.number(),
  financing: z.number(),
  net_profit: z.number(),
  roi: z.number(),
  conversion_rate: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type ConsultingFinancial = z.infer<typeof ConsultingFinancialSchema>

export function parseConsultingFinancialArray(data: unknown): ConsultingFinancial[] {
  return z.array(ConsultingFinancialSchema).parse(data)
}

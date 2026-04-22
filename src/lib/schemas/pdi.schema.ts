import { z } from 'zod'

export const PDISchema = z.object({
  id: z.string().uuid(),
  store_id: z.string(),
  manager_id: z.string(),
  seller_id: z.string(),
  comp_prospeccao: z.number(),
  comp_abordagem: z.number(),
  comp_demonstracao: z.number(),
  comp_fechamento: z.number(),
  comp_crm: z.number(),
  comp_digital: z.number(),
  comp_disciplina: z.number(),
  comp_organizacao: z.number(),
  comp_negociacao: z.number(),
  comp_produto: z.number(),
  meta_6m: z.string(),
  meta_12m: z.string(),
  meta_24m: z.string(),
  action_1: z.string(),
  action_2: z.string().nullable(),
  action_3: z.string().nullable(),
  action_4: z.string().nullable(),
  action_5: z.string().nullable(),
  due_date: z.string().nullable(),
  status: z.string(),
  acknowledged: z.boolean(),
  seller_acknowledged_at: z.string().nullable().optional(),
  manager_acknowledged_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type PDI = z.infer<typeof PDISchema>

export function parsePDI(data: unknown): PDI {
  return PDISchema.parse(data)
}

export function parsePDIArray(data: unknown): PDI[] {
  return z.array(PDISchema).parse(data)
}

export const PDIReviewSchema = z.object({
  id: z.string().uuid(),
  pdi_id: z.string(),
  reviewer_id: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
})

export type PDIReview = z.infer<typeof PDIReviewSchema>

export function parsePDIReview(data: unknown): PDIReview {
  return PDIReviewSchema.parse(data)
}

export function parsePDIReviewArray(data: unknown): PDIReview[] {
  return z.array(PDIReviewSchema).parse(data)
}

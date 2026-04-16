import { z } from 'zod'

export const FeedbackSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string(),
  manager_id: z.string(),
  seller_id: z.string(),
  week_reference: z.string(),
  leads_week: z.number(),
  agd_week: z.number(),
  visit_week: z.number(),
  vnd_week: z.number(),
  tx_lead_agd: z.number(),
  tx_agd_visita: z.number(),
  tx_visita_vnd: z.number(),
  meta_compromisso: z.number(),
  positives: z.string(),
  attention_points: z.string(),
  action: z.string(),
  notes: z.string().nullable(),
  team_avg_json: z.record(z.string(), z.any()),
  diagnostic_json: z.record(z.string(), z.any()),
  commitment_suggested: z.number(),
  acknowledged: z.boolean(),
  acknowledged_at: z.string().nullable(),
  created_at: z.string(),
})

export type Feedback = z.infer<typeof FeedbackSchema>

export function parseFeedback(data: unknown): Feedback {
  return FeedbackSchema.parse(data)
}

export function parseFeedbackArray(data: unknown): Feedback[] {
  return z.array(FeedbackSchema).parse(data)
}

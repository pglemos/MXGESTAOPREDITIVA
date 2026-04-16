import { z } from 'zod'

export const TeamProgressEntrySchema = z.object({
  seller_id: z.string(),
  seller_name: z.string(),
  watched: z.array(z.string()),
  total_trainings: z.number(),
  percentage: z.number(),
  current_gap: z.string().nullable(),
  gap_training_completed: z.boolean(),
})

export type TeamProgressEntry = z.infer<typeof TeamProgressEntrySchema>

export function parseTeamProgressEntry(data: unknown): TeamProgressEntry {
  return TeamProgressEntrySchema.parse(data)
}

export function parseTeamProgressEntryArray(data: unknown): TeamProgressEntry[] {
  return z.array(TeamProgressEntrySchema).parse(data)
}

export const TrainingProgressSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  training_id: z.string(),
  created_at: z.string().optional(),
})

export type TrainingProgress = z.infer<typeof TrainingProgressSchema>

export const TrainingSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  video_url: z.string(),
  target_audience: z.string(),
  active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string().optional(),
})

export type Training = z.infer<typeof TrainingSchema>

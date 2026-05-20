import type { ConsultingVisit } from '@/features/consultoria/types'

export type Tab =
  | 'overview'
  | 'visits'
  | 'strategic'
  | 'action'
  | 'financial'
  | 'daily'
  | 'monthly'
  | 'roi'
  | 'pdis'
  | 'files'

export type VisitManualForm = {
  visit_id: string
  visit_number: string
  status: ConsultingVisit['status']
  scheduled_at: string
  scheduled_time: string
  duration_hours: string
  modality: string
  consultant_id: string
  auxiliary_consultant_id: string
  visit_reason: string
  target_audience: string
  product_name: string
  objective: string
}

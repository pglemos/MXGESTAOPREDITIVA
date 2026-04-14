export interface ConsultingClient {
  id: string
  name: string
  legal_name: string | null
  cnpj: string | null
  product_name: string | null
  status: string
  notes: string | null
  modality?: 'Presencial' | 'Online'
  current_visit_step?: number
  primary_store_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ConsultingClientUnit {
  id: string
  client_id: string
  name: string
  city: string | null
  state: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface ConsultingClientContact {
  id: string
  client_id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface ConsultingAssignment {
  id: string
  client_id: string
  user_id: string
  assignment_role: 'responsavel' | 'auxiliar' | 'viewer'
  active: boolean
  created_at: string
  updated_at: string
  user?: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

export interface ConsultingAssignableUser {
  id: string
  name: string
  email: string
  role: string
}

export interface ConsultingVisit {
  id: string
  client_id: string
  visit_number: number
  scheduled_at: string
  duration_hours: number
  modality: string
  status: 'agendada' | 'concluída' | 'cancelada' | 'em_andamento'
  consultant_id: string | null
  auxiliary_consultant_id: string | null
  objective: string | null
  checklist_data: Array<{ task: string; completed: boolean }>
  feedback_client: string | null
  executive_summary: string | null
  google_event_id: string | null
  created_at: string
  updated_at: string
  consultant?: { name: string; email: string } | null
  auxiliary_consultant?: { name: string; email: string } | null
}

export interface ConsultingFinancial {
  id: string
  client_id: string
  reference_date: string
  revenue: number
  fixed_expenses: number
  marketing_expenses: number
  investments: number
  financing: number
  net_profit: number
  roi: number
  conversion_rate: number
  created_at: string
  updated_at: string
}

export interface ConsultingMethodologyStep {
  id: string
  visit_number: number
  objective: string
  target: string | null
  duration: string | null
  evidence_required: string | null
}

export interface ConsultingClientDetail extends ConsultingClient {
  units?: ConsultingClientUnit[]
  contacts?: ConsultingClientContact[]
  assignments?: ConsultingAssignment[]
  visits?: ConsultingVisit[]
  financials?: ConsultingFinancial[]
}

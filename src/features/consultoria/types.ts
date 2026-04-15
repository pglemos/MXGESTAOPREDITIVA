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

export interface ConsultingVisitAttachment {
  id: string
  filename: string
  storage_path: string
  content_type: string
  size_bytes: number
  uploaded_at: string
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
  attachments?: ConsultingVisitAttachment[]
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

export interface DREFinancial {
  id: string
  client_id: string
  reference_date: string
  revenue_proprios: number
  revenue_consignados: number
  revenue_repasse: number
  ded_preparacao: number
  ded_comissoes: number
  ded_impostos: number
  other_revenue_financiamento: number
  other_revenue_outros1: number
  other_revenue_outros2: number
  other_revenue_outros3: number
  payroll_salarios: number
  payroll_inss: number
  payroll_fgts: number
  payroll_seguro_social: number
  payroll_tempo_servico: number
  payroll_13salario: number
  payroll_ferias: number
  payroll_indenizacao: number
  payroll_outros: number
  pro_labore: number
  exp_fornecedores: number
  exp_agua: number
  exp_limpeza: number
  exp_viagens: number
  exp_energia: number
  exp_telefone: number
  exp_contabilidade: number
  exp_aluguel: number
  exp_frete: number
  exp_contribuicoes: number
  exp_terceiros: number
  exp_marketing: number
  exp_iptu: number
  exp_combustivel: number
  exp_manutencao_imovel: number
  exp_seguranca: number
  exp_cartorio: number
  exp_pos_venda: number
  exp_ir_csll: number
  exp_sistemas: number
  exp_emprestimo_pf: number
  exp_emprestimo_pj: number
  exp_tarifas: number
  exp_informatica: number
  exp_treinamentos: number
  exp_outras: number
  volume_vendas: number
  capital_proprio: number
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

export interface DREComputed {
  gross_margin: number
  total_deductions: number
  net_sales_margin: number
  other_revenue: number
  gross_profit: number
  total_payroll: number
  total_fixed: number
  pro_labore: number
  total_expenses: number
  net_profit: number
  avg_ticket: number
  margin_per_car: number
  net_margin_per_car: number
  prep_cost_per_car: number
  posvenda_per_car: number
  profit_per_car: number
  rentability: number
}

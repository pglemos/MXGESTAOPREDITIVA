// ============================================
// MX Gestão Preditiva — Database Types
// ============================================

export type UserRole = 'admin' | 'consultor' | 'gerente' | 'vendedor'
export type MembershipRole = 'gerente' | 'vendedor'
export type PDIStatus = 'aberto' | 'em_andamento' | 'concluido'
export type TrainingType = 'prospeccao' | 'fechamento' | 'atendimento' | 'gestao' | 'pre-vendas'
export type TargetAudience = 'vendedor' | 'gerente' | 'todos'
export type CheckinScope = 'daily' | 'adjustment' | 'historical'

export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    avatar_url: string | null
    is_venda_loja: boolean
    active: boolean
    created_at: string
}

export interface Store {
    id: string
    name: string
    manager_email: string | null
    active: boolean
    created_at: string
}

export interface StoreMetaRules {
    store_id: string
    monthly_goal: number
    individual_goal_mode: 'even' | 'custom' | 'proportional'
    include_venda_loja_in_store_total: boolean
    include_venda_loja_in_individual_goal: boolean
    bench_lead_agd: number
    bench_agd_visita: number
    bench_visita_vnd: number
    updated_by: string | null
    updated_at: string
}

export interface Membership {
    id: string
    user_id: string
    store_id: string
    role: MembershipRole
    created_at: string
}

export interface Goal {
    id: string
    store_id: string
    user_id: string | null
    month: number
    year: number
    target: number
    updated_at: string
    updated_by: string | null
}

export interface GoalLog {
    id: string
    goal_id: string
    changed_by: string
    prev_value: number | null
    new_value: number
    changed_at: string
}

export interface DailyCheckin {
    id: string
    seller_user_id: string
    store_id: string
    reference_date: string
    submitted_at: string
    metric_scope: CheckinScope
    leads_prev_day: number
    agd_cart_prev_day: number
    agd_net_prev_day: number
    agd_cart_today: number
    agd_net_today: number
    vnd_porta_prev_day: number
    vnd_cart_prev_day: number
    vnd_net_prev_day: number
    visit_prev_day: number
    zero_reason: string | null
    note: string | null
    updated_at: string
}

export interface Benchmark {
    id: string
    store_id: string
    lead_to_appt: number
    appt_to_visit: number
    visit_to_sale: number
}

export interface Training {
    id: string
    title: string
    description: string | null
    type: TrainingType
    video_url: string
    target_audience: TargetAudience
    active: boolean
    created_at: string
}

export interface TrainingProgress {
    id: string
    user_id: string
    training_id: string
    watched_at: string
}

export interface DigitalProduct {
    id: string
    name: string
    description: string | null
    link: string
    target_store_id: string | null
    created_at: string
}

export interface Feedback {
    id: string
    store_id: string
    manager_id: string
    seller_id: string
    week_reference: string
    leads_week: number
    agd_week: number
    visit_week: number
    vnd_week: number
    tx_lead_agd: number
    tx_agd_visita: number
    tx_visita_vnd: number
    meta_compromisso: number
    positives: string
    attention_points: string
    action: string
    notes: string | null
    acknowledged: boolean
    created_at: string
}

export interface PDI {
    id: string
    store_id: string
    manager_id: string
    seller_id: string
    // Radar de Competências (0-10)
    comp_prospeccao: number
    comp_abordagem: number
    comp_demonstracao: number
    comp_fechamento: number
    comp_crm: number
    comp_digital: number
    comp_disciplina: number
    comp_organizacao: number
    comp_negociacao: number
    comp_produto: number
    // Horizontes
    meta_6m: string
    meta_12m: string
    meta_24m: string
    // 5 Ações Mandatórias
    action_1: string
    action_2: string | null
    action_3: string | null
    action_4: string | null
    action_5: string | null
    due_date: string | null
    status: PDIStatus
    acknowledged: boolean
    created_at: string
    updated_at: string
}

export interface PDIReview {
    id: string
    pdi_id: string
    evolution: string
    difficulties: string | null
    adjustments: string | null
    next_review_date: string | null
    created_at: string
}

export type NotificationType = 'discipline' | 'alert' | 'performance' | 'system'
export type NotificationPriority = 'high' | 'medium' | 'low'

export interface Notification {
    id: string
    recipient_id: string
    store_id: string
    title: string
    message: string
    type: NotificationType
    priority: NotificationPriority
    link: string | null
    read: boolean
    created_at: string
}

export interface AuditLog {
    id: string
    user_id: string | null
    action: string
    entity: string
    entity_id: string | null
    details_json: Record<string, unknown> | null
    created_at: string
}

export interface Commission {
    id: string
    seller_id: string
    store_id: string
    car: string
    sale_date: string
    margin: string
    commission_amount: number
    created_at: string
    seller_name?: string
}

export interface CommissionRule {
    id: string
    store_id: string
    seller_id: string | null
    vehicle_type: string
    margin_min: number
    margin_max: number
    percentage: number
}

// ============================================
// Derived Types
// ============================================

export interface CheckinTotals {
    agd_total: number
    vnd_total: number
}

export interface CheckinWithTotals extends DailyCheckin, CheckinTotals {
    seller_id: string
    type: 'daily' | 'venda' | 'visita' | 'agendamento'
}

export interface StoreWithStats extends Store {
    vendedores_count: number
    vendas_mes: number
    meta: number
    atingimento: number
    projecao: number
}

export interface RankingEntry {
    user_id: string
    user_name: string
    store_name?: string
    is_venda_loja: boolean
    vnd_total: number
    leads: number
    agd_total: number
    visitas: number
    meta: number
    atingimento: number
    position: number
}

export interface FunnelData {
    leads: number
    agd_total: number
    visitas: number
    vnd_total: number
    tx_lead_agd: number
    tx_agd_visita: number
    tx_visita_vnd: number
}

export interface FunnelDiagnostic {
    gargalo: string | null
    mensagem: string
    etapa_problema: 'lead_agd' | 'agd_visita' | 'visita_vnd' | null
}

// ============================================
// Form Types
// ============================================

export interface CheckinFormData {
    leads: number
    agd_cart_prev: number
    agd_net_prev: number
    agd_cart: number
    agd_net: number
    vnd_porta: number
    vnd_cart: number
    vnd_net: number
    visitas: number
    note: string
    zero_reason: string
}

export interface GoalFormData {
    store_id: string
    user_id: string | null
    month: number
    year: number
    target: number
}

export interface FeedbackFormData {
    seller_id: string
    week_reference: string
    leads_week: number
    agd_week: number
    visit_week: number
    vnd_week: number
    tx_lead_agd: number
    tx_agd_visita: number
    tx_visita_vnd: number
    meta_compromisso: number
    positives: string
    attention_points: string
    action: string
    notes: string
}

export interface PDIFormData {
    seller_id: string
    meta_6m: string
    meta_12m: string
    meta_24m: string
    comp_prospeccao: number
    comp_abordagem: number
    comp_demonstracao: number
    comp_fechamento: number
    comp_crm: number
    comp_digital: number
    comp_disciplina: number
    comp_organizacao: number
    comp_negociacao: number
    comp_produto: number
    action_1: string
    action_2: string
    action_3: string
    action_4: string
    action_5: string
    due_date: string
}

export interface StoreFormData {
    name: string
    manager_email: string
}

export interface TrainingFormData {
    title: string
    description: string
    type: TrainingType
    video_url: string
    target_audience: TargetAudience
}

export interface NotificationFormData {
    title: string
    message: string
    target_type: 'all' | 'store'
    target_store_id: string | null
}

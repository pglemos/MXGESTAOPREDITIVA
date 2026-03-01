// ============================================
// MX Gestão Preditiva — Database Types
// ============================================

export type UserRole = 'consultor' | 'gerente' | 'vendedor'
export type MembershipRole = 'gerente' | 'vendedor'
export type PDIStatus = 'aberto' | 'em_andamento' | 'concluido'
export type TrainingType = 'prospeccao' | 'fechamento' | 'atendimento' | 'gestao' | 'pre-vendas'
export type TargetAudience = 'vendedor' | 'gerente' | 'todos'

export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    avatar_url: string | null
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
    user_id: string
    store_id: string
    date: string
    leads: number
    agd_cart: number
    agd_net: number
    vnd_porta: number
    vnd_cart: number
    vnd_net: number
    visitas: number
    note: string | null
    zero_reason: string | null
    created_at: string
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
    objective: string
    action: string
    due_date: string | null
    status: PDIStatus
    acknowledged: boolean
    created_at: string
    updated_at: string
}

export interface Notification {
    id: string
    sender_id: string
    title: string
    message: string
    target_type: 'all' | 'store'
    target_store_id: string | null
    target_role: string | null
    sent_at: string
}

export interface NotificationRead {
    id: string
    notification_id: string
    user_id: string
    read_at: string
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

// ============================================
// Derived Types
// ============================================

export interface CheckinTotals {
    agd_total: number
    vnd_total: number
}

export interface CheckinWithTotals extends DailyCheckin, CheckinTotals { }

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
    positives: string
    attention_points: string
    action: string
    notes: string
}

export interface PDIFormData {
    seller_id: string
    objective: string
    action: string
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

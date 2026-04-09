// ============================================
// MX PERFORMANCE — Canonical Database Types (EPIC-01)
// ============================================

/**
 * Tipos base vindos diretamente do schema do Postgres/Supabase.
 * Devem ser mantidos em sincronia com as migrações SQL.
 */

export type UserRole = 'admin' | 'dono' | 'gerente' | 'vendedor'
export type MembershipRole = 'dono' | 'gerente' | 'vendedor'
export type PDIStatus = 'aberto' | 'em_andamento' | 'concluido'
export type TrainingType = 'prospeccao' | 'fechamento' | 'atendimento' | 'gestao' | 'pre-vendas'
export type TargetAudience = 'vendedor' | 'gerente' | 'todos'
export type CheckinScope = 'daily' | 'adjustment' | 'historical'
export type CheckinSubmissionStatus = 'on_time' | 'late'
export type StoreSourceMode = 'legacy_forms' | 'native_app' | 'hybrid'

/** Interface de Usuário Canônica */
export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    avatar_url: string | null
    is_venda_loja: boolean
    active: boolean
    created_at: string
    phone?: string
    store_id?: string
}

/** Interface de Unidade/Loja */
export interface Store {
    id: string
    name: string
    manager_email: string | null
    active: boolean
    source_mode: StoreSourceMode
    created_at: string
    updated_at: string
}

/** Regras de Meta da Unidade (Crucial para cálculos de performance) */
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

/** Check-in Diário Operacional */
export interface DailyCheckin {
    id: string
    seller_user_id: string
    store_id: string
    reference_date: string // format: YYYY-MM-DD
    submitted_at: string   // ISO 8601
    metric_scope: CheckinScope
    submission_status: CheckinSubmissionStatus
    is_venda_loja: boolean
    
    // Métricas de Produção
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

/** Feedback Estruturado Semanal */
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
    team_avg_json: Record<string, any>
    diagnostic_json: Record<string, any>
    commitment_suggested: number
    acknowledged: boolean
    acknowledged_at: string | null
    created_at: string
}

/** Plano de Desenvolvimento Individual (PDI) */
export interface PDI {
    id: string
    store_id: string
    manager_id: string
    seller_id: string
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
    meta_6m: string
    meta_12m: string
    meta_24m: string
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

// ============================================
// Derived & UI Types
// ============================================

/** Resultado Processado do Ranking */
export interface RankingEntry {
    user_id: string
    user_name: string
    store_name?: string
    is_venda_loja: boolean
    vnd_total: number
    vnd_yesterday?: number
    leads: number
    agd_total: number
    visitas: number
    meta: number
    atingimento: number
    projecao: number
    ritmo: number
    efficiency: number
    status: { label: string; color: string }
    gap: number
    position: number
}

/** Dados do Funil de Vendas */
export interface FunnelData {
    leads: number
    agd_total: number
    visitas: number
    vnd_total: number
    tx_lead_agd: number
    tx_agd_visita: number
    tx_visita_vnd: number
}

/** Tipos de Formulários */
export interface CheckinFormData {
    leads?: number
    agd_cart_prev?: number
    agd_net_prev?: number
    agd_cart?: number
    agd_net?: number
    vnd_porta?: number
    vnd_cart?: number
    vnd_net?: number
    visitas?: number
    note?: string
    zero_reason?: string
    reference_date?: string
}

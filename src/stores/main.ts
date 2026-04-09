import { ReactNode, useSyncExternalStore } from 'react'
import { supabase } from '@/lib/supabase'
import type {
    Agency,
    Commission,
    CommissionRule,
    Goal,
    Task,
    TaskPriority,
    TaskStatus,
    TeamMember,
} from '@/types'

export type LeadStage =
    | 'Novo'
    | 'Contato'
    | 'Agendamento'
    | 'Visita'
    | 'Proposta'
    | 'Negociação'
    | 'Venda'
    | 'Perdido'

export interface Lead {
    id: string
    name: string
    car: string
    stage: LeadStage
    slaMinutes: number
    source: string
    value: number
    score: number
    lastAction?: string
    lossReason?: string
    stagnantDays?: number
    sellerId?: string
    agencyId?: string
    phone?: string
}

export interface InventoryItem {
    id: string
    model: string
    year: number
    plate: string
    aging: number
    cost: number
    price: number
    margin: number
    status: string
    marketPrice: number
    suggestedPrice: number
    competitivenessScore: number
    agencyId: string
}

type StoreState = {
    tasks: Task[]
    commissions: Commission[]
    commissionRules: CommissionRule[]
    goals: Goal[]
    team: TeamMember[]
    leads: Lead[]
    inventory: InventoryItem[]
    agencies: Agency[]
    auditLogs: any[]
    activeAgencyId: string | null
    chainedFunnel: boolean
    isLoading: boolean
    error: string | null
}

const storeState: StoreState = {
    tasks: [],
    commissions: [],
    commissionRules: [],
    goals: [],
    team: [],
    leads: [],
    inventory: [],
    agencies: [],
    auditLogs: [],
    activeAgencyId: null,
    chainedFunnel: true,
    isLoading: true,
    error: null,
}

const listeners = new Set<() => void>()

function emit() {
    listeners.forEach(listener => listener())
}

function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

function snapshot() {
    return storeState
}

function id(prefix: string) {
    return `${prefix}-${crypto.randomUUID()}`
}

const actions = {
    refetch: async () => {
        storeState.isLoading = true
        emit()
        try {
            // Buscando todos os registros para uma agregação completa no store
            const { data, error } = await supabase.from('daily_checkins').select('*')
            if (error) throw error
            
            storeState.leads = data || []
            storeState.isLoading = false
            console.log('Dados carregados:', data.length)
        } catch (error) {
            console.error('Error refetching:', error)
            storeState.error = 'Failed to fetch data'
            storeState.isLoading = false
        }
        emit()
    },
    addTask(data: any) {
        storeState.tasks = [data, ...storeState.tasks]
        emit()
    },
    setActiveAgency(idValue: string | null) {
        storeState.activeAgencyId = idValue
        emit()
    },
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
    return children as any
}

export default function useAppStore() {
    const state = useSyncExternalStore(subscribe, snapshot, snapshot)
    return {
        ...state,
        ...actions,
    }
}

export function useUsers() {
    const state = useAppStore()
    return { team: state.team, agencies: state.agencies, activeAgencyId: state.activeAgencyId }
}

export function useFinance() {
    const state = useAppStore()
    return {
        commissions: state.commissions,
        commissionRules: state.commissionRules,
        goals: state.goals,
        addCommissionRule: (data: any) => {}, 
        updateCommissionRule: (id: string, updates: any) => {},
        deleteCommissionRule: (id: string) => {},
        refetch: state.refetch
    }
}

export type { Agency, Commission, CommissionRule, Goal, Task, TaskPriority, TaskStatus, TeamMember }

import { ReactNode, useSyncExternalStore } from 'react'
import {
    mockLeads,
    mockInventory,
    mockTeam,
    mockTasks,
    mockCommissions,
    mockCommissionRules,
    mockGoals,
    mockAgencies,
    mockAuditLogs,
} from '@/lib/mock-data'
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
}

let storeState: StoreState = {
    tasks: JSON.parse(JSON.stringify(mockTasks)),
    commissions: JSON.parse(JSON.stringify(mockCommissions)),
    commissionRules: JSON.parse(JSON.stringify(mockCommissionRules)),
    goals: JSON.parse(JSON.stringify(mockGoals)),
    team: JSON.parse(JSON.stringify(mockTeam)),
    leads: JSON.parse(JSON.stringify(mockLeads)),
    inventory: JSON.parse(JSON.stringify(mockInventory)),
    agencies: JSON.parse(JSON.stringify(mockAgencies)),
    auditLogs: JSON.parse(JSON.stringify(mockAuditLogs)),
    activeAgencyId: mockAgencies[0]?.id || null,
    chainedFunnel: true,
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

function createTask(data: Omit<Task, 'id' | 'status'> & { status?: TaskStatus }): Task {
    return {
        id: id('task'),
        status: data.status || 'pendente',
        ...data,
    } as any
}

function createCommissionRule(data: Omit<CommissionRule, 'id'>): CommissionRule {
    return { id: id('rule'), ...data }
}

function createGoal(data: Omit<Goal, 'id'>): Goal {
    return { id: id('goal'), ...data }
}

function createCommission(data: Omit<Commission, 'id'>): Commission {
    return { id: id('com'), ...data }
}

function createLead(data: Omit<Lead, 'id'>): Lead {
    return { id: id('lead'), ...data } as any
}

const actions = {
    refetch: async () => {},
    addTask(data: Omit<Task, 'id' | 'status'> & { status?: TaskStatus }) {
        storeState = { ...storeState, tasks: [createTask(data), ...storeState.tasks] }
        emit()
    },
    updateTask(idValue: string, updates: Partial<Task>) {
        storeState = { ...storeState, tasks: storeState.tasks.map(task => task.id === idValue ? { ...task, ...updates } : task) as any[] }
        emit()
    },
    deleteTask(idValue: string) {
        storeState = { ...storeState, tasks: storeState.tasks.filter(task => task.id !== idValue) }
        emit()
    },
    addCommissionRule(data: Omit<CommissionRule, 'id'>) {
        storeState = { ...storeState, commissionRules: [createCommissionRule(data), ...storeState.commissionRules] }
        emit()
    },
    updateCommissionRule(idValue: string, updates: Partial<CommissionRule>) {
        storeState = { ...storeState, commissionRules: storeState.commissionRules.map(rule => rule.id === idValue ? { ...rule, ...updates } : rule) }
        emit()
    },
    deleteCommissionRule(idValue: string) {
        storeState = { ...storeState, commissionRules: storeState.commissionRules.filter(rule => rule.id !== idValue) }
        emit()
    },

    setGoal(goal: Omit<Goal, 'id'> & { id?: string }) {
        if (goal.id) {
            storeState = { ...storeState, goals: storeState.goals.map(item => item.id === goal.id ? { ...item, ...goal } : item) }
        } else {
            storeState = { ...storeState, goals: [createGoal(goal), ...storeState.goals] }
        }
        emit()
    },
    deleteGoal(idValue: string) {
        storeState = { ...storeState, goals: storeState.goals.filter(goal => goal.id !== idValue) }
        emit()
    },
    addCommission(data: Omit<Commission, 'id'>) {
        storeState = { ...storeState, commissions: [createCommission(data), ...storeState.commissions] }
        emit()
    },
    addLead(data: Omit<Lead, 'id'>) {
        storeState = { ...storeState, leads: [createLead(data), ...storeState.leads] }
        emit()
    },
    updateLead(idValue: string, updates: Partial<Lead>) {
        storeState = { ...storeState, leads: storeState.leads.map(lead => lead.id === idValue ? { ...lead, ...updates } : lead) }
        emit()
    },
    deleteLead(idValue: string) {
        storeState = { ...storeState, leads: storeState.leads.filter(lead => lead.id !== idValue) }
        emit()
    },
    addTeamMember(member: TeamMember) {
        storeState = { ...storeState, team: [{ ...member, id: member.id || id('team') }, ...storeState.team] }
        emit()
    },
    updateTeamMember(idValue: string, updates: Partial<TeamMember>) {
        storeState = { ...storeState, team: storeState.team.map(member => member.id === idValue ? { ...member, ...updates } : member) }
        emit()
    },
    deleteTeamMember(idValue: string) {
        storeState = { ...storeState, team: storeState.team.filter(member => member.id !== idValue) }
        emit()
    },
    setActiveAgency(idValue: string | null) {
        storeState = { ...storeState, activeAgencyId: idValue }
        emit()
    },
    toggleChainedFunnel(value?: boolean) {
        storeState = { ...storeState, chainedFunnel: value ?? !storeState.chainedFunnel }
        emit()
    },
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
    return children as any
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
        addCommissionRule: state.addCommissionRule,
        updateCommissionRule: state.updateCommissionRule,
        deleteCommissionRule: state.deleteCommissionRule,
        refetch: state.refetch
    }
}

export default function useAppStore() {
    const state = useSyncExternalStore(subscribe, snapshot, snapshot)
    return {
        ...state,
        ...actions,
    }
}

export type { Agency, Commission, CommissionRule, Goal, Task, TaskPriority, TaskStatus, TeamMember }

export const _test_resetStore = () => {
    storeState = {
        tasks: JSON.parse(JSON.stringify(mockTasks)),
        commissions: JSON.parse(JSON.stringify(mockCommissions)),
        commissionRules: JSON.parse(JSON.stringify(mockCommissionRules)),
        goals: JSON.parse(JSON.stringify(mockGoals)),
        team: JSON.parse(JSON.stringify(mockTeam)),
        leads: JSON.parse(JSON.stringify(mockLeads)),
        inventory: JSON.parse(JSON.stringify(mockInventory)),
        agencies: JSON.parse(JSON.stringify(mockAgencies)),
        auditLogs: JSON.parse(JSON.stringify(mockAuditLogs)),
        activeAgencyId: mockAgencies[0]?.id || null,
        chainedFunnel: true,
    }

    // Also re-assign actions reference to storeState if needed, but actions accesses storeState directly
    emit()
}

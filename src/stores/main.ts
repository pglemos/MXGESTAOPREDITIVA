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

const storeState: StoreState = {
    tasks: [...mockTasks],
    commissions: [...mockCommissions],
    commissionRules: [...mockCommissionRules],
    goals: [...mockGoals],
    team: [...mockTeam],
    leads: [...mockLeads],
    inventory: [...mockInventory],
    agencies: [...mockAgencies],
    auditLogs: [...mockAuditLogs],
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
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

function createTask(data: Omit<Task, 'id' | 'status'> & { status?: TaskStatus }): Task {
    return {
        id: id('task'),
        status: data.status || 'Pendente',
        ...data,
    }
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
    return { id: id('lead'), ...data }
}

const actions = {
    addTask(data: Omit<Task, 'id' | 'status'> & { status?: TaskStatus }) {
        storeState.tasks = [createTask(data), ...storeState.tasks]
        emit()
    },
    updateTask(idValue: string, updates: Partial<Task>) {
        storeState.tasks = storeState.tasks.map(task => task.id === idValue ? { ...task, ...updates } : task)
        emit()
    },
    deleteTask(idValue: string) {
        storeState.tasks = storeState.tasks.filter(task => task.id !== idValue)
        emit()
    },
    addCommissionRule(data: Omit<CommissionRule, 'id'>) {
        storeState.commissionRules = [createCommissionRule(data), ...storeState.commissionRules]
        emit()
    },
    deleteCommissionRule(idValue: string) {
        storeState.commissionRules = storeState.commissionRules.filter(rule => rule.id !== idValue)
        emit()
    },
    setGoal(goal: Omit<Goal, 'id'> & { id?: string }) {
        if (goal.id) {
            storeState.goals = storeState.goals.map(item => item.id === goal.id ? { ...item, ...goal } : item)
        } else {
            storeState.goals = [createGoal(goal), ...storeState.goals]
        }
        emit()
    },
    deleteGoal(idValue: string) {
        storeState.goals = storeState.goals.filter(goal => goal.id !== idValue)
        emit()
    },
    addCommission(data: Omit<Commission, 'id'>) {
        storeState.commissions = [createCommission(data), ...storeState.commissions]
        emit()
    },
    addLead(data: Omit<Lead, 'id'>) {
        storeState.leads = [createLead(data), ...storeState.leads]
        emit()
    },
    updateLead(idValue: string, updates: Partial<Lead>) {
        storeState.leads = storeState.leads.map(lead => lead.id === idValue ? { ...lead, ...updates } : lead)
        emit()
    },
    deleteLead(idValue: string) {
        storeState.leads = storeState.leads.filter(lead => lead.id !== idValue)
        emit()
    },
    addTeamMember(member: TeamMember) {
        storeState.team = [{ ...member, id: member.id || id('team') }, ...storeState.team]
        emit()
    },
    updateTeamMember(idValue: string, updates: Partial<TeamMember>) {
        storeState.team = storeState.team.map(member => member.id === idValue ? { ...member, ...updates } : member)
        emit()
    },
    deleteTeamMember(idValue: string) {
        storeState.team = storeState.team.filter(member => member.id !== idValue)
        emit()
    },
    setActiveAgency(idValue: string | null) {
        storeState.activeAgencyId = idValue
        emit()
    },
    toggleChainedFunnel(value?: boolean) {
        storeState.chainedFunnel = value ?? !storeState.chainedFunnel
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
        deleteCommissionRule: state.deleteCommissionRule,
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

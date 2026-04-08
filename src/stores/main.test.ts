import { describe, it, expect, beforeEach } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import useAppStore, { useUsers, useFinance, _test_resetStore } from './main'

describe('main store - Actions', () => {
    beforeEach(() => {
        _test_resetStore()
    })

    describe('Tasks', () => {
        it('should add a task', () => {
            const { result } = renderHook(() => useAppStore())
            const initialCount = result.current.tasks.length

            act(() => {
                result.current.addTask({
                    title: 'New Task',
                    description: 'Description',
                    priority: 'alta',
                    dueDate: '2025-01-01',
                    assignedTo: 'user-1'
                })
            })

            expect(result.current.tasks.length).toBe(initialCount + 1)
            expect(result.current.tasks[0].title).toBe('New Task')
            expect(result.current.tasks[0].status).toBe('pendente') // Default status
        })

        it('should update a task', () => {
            const { result } = renderHook(() => useAppStore())
            const taskId = result.current.tasks[0].id

            act(() => {
                result.current.updateTask(taskId, { title: 'Updated Task' })
            })

            expect(result.current.tasks[0].title).toBe('Updated Task')
        })

        it('should handle updating a non-existent task gracefully', () => {
            const { result } = renderHook(() => useAppStore())
            const initialTasks = [...result.current.tasks]

            act(() => {
                result.current.updateTask('non-existent-id', { title: 'Updated Task' })
            })

            expect(result.current.tasks).toEqual(initialTasks)
        })

        it('should delete a task', () => {
            const { result } = renderHook(() => useAppStore())
            const taskId = result.current.tasks[0].id
            const initialCount = result.current.tasks.length

            act(() => {
                result.current.deleteTask(taskId)
            })

            expect(result.current.tasks.length).toBe(initialCount - 1)
            expect(result.current.tasks.find(t => t.id === taskId)).toBeUndefined()
        })
    })

    describe('Commission Rules', () => {
        it('should add a commission rule', () => {
            const { result } = renderHook(() => useAppStore())
            const initialCount = result.current.commissionRules.length

            act(() => {
                result.current.addCommissionRule({
                    name: 'New Rule',
                    type: 'percentage',
                    value: 10,
                    condition: 'sale'
                })
            })

            expect(result.current.commissionRules.length).toBe(initialCount + 1)
            expect(result.current.commissionRules[0].name).toBe('New Rule')
        })

        it('should update a commission rule', () => {
            const { result } = renderHook(() => useAppStore())
            const ruleId = result.current.commissionRules[0].id

            act(() => {
                result.current.updateCommissionRule(ruleId, { name: 'Updated Rule' })
            })

            expect(result.current.commissionRules.find(r => r.id === ruleId)?.name).toBe('Updated Rule')
        })

        it('should delete a commission rule', () => {
            const { result } = renderHook(() => useAppStore())
            const ruleId = result.current.commissionRules[0].id
            const initialCount = result.current.commissionRules.length

            act(() => {
                result.current.deleteCommissionRule(ruleId)
            })

            expect(result.current.commissionRules.length).toBe(initialCount - 1)
            expect(result.current.commissionRules.find(r => r.id === ruleId)).toBeUndefined()
        })
    })

    describe('Goals', () => {
        it('should add a new goal when ID is not provided', () => {
            const { result } = renderHook(() => useAppStore())
            const initialCount = result.current.goals.length

            act(() => {
                result.current.setGoal({
                    target: 100,
                    achieved: 0,
                    period: 'monthly',
                    type: 'sales'
                })
            })

            expect(result.current.goals.length).toBe(initialCount + 1)
            expect(result.current.goals[0].target).toBe(100)
        })

        it('should update an existing goal when ID is provided', () => {
            const { result } = renderHook(() => useAppStore())
            const goalId = result.current.goals[0].id

            act(() => {
                result.current.setGoal({
                    id: goalId,
                    target: 200,
                    achieved: 10,
                    period: 'monthly',
                    type: 'sales'
                })
            })

            expect(result.current.goals.find(g => g.id === goalId)?.target).toBe(200)
        })

        it('should handle updating a non-existent goal gracefully', () => {
             const { result } = renderHook(() => useAppStore())
             const initialGoals = [...result.current.goals]

             act(() => {
                 result.current.setGoal({
                     id: 'non-existent-id',
                     target: 200,
                     achieved: 10,
                     period: 'monthly',
                     type: 'sales'
                 })
             })

             expect(result.current.goals).toEqual(initialGoals)
        })

        it('should delete a goal', () => {
            const { result } = renderHook(() => useAppStore())
            const goalId = result.current.goals[0].id
            const initialCount = result.current.goals.length

            act(() => {
                result.current.deleteGoal(goalId)
            })

            expect(result.current.goals.length).toBe(initialCount - 1)
            expect(result.current.goals.find(g => g.id === goalId)).toBeUndefined()
        })
    })

    describe('Commissions', () => {
        it('should add a commission', () => {
            const { result } = renderHook(() => useAppStore())
            const initialCount = result.current.commissions.length

            act(() => {
                result.current.addCommission({
                    amount: 500,
                    sellerId: 'seller-1',
                    leadId: 'lead-1',
                    date: '2025-01-01',
                    status: 'pendente'
                })
            })

            expect(result.current.commissions.length).toBe(initialCount + 1)
            expect(result.current.commissions[0].amount).toBe(500)
        })
    })

    describe('Leads', () => {
        it('should add a lead', () => {
            const { result } = renderHook(() => useAppStore())
            const initialCount = result.current.leads.length

            act(() => {
                result.current.addLead({
                    name: 'John Doe',
                    car: 'Civic',
                    stage: 'Novo',
                    slaMinutes: 30,
                    source: 'Web',
                    value: 50000,
                    score: 80
                })
            })

            expect(result.current.leads.length).toBe(initialCount + 1)
            expect(result.current.leads[0].name).toBe('John Doe')
        })

        it('should update a lead', () => {
            const { result } = renderHook(() => useAppStore())
            const leadId = result.current.leads[0].id

            act(() => {
                result.current.updateLead(leadId, { name: 'Updated Name' })
            })

            expect(result.current.leads.find(l => l.id === leadId)?.name).toBe('Updated Name')
        })

        it('should delete a lead', () => {
            const { result } = renderHook(() => useAppStore())
            const leadId = result.current.leads[0].id
            const initialCount = result.current.leads.length

            act(() => {
                result.current.deleteLead(leadId)
            })

            expect(result.current.leads.length).toBe(initialCount - 1)
            expect(result.current.leads.find(l => l.id === leadId)).toBeUndefined()
        })
    })

    describe('Team Members', () => {
        it('should add a team member without explicit id', () => {
            const { result } = renderHook(() => useAppStore())
            const initialCount = result.current.team.length

            act(() => {
                result.current.addTeamMember({
                    name: 'Jane Doe',
                    role: 'vendedor',
                    agencyId: 'agency-1',
                    active: true,
                    email: 'jane@test.com'
                })
            })

            expect(result.current.team.length).toBe(initialCount + 1)
            expect(result.current.team[0].name).toBe('Jane Doe')
            expect(result.current.team[0].id).toBeDefined()
        })

        it('should add a team member with explicit id', () => {
            const { result } = renderHook(() => useAppStore())
            const initialCount = result.current.team.length

            act(() => {
                result.current.addTeamMember({
                    id: 'custom-id',
                    name: 'Jane Doe 2',
                    role: 'vendedor',
                    agencyId: 'agency-1',
                    active: true,
                    email: 'jane2@test.com'
                })
            })

            expect(result.current.team.length).toBe(initialCount + 1)
            expect(result.current.team[0].id).toBe('custom-id')
        })

        it('should update a team member', () => {
            const { result } = renderHook(() => useAppStore())
            const memberId = result.current.team[0].id!

            act(() => {
                result.current.updateTeamMember(memberId, { name: 'Updated Member' })
            })

            expect(result.current.team.find(t => t.id === memberId)?.name).toBe('Updated Member')
        })

        it('should delete a team member', () => {
            const { result } = renderHook(() => useAppStore())
            const memberId = result.current.team[0].id!
            const initialCount = result.current.team.length

            act(() => {
                result.current.deleteTeamMember(memberId)
            })

            expect(result.current.team.length).toBe(initialCount - 1)
            expect(result.current.team.find(t => t.id === memberId)).toBeUndefined()
        })
    })

    describe('Misc State Actions', () => {
        it('should set active agency', () => {
            const { result } = renderHook(() => useAppStore())

            act(() => {
                result.current.setActiveAgency('agency-x')
            })

            expect(result.current.activeAgencyId).toBe('agency-x')

            act(() => {
                result.current.setActiveAgency(null)
            })

            expect(result.current.activeAgencyId).toBeNull()
        })

        it('should toggle chained funnel without value', () => {
            const { result } = renderHook(() => useAppStore())
            const initialValue = result.current.chainedFunnel

            act(() => {
                result.current.toggleChainedFunnel()
            })

            expect(result.current.chainedFunnel).toBe(!initialValue)
        })

        it('should set chained funnel with specific value', () => {
            const { result } = renderHook(() => useAppStore())

            act(() => {
                result.current.toggleChainedFunnel(true)
            })

            expect(result.current.chainedFunnel).toBe(true)

            act(() => {
                result.current.toggleChainedFunnel(false)
            })

            expect(result.current.chainedFunnel).toBe(false)
        })
    })
})

describe('main store - Hooks', () => {
    beforeEach(() => {
        _test_resetStore()
    })

    describe('useAppStore', () => {
        it('should return full state and actions', () => {
            const { result } = renderHook(() => useAppStore())
            expect(result.current.tasks).toBeDefined()
            expect(result.current.leads).toBeDefined()
            expect(result.current.addTask).toBeTypeOf('function')
            expect(result.current.updateLead).toBeTypeOf('function')
        })
    })

    describe('useUsers', () => {
        it('should return team, agencies, and activeAgencyId', () => {
            const { result } = renderHook(() => useUsers())
            expect(result.current.team).toBeDefined()
            expect(result.current.agencies).toBeDefined()
            expect(result.current.activeAgencyId).toBeDefined()
            expect(result.current).not.toHaveProperty('tasks')
        })
    })

    describe('useFinance', () => {
        it('should return financial data and relevant actions', () => {
            const { result } = renderHook(() => useFinance())
            expect(result.current.commissions).toBeDefined()
            expect(result.current.commissionRules).toBeDefined()
            expect(result.current.goals).toBeDefined()
            expect(result.current.addCommissionRule).toBeTypeOf('function')
            expect(result.current.updateCommissionRule).toBeTypeOf('function')
            expect(result.current.deleteCommissionRule).toBeTypeOf('function')
            expect(result.current.refetch).toBeTypeOf('function')
            expect(result.current).not.toHaveProperty('tasks')
        })
    })
})

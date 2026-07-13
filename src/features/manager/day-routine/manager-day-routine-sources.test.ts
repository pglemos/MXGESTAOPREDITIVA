import { describe, expect, test } from 'bun:test'

describe('manager day routine canonical source adapter', () => {
  test('compõe as fontes MX reais no contrato Base44 sem fabricar execução', async () => {
    const module = await import('./manager-day-routine-sources').catch(() => ({})) as Record<string, unknown>
    const composeManagerRoutineSourceData = module.composeManagerRoutineSourceData

    expect(typeof composeManagerRoutineSourceData).toBe('function')
    if (typeof composeManagerRoutineSourceData !== 'function') return

    const result = composeManagerRoutineSourceData({
      now: new Date('2026-07-13T15:00:00-03:00'),
      referenceDate: '2026-07-13',
      yesterdayDate: '2026-07-12',
      monthlyGoal: 44,
      businessDays: null,
      sellers: [
        { id: 'seller-1', name: 'Ana' },
        { id: 'seller-2', name: 'Bruno' },
      ],
      closings: [
        closing({ id: 'today', seller_user_id: 'seller-1', reference_date: '2026-07-13', submission_status: 'on_time', vnd_cart_prev_day: 2 }),
        closing({ id: 'yesterday', seller_user_id: 'seller-2', reference_date: '2026-07-12', submission_status: 'draft' }),
      ],
      regularizations: [
        { vendedor_id: 'seller-1', data_competencia: '2026-07-13', status_solicitacao: 'Pendente', enviado_para_aprovacao: true },
      ],
      appointments: [{ id: 'appointment-1', status: 'aguardando' }],
      sellerExecutionActions: [
        executionRow({ id: 'plan-1', seller_id: 'seller-1', source_type: 'funil', status: 'concluida', metadata: { requires_customer_update: true, customer_updated: false } }),
        executionRow({ id: 'plan-2', seller_id: 'seller-1', source_type: 'funil', status: 'pendente' }),
      ],
      centralOpenings: [{ seller_user_id: 'seller-1', created_at: '2026-07-13T08:00:00-03:00' }],
      prospectingSchedules: [{ quantidade: 3 }],
      qualificationEvents: [
        { seller_user_id: 'seller-1', tipo_evento: 'cliente_qualificado' },
        { seller_user_id: 'seller-1', tipo_evento: 'cliente_qualificado' },
      ],
      feedbackActions: [{ id: 'feedback-1', status: 'pendente', data_inicio: '2026-07-13' }],
      pdiActions: [{ id: 'pdi-action-1', status: 'pendente', data_conclusao: '2026-07-13' }],
      pdiSessions: [{ id: 'pdi-session-1', status: 'em_andamento', proxima_revisao_data: '2026-07-13' }],
      agendaEvents: [{
        id: 'agenda-1',
        kind: 'reuniao',
        starts_at: '2026-07-13T14:30:00-03:00',
        title: 'Reunião comercial',
        public_summary: 'Com a equipe',
        metadata: { related_seller_id: 'seller-1', related_seller_name: 'Ana' },
        private_payload: {},
      }],
      managerActions: [
        executionRow({ id: 'manual-1', seller_id: 'manager-1', source_type: 'manual', metadata: { manager_daily: true, category: 'equipe' } }),
        executionRow({ id: 'resolved-1', seller_id: 'manager-1', source_type: 'manual', status: 'concluida', metadata: { manager_daily: true, automatic_key: 'automatic-one', manager_result: 'concluida' } }),
      ],
    })

    expect(result.todayClosings).toEqual([
      { sellerId: 'seller-1', date: '2026-07-13', status: 'aguardando_aprovacao', sales: 2 },
    ])
    expect(result.yesterdayClosings).toEqual([
      { sellerId: 'seller-2', date: '2026-07-12', status: 'pendente', sales: 0 },
    ])
    expect(result.todayAppointments).toEqual([{ id: 'appointment-1', status: 'aguardando' }])
    expect(result.todayRoutines).toEqual([
      expect.objectContaining({
        sellerId: 'seller-1',
        firstAccess: true,
        planPlanned: 2,
        planExecuted: 1,
        planPoints: 50,
        prospectingPlanned: 3,
        qualifiedGenerated: 2,
        updatesRequired: 1,
        updatesDone: 0,
      }),
      expect.objectContaining({
        sellerId: 'seller-2',
        firstAccess: false,
        planPlanned: 0,
        prospectingPlanned: 3,
        qualifiedGenerated: 0,
      }),
    ])
    expect(result.feedbacks).toEqual([{ id: 'feedback-1', status: 'pendente', dueDate: '2026-07-13' }])
    expect(result.pdiActions).toEqual([{ id: 'pdi-action-1', status: 'pendente', dueDate: '2026-07-13' }])
    expect(result.pdiMeetings).toEqual([{ id: 'pdi-session-1', status: 'agendada', date: '2026-07-13', time: null }])
    expect(result.agendaItems).toEqual([{
      id: 'agenda-1',
      status: 'agendado',
      type: 'reuniao',
      date: '2026-07-13',
      time: '14:30',
      description: 'Reunião comercial',
      relatedSellerId: 'seller-1',
      relatedSellerName: 'Ana',
    }])
    expect(result.manualTasks).toHaveLength(1)
    expect(result.resolvedAutomaticTaskIds).toEqual(['automatic-one'])
    expect(result.salesToday).toBe(2)
  })
})

function closing(overrides: Record<string, unknown> = {}) {
  return {
    id: 'closing-1',
    seller_user_id: 'seller-1',
    reference_date: '2026-07-13',
    submission_status: 'draft',
    vnd_porta_prev_day: 0,
    vnd_cart_prev_day: 0,
    vnd_net_prev_day: 0,
    ...overrides,
  }
}

function executionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'row-1',
    seller_id: 'seller-1',
    source_type: 'funil',
    title: 'Ação',
    description: null,
    due_at: '2026-07-13T12:00:00-03:00',
    status: 'pendente',
    priority: 'medium',
    created_at: '2026-07-13T08:00:00-03:00',
    completed_at: null,
    justificativa: null,
    metadata: {},
    ...overrides,
  }
}

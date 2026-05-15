import { describe, expect, test } from 'bun:test'
import {
  buildPmrMetricViews,
  buildPmrStrategicPlan,
  derivePmrMetricResults,
  mergeLatestPmrResults,
  PMR_IMPLEMENTATION_SCHEDULE,
  type PmrMetricView,
} from './pmr-engine'

describe('PMR autonomous engine', () => {
  test('derives strategic metrics from monthly close sources', () => {
    const sales = Array.from({ length: 20 }, (_, index) => ({
      sale_date: '2026-04-10',
      seller_name: ['Ana', 'Bruno', 'Caio', 'Duda'][index % 4],
      channel: index < 4 ? 'Porta' : 'Carteira vendedor',
      sale_value: 70000,
      purchase_value: 62000,
      preparation_expenses: 1200,
    }))

    const results = derivePmrMetricResults({
      clientId: 'client-1',
      marketing: [{
        id: 'm1',
        client_id: 'client-1',
        reference_month: '2026-04-01',
        media: 'Internet',
        leads_volume: 600,
        sales_volume: 12,
        investment: 12000,
      }],
      sales,
      inventory: [{
        id: 'i1',
        client_id: 'client-1',
        reference_month: '2026-04-01',
        active_stock: 80,
        total_stock: 80,
        avg_price: 62000,
        avg_km: 54000,
        percent_over_90_days: 0.25,
        source_payload: { total_investment: 4960000, avg_fipe_delta: 1800 },
      }],
      source: 'monthly_close',
    })

    const byMetric = new Map(results.map((result) => [result.metric_key, result.result_value]))

    expect(byMetric.get('leads_received')).toBe(600)
    expect(byMetric.get('internet_cost_per_sale')).toBe(1000)
    expect(byMetric.get('avg_sales_per_seller')).toBe(5)
    expect(byMetric.get('stock_turnover')).toBe(0.25)
    expect(byMetric.get('internet_sales_share')).toBe(0.6)
    expect(byMetric.get('inventory_investment')).toBe(4960000)
  })

  test('derives funnel appointments and visits when financial source has them', () => {
    const results = derivePmrMetricResults({
      clientId: 'client-1',
      financials: [{
        id: 'f1',
        client_id: 'client-1',
        reference_date: '2026-04-01',
        volume_vendas: 10,
        volume_leads: 100,
        volume_agendamentos: 30,
        volume_visitas: 20,
      }],
    })

    const byMetric = new Map(results.map((result) => [result.metric_key, result.result_value]))

    expect(byMetric.get('appointments')).toBe(30)
    expect(byMetric.get('visits')).toBe(20)
    expect(byMetric.get('appointment_to_visit_rate')).toBe(0.6667)
    expect(byMetric.get('visit_to_sale_rate')).toBe(0.5)
  })

  test('manual result wins over automatic result on the same date', () => {
    const derived = derivePmrMetricResults({
      clientId: 'client-1',
      marketing: [{
        id: 'm1',
        client_id: 'client-1',
        reference_month: '2026-04-01',
        media: 'Internet',
        leads_volume: 600,
        sales_volume: 12,
        investment: 12000,
      }],
    })

    const latest = mergeLatestPmrResults([
      {
        id: '00000000-0000-4000-8000-000000000001',
        client_id: 'client-1',
        metric_key: 'leads_received',
        reference_date: '2026-04-01',
        result_value: 650,
        source: 'manual',
        source_payload: {},
      },
    ], derived)

    expect(latest.get('leads_received')?.result_value).toBe(650)
  })

  test('builds planned, realized, achievement and year-over-year metric view rows', () => {
    const rows = buildPmrMetricViews({
      includeEmpty: true,
      catalog: [{
        metric_key: 'sales_total',
        label: 'Volume de vendas',
        area: 'Vendas',
        direction: 'increase',
        value_type: 'number',
        source_scope: 'manual',
        formula_key: null,
        active: true,
        sort_order: 1,
      }],
      latestResults: new Map([[
        'sales_total',
        {
          id: '00000000-0000-4000-8000-000000000010',
          client_id: 'client-1',
          metric_key: 'sales_total',
          reference_date: '2026-04-01',
          result_value: 24,
          source: 'manual',
          source_payload: {},
        },
      ]]),
      targetByMetric: new Map([[
        'sales_total',
        {
          id: '00000000-0000-4000-8000-000000000011',
          client_id: 'client-1',
          metric_key: 'sales_total',
          reference_month: '2026-04-01',
          target_value: 20,
          source: 'manual',
        },
      ]]),
      previousYearByMetric: new Map([[
        'sales_total',
        {
          id: '00000000-0000-4000-8000-000000000012',
          client_id: 'client-1',
          metric_key: 'sales_total',
          reference_date: '2025-04-01',
          result_value: 16,
          source: 'manual',
          source_payload: {},
        },
      ]]),
      parameterByMetric: new Map([[
        'sales_total',
        {
          id: '00000000-0000-4000-8000-000000000013',
          parameter_set_id: 'parameter-set-1',
          metric_key: 'sales_total',
          market_average: 18,
          best_practice: 24,
          target_default: 20,
          red_threshold: null,
          yellow_threshold: 18,
          green_threshold: 20,
          formula: {},
          notes: null,
        },
      ]]),
    })

    expect(rows[0].target_value).toBe(20)
    expect(rows[0].achievement_rate).toBe(1.2)
    expect(rows[0].previous_year_result).toBe(16)
    expect(rows[0].yoy_delta).toBe(0.5)
    expect(rows[0].status).toBe('success')
  })

  test('builds executive plan with actions from metrics and diagnostics', () => {
    const metricRows: PmrMetricView[] = [
      {
        metric_key: 'lead_to_appointment_rate',
        label: 'Conversão de leads em agendamentos',
        area: 'Vendas',
        value_type: 'percent',
        direction: 'increase',
        latest_result: 0.12,
        target_value: 0.3,
        achievement_rate: 0.4,
        previous_year_result: null,
        yoy_delta: null,
        market_average: 0.2,
        best_practice: 0.3,
        status: 'danger',
      },
      {
        metric_key: 'stock_over_90_rate',
        label: 'Tempo de Estoque +90',
        area: 'Estoque',
        value_type: 'percent',
        direction: 'decrease',
        latest_result: 0.36,
        target_value: 0.15,
        achievement_rate: 2.4,
        previous_year_result: null,
        yoy_delta: null,
        market_average: 0.26,
        best_practice: 0.15,
        status: 'danger',
      },
    ]

    const draft = buildPmrStrategicPlan({
      clientName: 'Loja Teste',
      metricRows,
      diagnostics: [{
        id: '00000000-0000-4000-8000-000000000002',
        client_id: 'client-1',
        visit_id: null,
        template_id: 'template-1',
        respondent_name: 'Gestor',
        respondent_role: 'Processos',
        answers: { trade_in_evaluation: 1 },
        summary: 'Avaliação de troca demora e não tem registro formal.',
        submitted_by: null,
        submitted_at: '2026-04-01',
        created_at: '2026-04-01',
        updated_at: '2026-04-01',
        template: {
          id: '00000000-0000-4000-8000-000000000003',
          form_key: 'processo',
          title: 'Processos',
          target_role: 'Processos',
          visit_number: 1,
          fields: [{ key: 'trade_in_evaluation', label: 'Avaliação de usado na troca', type: 'scale' }],
          active: true,
          created_at: '2026-04-01',
          updated_at: '2026-04-01',
        },
      }],
    })

    expect(draft.diagnosisSummary).toContain('Loja Teste')
    expect(draft.criticalGaps).toHaveLength(2)
    expect(draft.actions.some((action) => action.action.includes('SLA'))).toBe(true)
    expect(draft.actions.some((action) => action.action.includes('usado na troca'))).toBe(true)
    expect(draft.actions.every((action) => !action.visit_number || action.visit_number <= 7)).toBe(true)
    expect(draft.markdown).toContain('Cronograma de Implementação')
  })

  test('keeps the PMR implementation schedule canonical from visit 1 to 7', () => {
    expect(PMR_IMPLEMENTATION_SCHEDULE).toHaveLength(7)
    expect(PMR_IMPLEMENTATION_SCHEDULE.map((step) => step.visit)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(PMR_IMPLEMENTATION_SCHEDULE[4].objective).toContain('Plano de Desenvolvimento Individual')
    expect(PMR_IMPLEMENTATION_SCHEDULE[5].objective).toContain('Marketing')
    expect(PMR_IMPLEMENTATION_SCHEDULE[6].objective).toContain('Plano de Ação Trimestral')

    const draft = buildPmrStrategicPlan({
      clientName: 'Loja Teste',
      metricRows: [],
    })

    expect(draft.markdown).not.toContain('Visita 8')
    expect(draft.markdown).not.toContain('Visita 9')
    expect(draft.payload.implementation_schedule).toEqual(PMR_IMPLEMENTATION_SCHEDULE)
  })

  test('uses manual SWOT overrides in the final markdown and payload', () => {
    const draft = buildPmrStrategicPlan({
      clientName: 'Loja Teste',
      metricRows: [],
      swotOverride: {
        strengths: ['Equipe experiente'],
        weaknesses: ['Sem reunião semanal'],
        opportunities: ['Explorar carteira do vendedor'],
        threats: ['Estoque envelhecido'],
      },
    })

    expect(draft.swot.strengths).toEqual(['Equipe experiente'])
    expect(draft.markdown).toContain('Equipe experiente')
    expect(draft.markdown).toContain('Sem reunião semanal')
  })
})

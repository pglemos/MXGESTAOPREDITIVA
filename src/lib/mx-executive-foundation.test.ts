import { describe, expect, test } from 'bun:test'
import {
  DEFAULT_MX_DEPARTMENTS,
  buildPlanningPeriod,
  assertBenchmarkMutationAllowed,
  buildActionFromAlert,
  buildAnonymousAlertFixtures,
  buildScoreHistorySnapshot,
  canReadMxDepartment,
  canReadExecutiveScopedResource,
  canAuthorScoreObservation,
  canWriteMxDepartment,
  canWritePlanningIndicator,
  classifyMxScore,
  deriveActionPlanStatus,
  evaluateConsultiveRule,
  getActionPlanChangedFields,
  getBenchmarkDisplayState,
  getBenchmarkVersionKey,
  getExecutiveAgendaConnectionGuidance,
  getLatestScoreCalculation,
  getPlanningIndicatorStatus,
  sanitizeExecutiveAgendaEvent,
  assertScoreMutationAllowed,
  validateScoreCalculation,
  type ConsultiveRule,
  type ExecutiveAgendaEvent,
  type ScoreCalculation,
} from './mx-executive-foundation'

describe('mx executive foundation helpers', () => {
  test('normalizes annual and monthly planning periods', () => {
    expect(buildPlanningPeriod(2026)).toEqual({ type: 'annual', year: 2026, month: null, key: '2026' })
    expect(buildPlanningPeriod(2026, 5)).toEqual({ type: 'monthly', year: 2026, month: 5, key: '2026-05' })

    expect(() => buildPlanningPeriod(2019)).toThrow(RangeError)
    expect(() => buildPlanningPeriod(2026, 13)).toThrow(RangeError)
  })

  test('marks planning indicators as complete, partial or pending without inventing values', () => {
    expect(getPlanningIndicatorStatus({ meta: 100, realizado: 92, anoAnterior: 80 })).toMatchObject({
      status: 'completo',
      missing: [],
    })

    expect(getPlanningIndicatorStatus({ meta: 100, realizado: null, anoAnterior: 80 })).toMatchObject({
      status: 'parcial',
      missing: ['realizado'],
    })

    expect(getPlanningIndicatorStatus({})).toEqual({
      meta: null,
      realizado: null,
      anoAnterior: null,
      status: 'pendente',
      missing: ['meta', 'realizado', 'anoAnterior'],
    })
  })

  test('keeps the six standard departments and profile-scoped access rules', () => {
    expect(DEFAULT_MX_DEPARTMENTS.map((department) => department.code)).toEqual([
      'comercial',
      'marketing',
      'produto',
      'financeiro',
      'rh',
      'operacional',
    ])

    expect(canReadMxDepartment({ role: 'finance', departmentCode: 'financeiro', hasStoreScope: true })).toBe(true)
    expect(canReadMxDepartment({ role: 'finance', departmentCode: 'rh', hasStoreScope: true })).toBe(false)
    expect(canReadMxDepartment({ role: 'vendedor', departmentCode: 'comercial', hasStoreScope: true, isResponsible: true })).toBe(true)
    expect(canReadMxDepartment({ role: 'master', departmentCode: 'comercial', hasStoreScope: false })).toBe(false)
  })

  test('keeps writes scoped to authorized profiles and store scope', () => {
    expect(canWriteMxDepartment({ role: 'sales_manager', hasStoreScope: true })).toBe(true)
    expect(canWriteMxDepartment({ role: 'finance', hasStoreScope: true })).toBe(false)
    expect(canWriteMxDepartment({ role: 'admin_mx', hasStoreScope: false })).toBe(false)

    expect(canWritePlanningIndicator({ role: 'finance', hasStoreScope: true })).toBe(true)
    expect(canWritePlanningIndicator({ role: 'hr', hasStoreScope: true })).toBe(false)
    expect(canWritePlanningIndicator({ role: 'admin_mx', hasStoreScope: false })).toBe(false)
  })

  test('evaluates consultive rules deterministically and preserves traceability', () => {
    const stockRule: ConsultiveRule = {
      ruleCode: 'stock_over_90_days',
      sourceIndicator: 'inventory_aging_days',
      condition: { operator: 'gt', value: 90 },
      severity: 'critico',
      message: 'Estoque acima de 90 dias exige decisao executiva.',
      recommendation: 'Revisar preco, margem, campanha e plano de giro por veiculo.',
      suggestedAction: 'Criar plano de acao para reduzir estoque parado acima de 90 dias.',
      departmentCode: 'produto',
      affectsScore: false,
      explanationTemplate: 'Regra aplicada porque aging_days ultrapassou 90 dias; recomendacao nao altera o MX Score.',
    }

    const fact = {
      sourceIndicator: 'inventory_aging_days',
      value: 112,
      sourceRef: { kind: 'inventory_snapshot', rowId: 'inventory-1' },
    }

    const first = evaluateConsultiveRule(stockRule, fact)
    const second = evaluateConsultiveRule(stockRule, fact)

    expect(first).toEqual(second)
    expect(first).toMatchObject({
      applied: true,
      ruleCode: 'stock_over_90_days',
      sourceIndicator: 'inventory_aging_days',
      severity: 'critico',
      affectsScore: false,
      sourceRef: { kind: 'inventory_snapshot', rowId: 'inventory-1' },
    })
  })

  test('supports benchmark and band rules without mutating score', () => {
    const benchmarkRule: ConsultiveRule = {
      ruleCode: 'lead_to_schedule_below_benchmark',
      sourceIndicator: 'lead_to_schedule_rate',
      condition: { operator: 'lt_benchmark' },
      severity: 'critico',
      message: 'Conversao abaixo do benchmark.',
      recommendation: 'Auditar tempo de resposta.',
      suggestedAction: 'Criar devolutiva comercial.',
      affectsScore: false,
    }

    const scoreRule: ConsultiveRule = {
      ruleCode: 'mx_score_attention_band',
      sourceIndicator: 'mx_score',
      condition: { operator: 'in', values: ['attention', 'critical'] },
      severity: 'atencao',
      message: 'MX Score em atencao.',
      recommendation: 'Priorizar plano de acao.',
      suggestedAction: 'Abrir analise do score.',
      affectsScore: false,
    }

    expect(evaluateConsultiveRule(benchmarkRule, {
      sourceIndicator: 'lead_to_schedule_rate',
      value: 18,
      benchmark: 25,
      sourceRef: { kind: 'benchmark' },
    }).applied).toBe(true)

    expect(evaluateConsultiveRule(scoreRule, {
      sourceIndicator: 'mx_score',
      value: 'critical',
      sourceRef: { kind: 'score_snapshot' },
    })).toMatchObject({ applied: true, affectsScore: false })
  })

  test('keeps executive agenda events linked to store and optional execution artifacts', () => {
    const event: ExecutiveAgendaEvent = {
      kind: 'acompanhamento',
      title: 'Acompanhar plano de estoque',
      source: 'manual',
      integrationStatus: 'desconectado',
      startsAt: '2026-05-27T13:00:00.000Z',
      links: {
        lojaId: 'store-1',
        responsavelId: 'user-1',
        planoAcaoId: 'plan-1',
        visitaId: 'visit-1',
        alertId: 'alert-1',
      },
    }

    expect(event.links).toEqual({
      lojaId: 'store-1',
      responsavelId: 'user-1',
      planoAcaoId: 'plan-1',
      visitaId: 'visit-1',
      alertId: 'alert-1',
    })
  })

  test('documents manual, Google Calendar and Outlook integration states without blocking manual use', () => {
    expect(getExecutiveAgendaConnectionGuidance('conectado')).toBeNull()
    expect(getExecutiveAgendaConnectionGuidance('pendente')).toContain('manual continua disponivel')
    expect(getExecutiveAgendaConnectionGuidance('erro')).toContain('sem bloquear a agenda manual')
    expect(getExecutiveAgendaConnectionGuidance('desconectado')).toContain('Google Calendar/Outlook')
  })

  test('redacts imported private calendar details unless the viewer can see them', () => {
    const importedEvent: ExecutiveAgendaEvent = {
      kind: 'reuniao',
      title: 'Reuniao privada com conselho',
      publicSummary: null,
      source: 'google_calendar',
      integrationStatus: 'conectado',
      integrationError: 'raw provider detail',
      startsAt: '2026-05-27T14:00:00.000Z',
      links: { lojaId: 'store-1', responsavelId: 'owner-1' },
      privatePayload: { attendeeEmails: ['private@example.com'], description: 'sensitive notes' },
    }

    expect(sanitizeExecutiveAgendaEvent(importedEvent, { canViewPrivateDetails: false })).toMatchObject({
      title: 'Evento de agenda executiva',
      publicSummary: 'Detalhes privados preservados conforme politica de calendario.',
      integrationError: null,
      detailsRedacted: true,
    })

    expect(sanitizeExecutiveAgendaEvent(importedEvent, { canViewPrivateDetails: true })).toMatchObject({
      title: 'Reuniao privada com conselho',
      publicSummary: null,
      integrationError: 'raw provider detail',
      detailsRedacted: false,
    })
  })

  test('builds anonymous alert fixtures with mandatory PRD structure and channels', () => {
    const fixtures = buildAnonymousAlertFixtures()

    expect(fixtures.length).toBeGreaterThan(0)
    expect(fixtures.every((alert) => alert.metadata?.anonymized === true)).toBe(true)
    expect(fixtures.every((alert) => alert.problem.trim() && alert.impact.trim() && alert.recommendation.trim() && alert.quickActionLabel.trim())).toBe(true)
    expect(fixtures[0].channels).toEqual(['system', 'push', 'whatsapp'])
  })

  test('keeps scoped alert reads constrained by loja/responsible/internal access', () => {
    expect(canReadExecutiveScopedResource({ scopeType: 'store', hasStoreScope: true })).toBe(true)
    expect(canReadExecutiveScopedResource({ scopeType: 'store', hasStoreScope: false })).toBe(false)
    expect(canReadExecutiveScopedResource({ scopeType: 'individual', hasStoreScope: false, isResponsible: true })).toBe(true)
    expect(canReadExecutiveScopedResource({ scopeType: 'department', hasStoreScope: false, isInternalMx: true })).toBe(true)
  })

  test('derives action plan delay and critical history fields outside the UI', () => {
    expect(deriveActionPlanStatus({ status: 'pendente', prioridade: 'media', prazo: '2026-05-01' }, '2026-05-27')).toBe('atrasado')
    expect(deriveActionPlanStatus({ status: 'concluido', prioridade: 'media', prazo: '2026-05-01' }, '2026-05-27')).toBe('concluido')

    expect(getActionPlanChangedFields(
      { status: 'pendente', prioridade: 'media', prazo: '2026-05-30', responsavelId: 'u1', eficaciaScore: null },
      { status: 'em_andamento', prioridade: 'alta', prazo: '2026-06-01', responsavelId: 'u2', eficaciaScore: 80 },
    )).toEqual(['status', 'prioridade', 'prazo', 'responsavel_id', 'eficacia'])
  })

  test('creates action plan defaults from alerts with traceable origin', () => {
    const alert = buildAnonymousAlertFixtures()[0]
    const action = buildActionFromAlert(alert, 'owner-1')

    expect(action).toMatchObject({
      origem: 'alertas',
      origemRefTable: 'alerts',
      problem: alert.problem,
      action: alert.quickActionLabel,
      prioridade: 'critica',
      responsavelId: 'owner-1',
    })
  })

  test('keeps benchmarking versioned, pending-aware and immutable', () => {
    const snapshot = {
      lojaId: 'store-1',
      metricCode: 'gross_margin',
      period: '2026-05-01',
      lojaValue: 18,
      peerGroup: 'regiao' as const,
      peerCount: 12,
      peerAvg: 21,
      computationVersion: 'v1',
    }

    expect(getBenchmarkDisplayState(snapshot)).toEqual({ status: 'available', message: null })
    expect(getBenchmarkDisplayState(null)).toMatchObject({ status: 'pending' })
    expect(getBenchmarkVersionKey(snapshot)).toBe('store-1:gross_margin:2026-05-01:regiao:v1')
    expect(() => assertBenchmarkMutationAllowed()).toThrow('imutaveis')
  })

  test('classifies and validates MX Score calculations by canonical bands', () => {
    expect(classifyMxScore(95)).toBe('elite')
    expect(classifyMxScore(85)).toBe('excellent')
    expect(classifyMxScore(75)).toBe('good')
    expect(classifyMxScore(65)).toBe('attention')
    expect(classifyMxScore(59)).toBe('critical')
    expect(classifyMxScore(null)).toBe('critical')

    const calculation: ScoreCalculation = {
      id: 'score-1',
      scopeType: 'store',
      scopeId: 'store-1',
      period: '2026-05-01',
      value: 84,
      band: 'excellent',
      dimResultado: 82,
      dimProcesso: 85,
      dimDisciplina: 88,
      calculationVersion: 'score-rules-2026.05',
      computedAt: '2026-05-27T12:00:00.000Z',
    }

    expect(validateScoreCalculation(calculation)).toEqual([])
    expect(validateScoreCalculation({ ...calculation, value: 101 })).toContain('value')
    expect(validateScoreCalculation({ ...calculation, band: 'critical' })).toContain('band')
    expect(validateScoreCalculation({ ...calculation, dimProcesso: -1 })).toContain('dimProcesso')
  })

  test('keeps score history snapshots immutable and observations comment-only', () => {
    const calculation: ScoreCalculation = {
      id: 'score-1',
      scopeType: 'individual',
      scopeId: 'seller-1',
      period: '2026-05-01',
      value: 72,
      band: 'good',
      calculationVersion: 'score-rules-2026.05',
      computedAt: '2026-05-27T12:00:00.000Z',
    }

    const snapshot = buildScoreHistorySnapshot(calculation, '2026-05-27T12:00:01.000Z')

    expect(snapshot).toEqual({
      calculationId: 'score-1',
      snapshotPayload: calculation,
      archivedAt: '2026-05-27T12:00:01.000Z',
    })
    expect(snapshot.snapshotPayload).not.toBe(calculation)
    expect(canAuthorScoreObservation('consultant')).toBe(true)
    expect(canAuthorScoreObservation('master')).toBe(true)
    expect(canAuthorScoreObservation('vendedor')).toBe(false)
    expect(() => assertScoreMutationAllowed()).toThrow('imutaveis')
  })

  test('returns the latest score calculation for scope and period without updating prior rows', () => {
    const calculations: ScoreCalculation[] = [
      {
        id: 'old',
        scopeType: 'store',
        scopeId: 'store-1',
        period: '2026-04-01',
        value: 70,
        band: 'good',
        calculationVersion: 'v1',
        computedAt: '2026-04-30T12:00:00.000Z',
      },
      {
        id: 'latest',
        scopeType: 'store',
        scopeId: 'store-1',
        period: '2026-05-01',
        value: 82,
        band: 'excellent',
        calculationVersion: 'v1',
        computedAt: '2026-05-27T12:00:00.000Z',
      },
      {
        id: 'future',
        scopeType: 'store',
        scopeId: 'store-1',
        period: '2026-06-01',
        value: 90,
        band: 'elite',
        calculationVersion: 'v1',
        computedAt: '2026-06-30T12:00:00.000Z',
      },
    ]

    expect(getLatestScoreCalculation(calculations, {
      scopeType: 'store',
      scopeId: 'store-1',
      period: '2026-05-27',
    })?.id).toBe('latest')

    expect(getLatestScoreCalculation(calculations, {
      scopeType: 'department',
      scopeId: 'store-1',
      period: '2026-05-27',
    })).toBeNull()
  })
})

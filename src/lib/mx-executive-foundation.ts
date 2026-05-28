export type MxDepartmentCode =
  | 'comercial'
  | 'marketing'
  | 'produto'
  | 'financeiro'
  | 'rh'
  | 'operacional'

export type MxExecutiveRoleCode =
  | 'master'
  | 'director'
  | 'sales_manager'
  | 'consultant'
  | 'admin_mx'
  | 'marketing'
  | 'product'
  | 'finance'
  | 'hr'
  | 'operations'
  | 'vendedor'

export type PlanningPeriod =
  | { type: 'annual'; year: number; month: null; key: string }
  | { type: 'monthly'; year: number; month: number; key: string }

export interface PlanningIndicatorValues {
  meta?: number | null
  realizado?: number | null
  anoAnterior?: number | null
}

export interface PlanningIndicatorStatus extends PlanningIndicatorValues {
  status: 'completo' | 'parcial' | 'pendente'
  missing: Array<keyof PlanningIndicatorValues>
}

export type ConsultiveRuleSeverity = 'info' | 'positivo' | 'atencao' | 'critico'

export type ExecutiveAgendaKind = 'compromisso' | 'reuniao' | 'lembrete' | 'acompanhamento'
export type ExecutiveAgendaSource = 'manual' | 'google_calendar' | 'outlook'
export type ExecutiveAgendaIntegrationStatus = 'conectado' | 'pendente' | 'erro' | 'desconectado'

export interface ExecutiveAgendaLinks {
  lojaId: string
  responsavelId?: string | null
  planoAcaoId?: string | null
  visitaId?: string | null
  alertId?: string | null
}

export interface ExecutiveAgendaEvent {
  kind: ExecutiveAgendaKind
  title: string
  publicSummary?: string | null
  source: ExecutiveAgendaSource
  integrationStatus: ExecutiveAgendaIntegrationStatus
  integrationError?: string | null
  startsAt: string
  endsAt?: string | null
  links: ExecutiveAgendaLinks
  privatePayload?: Record<string, unknown>
}

export interface ExecutiveAgendaDisplayEvent {
  kind: ExecutiveAgendaKind
  title: string
  publicSummary: string | null
  source: ExecutiveAgendaSource
  integrationStatus: ExecutiveAgendaIntegrationStatus
  integrationError: string | null
  startsAt: string
  endsAt: string | null
  links: ExecutiveAgendaLinks
  detailsRedacted: boolean
}

export type ExecutiveAlertType = 'critical' | 'warning' | 'positive' | 'consultive'
export type ExecutiveAlertStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed'
export type ExecutiveAlertChannel = 'system' | 'push' | 'whatsapp'

export interface ExecutiveAlert {
  scopeType: 'store' | 'department' | 'individual' | 'process'
  scopeId: string
  type: ExecutiveAlertType
  problem: string
  impact: string
  recommendation: string
  quickActionLabel: string
  status: ExecutiveAlertStatus
  channels: ExecutiveAlertChannel[]
  ruleVersion: string
  metadata?: Record<string, unknown>
}

export type ActionPlanOrigin = 'alertas' | 'score' | 'consultor' | 'manual'
export type ActionPlanStatus = 'pendente' | 'em_andamento' | 'atrasado' | 'concluido' | 'validando_eficacia'
export type ActionPlanPriority = 'baixa' | 'media' | 'alta' | 'critica'

export interface ActionPlanState {
  status: ActionPlanStatus
  prioridade: ActionPlanPriority
  prazo?: string | null
  responsavelId?: string | null
  eficaciaScore?: number | null
  eficaciaNota?: string | null
}

export type BenchmarkPeerGroup = 'regiao' | 'porte' | 'segmento' | 'melhores' | 'mercado'

export interface BenchmarkSnapshot {
  lojaId: string
  metricCode: string
  period: string
  lojaValue: number
  peerGroup: BenchmarkPeerGroup
  peerCount: number
  peerAvg?: number | null
  peerMedian?: number | null
  peerTop?: number | null
  lojaRank?: number | null
  lojaPercentile?: number | null
  computationVersion: string
}

export interface BenchmarkDisplayState {
  status: 'available' | 'pending'
  message: string | null
}

export type ScoreScopeType = 'store' | 'department' | 'individual' | 'process'
export type ScoreDimension = 'resultado' | 'processo' | 'disciplina'
export type ScoreBand = 'elite' | 'excellent' | 'good' | 'attention' | 'critical'

export interface ScoreCalculation {
  id: string
  scopeType: ScoreScopeType
  scopeId: string
  period: string
  value: number
  band: ScoreBand
  dimResultado?: number | null
  dimProcesso?: number | null
  dimDisciplina?: number | null
  calculationVersion: string
  computedAt: string
}

export interface ScoreHistorySnapshot {
  calculationId: string
  snapshotPayload: ScoreCalculation
  archivedAt: string
}

export type ConsultiveCondition =
  | { operator: 'gt' | 'lt'; value: number }
  | { operator: 'lt_benchmark'; benchmark?: number }
  | { operator: 'in'; values: string[] }

export interface ConsultiveRule {
  ruleCode: string
  sourceIndicator: string
  condition: ConsultiveCondition
  severity: ConsultiveRuleSeverity
  message: string
  recommendation: string
  suggestedAction: string
  departmentCode?: MxDepartmentCode | null
  affectsScore: false
  explanationTemplate?: string | null
}

export interface ConsultiveFact {
  sourceIndicator: string
  value: number | string
  benchmark?: number | null
  sourceRef: Record<string, unknown>
}

export interface ConsultiveRuleEvaluation {
  applied: boolean
  ruleCode: string
  sourceIndicator: string
  severity: ConsultiveRuleSeverity
  sourceRef: Record<string, unknown>
  affectsScore: false
  explanation: string
}

export const DEFAULT_MX_DEPARTMENTS: Array<{
  code: MxDepartmentCode
  name: string
  authorizedRoleCodes: MxExecutiveRoleCode[]
}> = [
  { code: 'comercial', name: 'Comercial', authorizedRoleCodes: ['master', 'director', 'sales_manager', 'consultant', 'admin_mx'] },
  { code: 'marketing', name: 'Marketing', authorizedRoleCodes: ['master', 'director', 'marketing', 'consultant', 'admin_mx'] },
  { code: 'produto', name: 'Produto', authorizedRoleCodes: ['master', 'director', 'product', 'consultant', 'admin_mx'] },
  { code: 'financeiro', name: 'Financeiro', authorizedRoleCodes: ['master', 'director', 'finance', 'consultant', 'admin_mx'] },
  { code: 'rh', name: 'RH', authorizedRoleCodes: ['master', 'director', 'hr', 'consultant', 'admin_mx'] },
  { code: 'operacional', name: 'Operacional', authorizedRoleCodes: ['master', 'director', 'operations', 'sales_manager', 'consultant', 'admin_mx'] },
]

const DEPARTMENT_WRITE_ROLES = new Set<MxExecutiveRoleCode>([
  'master',
  'director',
  'sales_manager',
  'consultant',
  'admin_mx',
])

const PLANNING_WRITE_ROLES = new Set<MxExecutiveRoleCode>([
  'master',
  'director',
  'finance',
  'sales_manager',
  'consultant',
  'admin_mx',
])

export function buildPlanningPeriod(year: number, month?: number | null): PlanningPeriod {
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    throw new RangeError('Planning year must be an integer between 2020 and 2100.')
  }

  if (month == null) {
    return { type: 'annual', year, month: null, key: `${year}` }
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError('Planning month must be an integer between 1 and 12.')
  }

  return { type: 'monthly', year, month, key: `${year}-${String(month).padStart(2, '0')}` }
}

export function getPlanningIndicatorStatus(values: PlanningIndicatorValues): PlanningIndicatorStatus {
  const missing = (['meta', 'realizado', 'anoAnterior'] as Array<keyof PlanningIndicatorValues>)
    .filter((key) => values[key] == null)

  const status = missing.length === 0
    ? 'completo'
    : missing.length === 3
      ? 'pendente'
      : 'parcial'

  return {
    meta: values.meta ?? null,
    realizado: values.realizado ?? null,
    anoAnterior: values.anoAnterior ?? null,
    status,
    missing,
  }
}

export function canReadMxDepartment(params: {
  role: MxExecutiveRoleCode
  departmentCode: MxDepartmentCode
  hasStoreScope: boolean
  isResponsible?: boolean
}): boolean {
  if (params.isResponsible) return true
  if (!params.hasStoreScope) return false

  const department = DEFAULT_MX_DEPARTMENTS.find((item) => item.code === params.departmentCode)
  return Boolean(department?.authorizedRoleCodes.includes(params.role))
}

export function canWriteMxDepartment(params: {
  role: MxExecutiveRoleCode
  hasStoreScope: boolean
}): boolean {
  return params.hasStoreScope && DEPARTMENT_WRITE_ROLES.has(params.role)
}

export function canWritePlanningIndicator(params: {
  role: MxExecutiveRoleCode
  hasStoreScope: boolean
}): boolean {
  return params.hasStoreScope && PLANNING_WRITE_ROLES.has(params.role)
}

export function getExecutiveAgendaConnectionGuidance(status: ExecutiveAgendaIntegrationStatus): string | null {
  switch (status) {
    case 'conectado':
      return null
    case 'pendente':
      return 'Conexao de calendario pendente. O evento manual continua disponivel.'
    case 'erro':
      return 'Falha na integracao de calendario. Revise a conexao sem bloquear a agenda manual.'
    case 'desconectado':
      return 'Calendario externo desconectado. Use agenda manual ou conecte Google Calendar/Outlook.'
  }
}

export function canReadExecutiveAgendaEvent(params: {
  role: MxExecutiveRoleCode
  hasStoreScope: boolean
  isResponsible?: boolean
  isCreator?: boolean
}): boolean {
  return params.hasStoreScope || Boolean(params.isResponsible) || Boolean(params.isCreator)
}

export function canWriteExecutiveAgendaEvent(params: {
  role: MxExecutiveRoleCode
  hasStoreScope: boolean
  isResponsible?: boolean
}): boolean {
  return (params.hasStoreScope && DEPARTMENT_WRITE_ROLES.has(params.role)) || Boolean(params.isResponsible)
}

export function sanitizeExecutiveAgendaEvent(
  event: ExecutiveAgendaEvent,
  options: { canViewPrivateDetails: boolean },
): ExecutiveAgendaDisplayEvent {
  const publicSummary = event.publicSummary ?? null
  const hasPrivatePayload = Boolean(event.privatePayload && Object.keys(event.privatePayload).length > 0)

  return {
    kind: event.kind,
    title: options.canViewPrivateDetails ? event.title : redactImportedTitle(event.title, event.source),
    publicSummary: options.canViewPrivateDetails ? publicSummary : publicSummary ?? getPublicFallback(event.source),
    source: event.source,
    integrationStatus: event.integrationStatus,
    integrationError: options.canViewPrivateDetails ? event.integrationError ?? null : null,
    startsAt: event.startsAt,
    endsAt: event.endsAt ?? null,
    links: event.links,
    detailsRedacted: !options.canViewPrivateDetails && hasPrivatePayload,
  }
}

export function buildAnonymousAlertFixtures(): ExecutiveAlert[] {
  return [
    {
      scopeType: 'store',
      scopeId: 'fixture-store',
      type: 'critical',
      problem: 'Conversao abaixo do minimo operacional.',
      impact: 'Risco de perda de vendas no periodo.',
      recommendation: 'Revisar rotina de primeiro contato e confirmacao.',
      quickActionLabel: 'Abrir plano de acao',
      status: 'open',
      channels: ['system', 'push', 'whatsapp'],
      ruleVersion: 'fixture-v1',
      metadata: { anonymized: true },
    },
    {
      scopeType: 'store',
      scopeId: 'fixture-store',
      type: 'consultive',
      problem: 'Estoque parado acima do esperado.',
      impact: 'Capital imobilizado e margem pressionada.',
      recommendation: 'Priorizar plano de giro por faixa de aging.',
      quickActionLabel: 'Ver recomendacao',
      status: 'acknowledged',
      channels: ['system'],
      ruleVersion: 'fixture-v1',
      metadata: { anonymized: true },
    },
  ]
}

export function validateExecutiveAlert(alert: ExecutiveAlert): string[] {
  const errors: string[] = []

  for (const key of ['problem', 'impact', 'recommendation', 'quickActionLabel', 'ruleVersion'] as const) {
    if (alert[key].trim().length === 0) {
      errors.push(key)
    }
  }

  if (alert.channels.length === 0) {
    errors.push('channels')
  }

  return errors
}

export function canReadExecutiveScopedResource(params: {
  scopeType: ExecutiveAlert['scopeType']
  hasStoreScope: boolean
  isResponsible?: boolean
  isInternalMx?: boolean
}): boolean {
  if (params.isInternalMx) return true
  if (params.scopeType === 'individual') return Boolean(params.isResponsible) || params.hasStoreScope
  if (params.scopeType === 'store') return params.hasStoreScope
  return params.hasStoreScope
}

export function deriveActionPlanStatus(state: ActionPlanState, todayIso: string): ActionPlanStatus {
  if (state.status === 'concluido' || state.status === 'validando_eficacia') {
    return state.status
  }

  if (state.prazo && state.prazo < todayIso) {
    return 'atrasado'
  }

  return state.status
}

export function getActionPlanChangedFields(before: ActionPlanState, after: ActionPlanState): string[] {
  const changed: string[] = []

  if (before.status !== after.status) changed.push('status')
  if (before.prioridade !== after.prioridade) changed.push('prioridade')
  if ((before.prazo ?? null) !== (after.prazo ?? null)) changed.push('prazo')
  if ((before.responsavelId ?? null) !== (after.responsavelId ?? null)) changed.push('responsavel_id')
  if ((before.eficaciaScore ?? null) !== (after.eficaciaScore ?? null) || (before.eficaciaNota ?? null) !== (after.eficaciaNota ?? null)) {
    changed.push('eficacia')
  }

  return changed
}

export function buildActionFromAlert(alert: ExecutiveAlert, responsavelId?: string | null): ActionPlanState & {
  origem: ActionPlanOrigin
  origemRefTable: 'alerts'
  problem: string
  action: string
} {
  return {
    origem: 'alertas',
    origemRefTable: 'alerts',
    problem: alert.problem,
    action: alert.quickActionLabel,
    status: 'pendente',
    prioridade: alert.type === 'critical' ? 'critica' : alert.type === 'warning' ? 'alta' : 'media',
    responsavelId: responsavelId ?? null,
  }
}

export function getBenchmarkDisplayState(snapshot: BenchmarkSnapshot | null | undefined): BenchmarkDisplayState {
  if (!snapshot || snapshot.peerCount === 0) {
    return {
      status: 'pending',
      message: 'Benchmark pendente: massa comparativa insuficiente para o periodo.',
    }
  }

  return { status: 'available', message: null }
}

export function getBenchmarkVersionKey(snapshot: Pick<BenchmarkSnapshot, 'lojaId' | 'metricCode' | 'period' | 'peerGroup' | 'computationVersion'>): string {
  return [
    snapshot.lojaId,
    snapshot.metricCode,
    snapshot.period,
    snapshot.peerGroup,
    snapshot.computationVersion,
  ].join(':')
}

export function assertBenchmarkMutationAllowed(): never {
  throw new Error('benchmark_snapshots imutaveis. Use INSERT de nova versao para recalcular.')
}

export function classifyMxScore(value: number | null | undefined): ScoreBand {
  if (value == null || Number.isNaN(value)) return 'critical'
  if (value >= 90) return 'elite'
  if (value >= 80) return 'excellent'
  if (value >= 70) return 'good'
  if (value >= 60) return 'attention'
  return 'critical'
}

export function validateScoreCalculation(calculation: ScoreCalculation): string[] {
  const errors: string[] = []

  if (calculation.value < 0 || calculation.value > 100) errors.push('value')
  if (calculation.band !== classifyMxScore(calculation.value)) errors.push('band')
  for (const [key, value] of [
    ['dimResultado', calculation.dimResultado],
    ['dimProcesso', calculation.dimProcesso],
    ['dimDisciplina', calculation.dimDisciplina],
  ] as const) {
    if (value != null && (value < 0 || value > 100)) errors.push(key)
  }
  if (calculation.calculationVersion.trim().length === 0) errors.push('calculationVersion')

  return errors
}

export function buildScoreHistorySnapshot(calculation: ScoreCalculation, archivedAt: string): ScoreHistorySnapshot {
  return {
    calculationId: calculation.id,
    snapshotPayload: { ...calculation },
    archivedAt,
  }
}

export function canAuthorScoreObservation(role: MxExecutiveRoleCode): boolean {
  return role === 'consultant' || role === 'master'
}

export function getLatestScoreCalculation(
  calculations: ScoreCalculation[],
  params: { scopeType: ScoreScopeType; scopeId: string; period: string },
): ScoreCalculation | null {
  const matching = calculations
    .filter((calculation) => (
      calculation.scopeType === params.scopeType
      && calculation.scopeId === params.scopeId
      && calculation.period <= params.period
    ))
    .sort((a, b) => {
      if (a.period !== b.period) return b.period.localeCompare(a.period)
      return b.computedAt.localeCompare(a.computedAt)
    })

  return matching[0] ?? null
}

export function assertScoreMutationAllowed(): never {
  throw new Error('score_calculations e score_history sao imutaveis. Use INSERT de novo calculo.')
}

export function evaluateConsultiveRule(rule: ConsultiveRule, fact: ConsultiveFact): ConsultiveRuleEvaluation {
  const applied = rule.sourceIndicator === fact.sourceIndicator && evaluateCondition(rule.condition, fact)

  return {
    applied,
    ruleCode: rule.ruleCode,
    sourceIndicator: rule.sourceIndicator,
    severity: rule.severity,
    sourceRef: fact.sourceRef,
    affectsScore: false,
    explanation: buildRuleExplanation(rule, fact),
  }
}

function evaluateCondition(condition: ConsultiveCondition, fact: ConsultiveFact): boolean {
  switch (condition.operator) {
    case 'in':
      return condition.values.includes(String(fact.value))
    case 'gt':
      return typeof fact.value === 'number' && fact.value > condition.value
    case 'lt':
      return typeof fact.value === 'number' && fact.value < condition.value
    case 'lt_benchmark': {
      const benchmark = condition.benchmark ?? fact.benchmark
      return typeof fact.value === 'number' && typeof benchmark === 'number' && fact.value < benchmark
    }
  }
}

function buildRuleExplanation(rule: ConsultiveRule, fact: ConsultiveFact): string {
  if (rule.explanationTemplate && rule.explanationTemplate.trim().length > 0) {
    return rule.explanationTemplate
  }

  return `Rule ${rule.ruleCode} evaluated ${rule.sourceIndicator} from source ${String(fact.sourceRef.kind ?? 'unknown')}.`
}

function redactImportedTitle(title: string, source: ExecutiveAgendaSource): string {
  if (source === 'manual') return title
  return 'Evento de agenda executiva'
}

function getPublicFallback(source: ExecutiveAgendaSource): string | null {
  if (source === 'manual') return null
  return 'Detalhes privados preservados conforme politica de calendario.'
}

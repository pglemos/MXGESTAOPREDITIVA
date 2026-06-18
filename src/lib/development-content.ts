export type DevelopmentTheme =
  | 'prospeccao'
  | 'agendamento'
  | 'atendimento'
  | 'apresentacao'
  | 'financiamento'
  | 'carro_de_troca'
  | 'fechamento'
  | 'funil'
  | 'rotina_diaria'
  | 'crm'
  | 'institucional'
  | 'gestao'
  | 'pre-vendas'

export type DevelopmentContentItem = {
  id: string
  title: string
  description?: string | null
  type?: string | null
  store_id?: string | null
  source_kind?: DevelopmentContentSourceKind | null
  editorial_status?: DevelopmentEditorialStatus | null
}

export type DevelopmentContentSourceKind = 'mx_interno' | 'especialista_convidado' | 'fornecedor' | 'loja_institucional'
export type DevelopmentEditorialStatus = 'draft' | 'active' | 'paused' | 'review' | 'retired'

export type DevelopmentContentRating = {
  training_id: string
  user_id: string
  rating: number
  comment?: string | null
}

export type DevelopmentContentSuggestion = {
  title: string
  description?: string | null
  theme: DevelopmentTheme
  priority?: 'low' | 'medium' | 'high'
}

export type DevelopmentTrackStep = {
  key: string
  title: string
  theme: DevelopmentTheme
  month: number
  locked: boolean
  unlockRule: 'immediate' | 'previous_completed' | 'manager_release' | 'month_reached'
  managerFeedbackRequired: boolean
}

export type DevelopmentRecommendationSource = 'feedback' | 'pdi' | 'funil' | 'manual' | 'rotina'

export type DevelopmentContentMetadata = {
  theme: DevelopmentTheme
  source_kind: DevelopmentContentSourceKind
  editorial_status: DevelopmentEditorialStatus
  store_id: string | null
  review_after: string | null
}

export type DevelopmentRecommendationLike<T extends DevelopmentContentItem = DevelopmentContentItem> = {
  id?: string
  seller_id?: string
  store_id?: string | null
  source?: DevelopmentRecommendationSource | string | null
  source_type?: DevelopmentRecommendationSource | string | null
  source_id?: string | null
  theme?: DevelopmentTheme | string | null
  training_id?: string | null
  reason?: string | null
  status?: string | null
  priority?: 'low' | 'medium' | 'high' | string | null
  due_date?: string | null
  created_at?: string | null
  training?: T | null
}

export type FunnelDevelopmentGap = {
  etapa: string
  total: number
  pendentes: number
  concluidos: number
  cancelados: number
  semSucesso: number
  aguardando: number
  reagendamentosSemSucesso: number
}

export type RecommendedDevelopmentCard<T extends DevelopmentContentItem = DevelopmentContentItem> = {
  id: string
  source: DevelopmentRecommendationSource
  sourceLabel: string
  theme: DevelopmentTheme
  training: T
  reason: string
  priority: 'low' | 'medium' | 'high'
  recommendation: DevelopmentRecommendationLike<T> | null
}

export const DEVELOPMENT_THEMES: Array<{ key: DevelopmentTheme; label: string; aliases: string[] }> = [
  { key: 'prospeccao', label: 'Prospecção', aliases: ['prospeccao', 'lead', 'carteira', 'ativo'] },
  { key: 'agendamento', label: 'Agendamento', aliases: ['agendamento', 'agenda', 'confirmacao'] },
  { key: 'atendimento', label: 'Atendimento', aliases: ['atendimento', 'abordagem'] },
  { key: 'apresentacao', label: 'Apresentação do carro', aliases: ['apresentacao', 'produto', 'demonstracao', 'carro'] },
  { key: 'financiamento', label: 'Financiamento', aliases: ['financiamento', 'ficha', 'credito'] },
  { key: 'carro_de_troca', label: 'Carro de troca', aliases: ['troca', 'avaliacao', 'usado'] },
  { key: 'fechamento', label: 'Fechamento', aliases: ['fechamento', 'negociacao', 'proposta'] },
  { key: 'funil', label: 'Funil de Vendas', aliases: ['funil', 'conversao', 'visita'] },
  { key: 'rotina_diaria', label: 'Rotina diária', aliases: ['rotina', 'diaria', 'checkin', 'puxada'] },
  { key: 'crm', label: 'CRM', aliases: ['crm', 'follow', 'retorno'] },
  { key: 'institucional', label: 'Institucional', aliases: ['institucional', 'historia', 'valores', 'cultura'] },
  { key: 'gestao', label: 'Gestão', aliases: ['gestao', 'lideranca', 'gerente', 'feedback'] },
  { key: 'pre-vendas', label: 'Pré-vendas', aliases: ['pre-vendas', 'sdr', 'qualificacao'] },
]

const THEME_BY_KEY = new Map(DEVELOPMENT_THEMES.map(theme => [theme.key, theme]))
const DEVELOPMENT_RECOMMENDATION_SOURCE_LABELS: Record<DevelopmentRecommendationSource, string> = {
  feedback: 'Feedback',
  pdi: 'PDI',
  funil: 'Funil de Vendas',
  manual: 'Curadoria',
  rotina: 'Rotina',
}
const FUNNEL_STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  contato: 'Contato',
  agendamento: 'Agendamento',
  visita: 'Visita',
  negociacao: 'Negociação',
  venda: 'Venda',
  atendimento: 'Atendimento',
}

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function inferDevelopmentTheme(item: Pick<DevelopmentContentItem, 'title' | 'description' | 'type'>): DevelopmentTheme {
  const text = normalize(`${item.type || ''} ${item.title} ${item.description || ''}`)
  const direct = DEVELOPMENT_THEMES.find(theme => theme.key === normalize(item.type) || theme.aliases.some(alias => text.includes(normalize(alias))))
  return direct?.key || 'funil'
}

export function filterDevelopmentContent<T extends DevelopmentContentItem>(items: T[], input: { search?: string; theme?: DevelopmentTheme | 'todos' }) {
  const search = normalize(input.search)
  return items.filter((item) => {
    const theme = inferDevelopmentTheme(item)
    const haystack = normalize(`${item.title} ${item.description || ''} ${item.type || ''} ${THEME_BY_KEY.get(theme)?.label || ''}`)
    const matchesSearch = !search || haystack.includes(search)
    const matchesTheme = !input.theme || input.theme === 'todos' || theme === input.theme
    return matchesSearch && matchesTheme
  })
}

export function recommendDevelopmentThemeFromGap(gap?: string | null): DevelopmentTheme {
  const normalized = normalize(gap)
  if (normalized.includes('lead')) return 'prospeccao'
  if (normalized.includes('agd') || normalized.includes('agenda')) return 'agendamento'
  if (normalized.includes('visita')) return 'atendimento'
  if (normalized.includes('vnd') || normalized.includes('venda') || normalized.includes('negoci')) return 'fechamento'
  if (normalized.includes('troca')) return 'carro_de_troca'
  if (normalized.includes('crm') || normalized.includes('follow') || normalized.includes('retorno') || normalized.includes('contato')) return 'crm'
  if (normalized.includes('financ') || normalized.includes('ficha')) return 'financiamento'
  return 'rotina_diaria'
}

export function buildFunnelDevelopmentRecommendation<T extends DevelopmentContentItem>({
  gargalo,
  availableContent,
}: {
  gargalo?: FunnelDevelopmentGap | null
  availableContent: T[]
}): DevelopmentRecommendationLike<T> | null {
  if (!gargalo || gargalo.total <= 0) return null

  const theme = recommendDevelopmentThemeFromFunnelStage(gargalo.etapa)
  const training = findDevelopmentContentByTheme(availableContent, theme)
  const etapaLabel = formatFunnelStage(gargalo.etapa)
  const details = [
    `${gargalo.total} cliente${gargalo.total === 1 ? '' : 's'} na etapa`,
    `${gargalo.pendentes} pendente${gargalo.pendentes === 1 ? '' : 's'}`,
  ]
  if (gargalo.semSucesso > 0) details.push(`${gargalo.semSucesso} sem sucesso`)
  if (gargalo.reagendamentosSemSucesso > 0) details.push(`${gargalo.reagendamentosSemSucesso} reagendamento${gargalo.reagendamentosSemSucesso === 1 ? '' : 's'}`)

  return {
    id: `funil-${gargalo.etapa}`,
    source_type: 'funil',
    source_id: gargalo.etapa,
    theme,
    training_id: training?.id || null,
    reason: `Recomendado por gargalo de funil em ${etapaLabel}: ${details.join(', ')}.`,
    status: 'recommended',
    priority: gargalo.pendentes >= 3 || gargalo.semSucesso >= 2 ? 'high' : 'medium',
    training: training || null,
  }
}

export function buildNewCollaboratorTrack(): DevelopmentTrackStep[] {
  return [
    { key: 'm1_institucional', title: 'História, valores e cultura da loja', theme: 'institucional', month: 1, locked: false, unlockRule: 'immediate', managerFeedbackRequired: false },
    { key: 'm1_rotina', title: 'Rotina diária e puxada MX', theme: 'rotina_diaria', month: 1, locked: false, unlockRule: 'previous_completed', managerFeedbackRequired: false },
    { key: 'm1_atendimento', title: 'Atendimento inicial e abordagem', theme: 'atendimento', month: 1, locked: true, unlockRule: 'previous_completed', managerFeedbackRequired: true },
    { key: 'm2_funil', title: 'Funil comercial da loja', theme: 'funil', month: 2, locked: true, unlockRule: 'month_reached', managerFeedbackRequired: false },
    { key: 'm2_agendamento', title: 'Agendamento e confirmação de visita', theme: 'agendamento', month: 2, locked: true, unlockRule: 'previous_completed', managerFeedbackRequired: true },
    { key: 'm3_apresentacao', title: 'Apresentação do carro', theme: 'apresentacao', month: 3, locked: true, unlockRule: 'month_reached', managerFeedbackRequired: true },
    { key: 'm3_financiamento', title: 'Fundamentos de financiamento', theme: 'financiamento', month: 3, locked: true, unlockRule: 'previous_completed', managerFeedbackRequired: false },
    { key: 'm4_troca', title: 'Carro de troca e avaliação', theme: 'carro_de_troca', month: 4, locked: true, unlockRule: 'month_reached', managerFeedbackRequired: true },
    { key: 'm4_crm', title: 'CRM e follow-up', theme: 'crm', month: 4, locked: true, unlockRule: 'previous_completed', managerFeedbackRequired: false },
    { key: 'm5_fechamento', title: 'Fechamento e proposta', theme: 'fechamento', month: 5, locked: true, unlockRule: 'month_reached', managerFeedbackRequired: true },
    { key: 'm6_validacao', title: 'Validação final e liberação', theme: 'gestao', month: 6, locked: true, unlockRule: 'manager_release', managerFeedbackRequired: true },
  ]
}

export function calculateAverageRating(ratings: Array<Pick<DevelopmentContentRating, 'rating'>>) {
  if (!ratings.length) return { average: 0, count: 0 }
  const count = ratings.length
  const average = ratings.reduce((sum, item) => sum + item.rating, 0) / count
  return { average: Math.round(average * 10) / 10, count }
}

export function shouldReviewContent(input: { averageRating?: number | null; ratingCount?: number | null; reviewAfter?: string | null; editorialStatus?: DevelopmentEditorialStatus | string | null }) {
  if (input.editorialStatus === 'review') return true
  if ((input.ratingCount || 0) >= 3 && (input.averageRating || 0) > 0 && (input.averageRating || 0) < 3.5) return true
  if (!input.reviewAfter) return false
  return new Date(input.reviewAfter).getTime() <= Date.now()
}

export function buildDevelopmentRecommendation(input: {
  source: DevelopmentRecommendationSource
  text: string
  availableContent: DevelopmentContentItem[]
}) {
  const theme = recommendDevelopmentThemeFromGap(input.text)
  const training = input.availableContent.find(item => inferDevelopmentTheme(item) === theme) || null
  return {
    source: input.source,
    source_type: input.source,
    theme,
    training_id: training?.id || null,
    reason: `Recomendado por lacuna registrada em ${input.source}: ${input.text}`.slice(0, 260),
  }
}

export function buildRecommendedDevelopmentCards<T extends DevelopmentContentItem>({
  recommendations,
  funnelGap,
  availableContent,
  limit = 3,
}: {
  recommendations: DevelopmentRecommendationLike<T>[]
  funnelGap?: FunnelDevelopmentGap | null
  availableContent: T[]
  limit?: number
}): RecommendedDevelopmentCard<T>[] {
  const funnelRecommendation = buildFunnelDevelopmentRecommendation({ gargalo: funnelGap, availableContent })
  const candidates = [
    ...recommendations,
    ...(funnelRecommendation ? [funnelRecommendation] : []),
  ]
  const cards: RecommendedDevelopmentCard<T>[] = []
  const seenTrainingIds = new Set<string>()

  for (const candidate of candidates) {
    const source = normalizeRecommendationSource(candidate.source_type || candidate.source)
    const theme = normalizeDevelopmentTheme(candidate.theme) || recommendDevelopmentThemeFromGap(candidate.reason)
    const training = resolveRecommendedTraining(candidate, availableContent, theme)
    if (!training || seenTrainingIds.has(training.id)) continue

    seenTrainingIds.add(training.id)
    cards.push({
      id: candidate.id || `${source}-${training.id}`,
      source,
      sourceLabel: DEVELOPMENT_RECOMMENDATION_SOURCE_LABELS[source],
      theme,
      training,
      reason: candidate.reason || `Recomendado para reforçar ${THEME_BY_KEY.get(theme)?.label || theme}.`,
      priority: normalizePriority(candidate.priority),
      recommendation: candidate,
    })
    if (cards.length >= limit) return cards
  }

  for (const training of availableContent) {
    if (cards.length >= limit) break
    if (seenTrainingIds.has(training.id)) continue
    const theme = inferDevelopmentTheme(training)
    seenTrainingIds.add(training.id)
    cards.push({
      id: `manual-${training.id}`,
      source: 'manual',
      sourceLabel: DEVELOPMENT_RECOMMENDATION_SOURCE_LABELS.manual,
      theme,
      training,
      reason: `Conteúdo prioritário da trilha para reforçar ${THEME_BY_KEY.get(theme)?.label || theme}.`,
      priority: 'medium',
      recommendation: null,
    })
  }

  return cards
}

export function isTrackStepUnlocked(step: DevelopmentTrackStep, completedKeys: string[], currentMonth: number) {
  if (!step.locked || step.unlockRule === 'immediate') return true
  if (step.unlockRule === 'month_reached' && currentMonth >= step.month) return true
  if (step.unlockRule === 'manager_release') return completedKeys.includes(step.key)
  const track = buildNewCollaboratorTrack()
  const currentIndex = track.findIndex(item => item.key === step.key)
  if (currentIndex <= 0) return true
  return currentMonth >= step.month && completedKeys.includes(track[currentIndex - 1].key)
}

export function buildDevelopmentContentMetadata(input: {
  item: DevelopmentContentItem
  storeId?: string | null
  sourceKind?: DevelopmentContentSourceKind
  editorialStatus?: DevelopmentEditorialStatus
  reviewAfter?: string | null
}): DevelopmentContentMetadata {
  return {
    theme: inferDevelopmentTheme(input.item),
    source_kind: input.sourceKind || input.item.source_kind || (input.storeId || input.item.store_id ? 'loja_institucional' : 'mx_interno'),
    editorial_status: input.editorialStatus || input.item.editorial_status || 'active',
    store_id: input.storeId ?? input.item.store_id ?? null,
    review_after: input.reviewAfter ?? null,
  }
}

export function isContentVisibleForStore(item: Pick<DevelopmentContentItem, 'store_id'>, userStoreId?: string | null) {
  return !item.store_id || Boolean(userStoreId && item.store_id === userStoreId)
}

function recommendDevelopmentThemeFromFunnelStage(stage: string): DevelopmentTheme {
  const normalized = normalize(stage)
  if (normalized.includes('agend')) return 'agendamento'
  if (normalized.includes('visit') || normalized.includes('atend')) return 'atendimento'
  if (normalized.includes('negoci') || normalized.includes('venda')) return 'fechamento'
  if (normalized.includes('lead') || normalized.includes('prospect')) return 'prospeccao'
  if (normalized.includes('contato') || normalized.includes('retorno')) return 'crm'
  return recommendDevelopmentThemeFromGap(stage)
}

function findDevelopmentContentByTheme<T extends DevelopmentContentItem>(items: T[], theme: DevelopmentTheme): T | null {
  return items.find(item => inferDevelopmentTheme(item) === theme) || null
}

function resolveRecommendedTraining<T extends DevelopmentContentItem>(
  recommendation: DevelopmentRecommendationLike<T>,
  availableContent: T[],
  theme: DevelopmentTheme,
): T | null {
  if (recommendation.training) return recommendation.training
  if (recommendation.training_id) {
    const byId = availableContent.find(item => item.id === recommendation.training_id)
    if (byId) return byId
  }
  return findDevelopmentContentByTheme(availableContent, theme)
}

function normalizeRecommendationSource(source?: string | null): DevelopmentRecommendationSource {
  if (source === 'feedback' || source === 'pdi' || source === 'funil' || source === 'manual' || source === 'rotina') return source
  return 'manual'
}

function normalizeDevelopmentTheme(theme?: string | null): DevelopmentTheme | null {
  if (!theme) return null
  const normalized = normalize(theme)
  return DEVELOPMENT_THEMES.find(item => normalize(item.key) === normalized)?.key || null
}

function normalizePriority(priority?: string | null): 'low' | 'medium' | 'high' {
  if (priority === 'low' || priority === 'medium' || priority === 'high') return priority
  return 'medium'
}

function formatFunnelStage(stage: string): string {
  const normalized = normalize(stage)
  return FUNNEL_STAGE_LABELS[normalized] || stage.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

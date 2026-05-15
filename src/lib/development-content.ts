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

export type DevelopmentRecommendationSource = 'feedback' | 'pdi' | 'manual' | 'rotina'

export type DevelopmentContentMetadata = {
  theme: DevelopmentTheme
  source_kind: DevelopmentContentSourceKind
  editorial_status: DevelopmentEditorialStatus
  store_id: string | null
  review_after: string | null
}

export const DEVELOPMENT_THEMES: Array<{ key: DevelopmentTheme; label: string; aliases: string[] }> = [
  { key: 'prospeccao', label: 'Prospecção', aliases: ['prospeccao', 'lead', 'carteira', 'ativo'] },
  { key: 'agendamento', label: 'Agendamento', aliases: ['agendamento', 'agenda', 'confirmacao'] },
  { key: 'atendimento', label: 'Atendimento', aliases: ['atendimento', 'abordagem'] },
  { key: 'apresentacao', label: 'Apresentação do carro', aliases: ['apresentacao', 'produto', 'demonstracao', 'carro'] },
  { key: 'financiamento', label: 'Financiamento', aliases: ['financiamento', 'ficha', 'credito'] },
  { key: 'carro_de_troca', label: 'Carro de troca', aliases: ['troca', 'avaliacao', 'usado'] },
  { key: 'fechamento', label: 'Fechamento', aliases: ['fechamento', 'negociacao', 'proposta'] },
  { key: 'funil', label: 'Funil', aliases: ['funil', 'conversao', 'visita'] },
  { key: 'rotina_diaria', label: 'Rotina diária', aliases: ['rotina', 'diaria', 'checkin', 'puxada'] },
  { key: 'crm', label: 'CRM', aliases: ['crm', 'follow', 'retorno'] },
  { key: 'institucional', label: 'Institucional', aliases: ['institucional', 'historia', 'valores', 'cultura'] },
  { key: 'gestao', label: 'Gestão', aliases: ['gestao', 'lideranca', 'gerente', 'feedback'] },
  { key: 'pre-vendas', label: 'Pré-vendas', aliases: ['pre-vendas', 'sdr', 'qualificacao'] },
]

const THEME_BY_KEY = new Map(DEVELOPMENT_THEMES.map(theme => [theme.key, theme]))

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
  if (normalized.includes('vnd') || normalized.includes('venda')) return 'fechamento'
  if (normalized.includes('troca')) return 'carro_de_troca'
  if (normalized.includes('crm') || normalized.includes('follow') || normalized.includes('retorno')) return 'crm'
  if (normalized.includes('financ') || normalized.includes('ficha')) return 'financiamento'
  return 'rotina_diaria'
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
    theme,
    training_id: training?.id || null,
    reason: `Recomendado por lacuna registrada em ${input.source}: ${input.text}`.slice(0, 260),
  }
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

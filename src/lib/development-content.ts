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
export type DevelopmentEditorialStatus = 'draft' | 'active' | 'paused' | 'review'

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
  return 'rotina_diaria'
}

export function buildNewCollaboratorTrack() {
  return [
    { key: 'mercado', title: 'Mercado e papel do vendedor', theme: 'institucional' as DevelopmentTheme, locked: false },
    { key: 'rotina', title: 'Rotina diária e puxada MX', theme: 'rotina_diaria' as DevelopmentTheme, locked: false },
    { key: 'funil', title: 'Funil comercial da loja', theme: 'funil' as DevelopmentTheme, locked: true },
    { key: 'atendimento', title: 'Atendimento e apresentação do carro', theme: 'atendimento' as DevelopmentTheme, locked: true },
    { key: 'crm', title: 'CRM, retorno e follow-up', theme: 'crm' as DevelopmentTheme, locked: true },
  ]
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

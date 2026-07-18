export const OWNER_BASE44_SECTION_VALUES = [
  'home',
  'rotina',
  'decisoes',
  'planejamento',
  'plano-acao',
  'consultoria',
  'departamentos',
  'mercado',
  'universidade',
  'consultor',
] as const

export type OwnerBase44Section = (typeof OWNER_BASE44_SECTION_VALUES)[number]

export type OwnerBase44NavigationItem = {
  label: string
  section: OwnerBase44Section
  departmentCode?: 'comercial' | 'marketing' | 'produto' | 'rh' | 'financeiro' | 'operacional'
}

export type OwnerBase44NavigationSection = {
  label: 'GESTÃO' | 'ESTRATÉGIA' | 'NEGÓCIO' | 'DESENVOLVIMENTO' | 'AÇÃO GLOBAL'
  items: OwnerBase44NavigationItem[]
}

export const OWNER_BASE44_NAVIGATION: OwnerBase44NavigationSection[] = [
  {
    label: 'GESTÃO',
    items: [
      { label: 'Início', section: 'home' },
      { label: 'Rotina do Dia', section: 'rotina' },
      { label: 'Central de Decisões', section: 'decisoes' },
    ],
  },
  {
    label: 'ESTRATÉGIA',
    items: [
      { label: 'Plano Estratégico', section: 'planejamento' },
      { label: 'Plano de Ação', section: 'plano-acao' },
      { label: 'Consultoria', section: 'consultoria' },
    ],
  },
  {
    label: 'NEGÓCIO',
    items: [
      { label: 'Departamentos', section: 'departamentos' },
      { label: 'Visão Geral', section: 'departamentos' },
      { label: 'Comercial', section: 'departamentos', departmentCode: 'comercial' },
      { label: 'Marketing', section: 'departamentos', departmentCode: 'marketing' },
      { label: 'Produto e Estoque', section: 'departamentos', departmentCode: 'produto' },
      { label: 'Pessoas — RH', section: 'departamentos', departmentCode: 'rh' },
      { label: 'Financeiro', section: 'departamentos', departmentCode: 'financeiro' },
      { label: 'Operações', section: 'departamentos', departmentCode: 'operacional' },
      { label: 'Mercado', section: 'mercado' },
    ],
  },
  {
    label: 'DESENVOLVIMENTO',
    items: [{ label: 'Universidade MX', section: 'universidade' }],
  },
  {
    label: 'AÇÃO GLOBAL',
    items: [{ label: 'Falar com Consultor', section: 'consultor' }],
  },
]

const sectionSet = new Set<string>(OWNER_BASE44_SECTION_VALUES)

export function resolveOwnerSection(search: string): OwnerBase44Section {
  const raw = new URLSearchParams(search).get('ownerSection')
  if (raw?.startsWith('departamentos-')) return 'departamentos'
  return raw && sectionSet.has(raw) ? (raw as OwnerBase44Section) : 'home'
}

export function ownerNavigationSectionValue(item: OwnerBase44NavigationItem): string {
  return item.departmentCode ? `departamentos-${item.departmentCode}` : item.section
}

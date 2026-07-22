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

export const OWNER_LEGACY_SECTION_VALUES = [
  'resultados',
  'alertas',
  'benchmarking',
  'agenda',
  'visitas',
  'biblioteca',
] as const

export const OWNER_DEPARTMENT_CODES = [
  'visao-geral',
  'comercial',
  'marketing',
  'produto',
  'rh',
  'financeiro',
  'operacional',
] as const

export type OwnerBase44Section = (typeof OWNER_BASE44_SECTION_VALUES)[number]
export type OwnerLegacySection = (typeof OWNER_LEGACY_SECTION_VALUES)[number]
export type OwnerResolvedSection = OwnerBase44Section | OwnerLegacySection
export type OwnerDepartmentNavigationCode = (typeof OWNER_DEPARTMENT_CODES)[number]

export type OwnerBase44NavigationItem = {
  label: string
  section: OwnerBase44Section
  departmentCode?: OwnerDepartmentNavigationCode
  children?: OwnerBase44NavigationItem[]
  defaultExpanded?: boolean
  badge?: string
  badgeTone?: 'default' | 'warning'
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
      {
        label: 'Departamentos',
        section: 'departamentos',
        defaultExpanded: true,
        children: [
          { label: 'Visão Geral', section: 'departamentos', departmentCode: 'visao-geral' },
          { label: 'Comercial', section: 'departamentos', departmentCode: 'comercial' },
          { label: 'Marketing', section: 'departamentos', departmentCode: 'marketing' },
          { label: 'Produto e Estoque', section: 'departamentos', departmentCode: 'produto' },
          { label: 'Pessoas — RH', section: 'departamentos', departmentCode: 'rh' },
          { label: 'Financeiro', section: 'departamentos', departmentCode: 'financeiro' },
          { label: 'Operações', section: 'departamentos', departmentCode: 'operacional' },
        ],
      },
      { label: 'Mercado', section: 'mercado', badge: 'Em construção', badgeTone: 'warning' },
    ],
  },
  {
    label: 'DESENVOLVIMENTO',
    items: [{
      label: 'Universidade MX',
      section: 'universidade',
      badge: 'Em construção',
      badgeTone: 'warning',
    }],
  },
  {
    label: 'AÇÃO GLOBAL',
    items: [{ label: 'Falar com Consultor', section: 'consultor' }],
  },
]

const sectionSet = new Set<string>([
  ...OWNER_BASE44_SECTION_VALUES,
  ...OWNER_LEGACY_SECTION_VALUES,
])
const departmentCodeSet = new Set<string>(OWNER_DEPARTMENT_CODES)

export function resolveOwnerSection(search: string): OwnerResolvedSection {
  const raw = new URLSearchParams(search).get('ownerSection')
  if (raw?.startsWith('departamentos-')) {
    const code = raw.slice('departamentos-'.length)
    return departmentCodeSet.has(code) ? 'departamentos' : 'home'
  }
  return raw && sectionSet.has(raw) ? (raw as OwnerResolvedSection) : 'home'
}

export function ownerNavigationSectionValue(item: OwnerBase44NavigationItem): string {
  return item.departmentCode ? `departamentos-${item.departmentCode}` : item.section
}

const OWNER_CANONICAL_PATHS: Record<OwnerBase44Section, string> = {
  home: '/dono',
  rotina: '/dono/rotina',
  decisoes: '/dono/decisoes',
  planejamento: '/dono/plano-estrategico',
  'plano-acao': '/dono/plano-acao',
  consultoria: '/dono/consultoria',
  departamentos: '/dono/departamentos',
  mercado: '/dono/mercado',
  universidade: '/dono/universidade',
  consultor: '/dono/consultoria?openConsultant=1',
}

const OWNER_DEPARTMENT_PATHS: Record<OwnerDepartmentNavigationCode, string> = {
  'visao-geral': '/dono/departamentos',
  comercial: '/dono/departamentos/comercial',
  marketing: '/dono/departamentos/marketing',
  produto: '/dono/departamentos/produto-e-estoque',
  rh: '/dono/departamentos/pessoas-rh',
  financeiro: '/dono/departamentos/financeiro',
  operacional: '/dono/departamentos/operacoes',
}

export function ownerNavigationCanonicalPath(item: OwnerBase44NavigationItem): string {
  return item.departmentCode
    ? OWNER_DEPARTMENT_PATHS[item.departmentCode]
    : OWNER_CANONICAL_PATHS[item.section]
}

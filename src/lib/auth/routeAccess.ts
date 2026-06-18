import type { UserRole } from '@/types/database'
import { USER_ROLES } from './roles'
import { CONFIGURATION_ROLES, PDI_PRINT_ROLES, PRODUCT_ROLES, RANKING_ROLES, type Capability, hasCapability } from './capabilities'

type RouteRule = {
  pattern: string
  roles?: readonly UserRole[]
  capability?: Capability
}

const INTERNAL_ROLES = ['administrador_geral', 'administrador_mx', 'consultor_mx'] as const satisfies readonly UserRole[]
const MANAGEMENT_ROLES = ['administrador_geral', 'administrador_mx', 'consultor_mx', 'dono', 'gerente'] as const satisfies readonly UserRole[]
const INTERNAL_AND_OWNER = ['administrador_geral', 'administrador_mx', 'consultor_mx', 'dono'] as const satisfies readonly UserRole[]
const INTERNAL_AND_LEADERS = ['administrador_geral', 'administrador_mx', 'consultor_mx', 'dono', 'gerente'] as const satisfies readonly UserRole[]

export const ROUTE_ACCESS_RULES = [
  { pattern: '/settings', roles: CONFIGURATION_ROLES, capability: 'view_configurations' },
  { pattern: '/team', capability: 'manage_team' },
  { pattern: '/equipe', capability: 'manage_team' },
  { pattern: '/painel', roles: INTERNAL_ROLES },
  { pattern: '/simulacao', roles: INTERNAL_ROLES, capability: 'simulate_role' },
  { pattern: '/simulacao/*', roles: INTERNAL_ROLES, capability: 'simulate_role' },
  { pattern: '/agenda', roles: INTERNAL_ROLES },
  { pattern: '/consultoria/*', roles: INTERNAL_ROLES },
  { pattern: '/configuracoes/consultoria-pmr', roles: INTERNAL_ROLES },
  { pattern: '/configuracoes/reprocessamento', roles: INTERNAL_ROLES },
  { pattern: '/lojas/:storeSlug/consultor-ia', roles: USER_ROLES },
  { pattern: '/lojas/:storeSlug', roles: INTERNAL_AND_LEADERS },
  { pattern: '/lojas', roles: INTERNAL_AND_OWNER },
  { pattern: '/rotina', roles: ['administrador_geral', 'administrador_mx', 'consultor_mx', 'gerente'] },
  { pattern: '/configuracoes/operacional', roles: INTERNAL_ROLES },
  { pattern: '/relatorio-matinal', roles: INTERNAL_AND_LEADERS },
  { pattern: '/relatorios/performance-vendas', roles: INTERNAL_AND_LEADERS },
  { pattern: '/relatorios/performance-vendedor', roles: MANAGEMENT_ROLES },
{ pattern: '/auditoria', roles: ['administrador_geral', 'administrador_mx', 'consultor_mx', 'gerente'] },
{ pattern: '/home', roles: ['vendedor', 'gerente', 'dono'] },
{ pattern: '/meu-dia', roles: ['vendedor'] },
{ pattern: '/minha-remuneracao', roles: ['vendedor'] },
{ pattern: '/lancamento-diario', roles: ['vendedor'] },
{ pattern: '/fechamento-diario', roles: ['vendedor'] },
{ pattern: '/terminal-mx', roles: ['vendedor'] },
{ pattern: '/historico', roles: ['vendedor'] },
{ pattern: '/carteira-clientes', roles: ['vendedor'] },
{ pattern: '/meu-funil', roles: ['vendedor'] },
{ pattern: '/funil-comercial', roles: ['vendedor'] },
{ pattern: '/central-execucao', roles: ['vendedor'] },
{ pattern: '/central-de-execucao', roles: ['vendedor'] },
{ pattern: '/relatorios-vendedor', roles: ['vendedor'] },
{ pattern: '/relatorios', roles: ['vendedor'] },
{ pattern: '/feedbacks', roles: ['vendedor'] },
{ pattern: '/consultor-ia', roles: ['vendedor'] },
  { pattern: '/funil-vendas', roles: ['gerente', 'dono'] },
  { pattern: '/metas', roles: ['gerente', 'dono'] },
  { pattern: '/falar-consultor', roles: ['gerente', 'dono'] },
  { pattern: '/organograma', roles: INTERNAL_AND_OWNER },
  { pattern: '/banco-talentos', roles: INTERNAL_AND_OWNER },
  { pattern: '/ajuda', roles: ['vendedor'] },
  { pattern: '/ranking', roles: RANKING_ROLES, capability: 'view_ranking' },
  { pattern: '/classificacao', roles: RANKING_ROLES, capability: 'view_ranking' },
  { pattern: '/feedback', roles: USER_ROLES },
  { pattern: '/funil', roles: USER_ROLES },
  { pattern: '/vendedor/funil', roles: USER_ROLES },
  { pattern: '/vendedor/meu-funil', roles: USER_ROLES },
  { pattern: '/vendedor/feedback', roles: USER_ROLES },
  { pattern: '/vendedor/devolutivas', roles: USER_ROLES },
  { pattern: '/vendedor/treinamentos', roles: USER_ROLES },
  { pattern: '/vendedor/terminal-mx', roles: ['vendedor'] },
  { pattern: '/vendedor/configuracoes', roles: ['vendedor'] },
  { pattern: '/treinamentos', roles: USER_ROLES },
  { pattern: '/devolutivas', roles: USER_ROLES },
  { pattern: '/notificacoes', roles: USER_ROLES },
  { pattern: '/perfil', roles: USER_ROLES },
  { pattern: '/pdi/:id/print', roles: PDI_PRINT_ROLES, capability: 'print_pdi' },
  { pattern: '/pdi', roles: USER_ROLES },
  { pattern: '/produtos', roles: PRODUCT_ROLES, capability: 'view_products' },
  { pattern: '/configuracoes/remuneracao', roles: INTERNAL_AND_LEADERS },
{ pattern: '/configuracoes', roles: USER_ROLES },
] as const satisfies readonly RouteRule[]

function normalizePath(pathname: string) {
  const path = pathname.split('?')[0]?.split('#')[0] || '/'
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1)
  return path
}

function matchesPattern(pathname: string, pattern: string) {
  const path = normalizePath(pathname)
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2)
    return path === prefix || path.startsWith(`${prefix}/`)
  }

  const pathParts = path.split('/').filter(Boolean)
  const patternParts = pattern.split('/').filter(Boolean)
  if (pathParts.length !== patternParts.length) return false

  return patternParts.every((part, index) => part.startsWith(':') || part === pathParts[index])
}

export function getRouteAccessRule(pathname: string): RouteRule | null {
  return ROUTE_ACCESS_RULES.find(rule => matchesPattern(pathname, rule.pattern)) || null
}

export function canAccessPath(pathname: string, role: UserRole | null | undefined): boolean {
  if (!role) return false
  const rule = getRouteAccessRule(pathname)
  if (!rule) return false
  if (rule.capability) return hasCapability(role, rule.capability)
  return Boolean(rule.roles?.includes(role))
}

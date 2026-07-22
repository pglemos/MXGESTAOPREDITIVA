const LEGACY_OWNER_ROUTES: Readonly<Record<string, string>> = {
  rotina: '/dono/rotina',
  decisoes: '/dono/decisoes',
  'plano-estrategico': '/dono/plano-estrategico',
  'plano-acao': '/dono/plano-acao',
  consultoria: '/dono/consultoria',
  departamentos: '/dono/departamentos',
  'departamentos/visao-geral': '/dono/departamentos',
  'departamentos/comercial': '/dono/departamentos/comercial',
  'departamentos/marketing': '/dono/departamentos/marketing',
  'departamentos/produto': '/dono/departamentos/produto-e-estoque',
  'departamentos/produto-e-estoque': '/dono/departamentos/produto-e-estoque',
  'departamentos/rh': '/dono/departamentos/pessoas-rh',
  'departamentos/pessoas-rh': '/dono/departamentos/pessoas-rh',
  'departamentos/financeiro': '/dono/departamentos/financeiro',
  'departamentos/operacional': '/dono/departamentos/operacoes',
  'departamentos/operacoes': '/dono/departamentos/operacoes',
  mercado: '/dono/mercado',
  universidade: '/dono/universidade',
  consultor: '/dono/consultoria',
  'consultor-ia': '/dono/consultoria',
}

export function mapLegacyOwnerPathToCanonical(pathname: string): string {
  const normalizedPath = pathname.split('?')[0]?.split('#')[0]?.replace(/\/+$/, '') || '/'
  const match = normalizedPath.match(/^\/lojas\/[^/]+(?:\/(.*))?$/)
  const legacySubroute = match?.[1]

  if (!legacySubroute) return '/dono'
  const mappedRoute = Object.prototype.hasOwnProperty.call(LEGACY_OWNER_ROUTES, legacySubroute)
    ? LEGACY_OWNER_ROUTES[legacySubroute]
    : undefined
  return mappedRoute ?? '/dono'
}

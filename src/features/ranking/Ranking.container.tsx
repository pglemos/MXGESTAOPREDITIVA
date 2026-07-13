import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { GlobalRankingView } from './views/GlobalRankingView'
import { StoreRankingView } from './views/StoreRankingView'
import { ManagerRankingReference } from './views/ManagerRankingReference'

/**
 * Container raiz do Ranking. Faz routing por perfil:
 * - Perfis internos MX → `GlobalRankingView` (rede inteira)
 * - Demais perfis (vendedor/gerente/dono) → `StoreRankingView` (loja ativa)
 *
 * Story 2.3 — decomposição de `src/pages/Ranking.tsx` (UX-001) seguindo ADR-0050.
 */
export function Ranking() {
  const { role } = useAuth()
  if (isPerfilInternoMx(role)) return <GlobalRankingView />
  if (role === 'gerente') return <ManagerRankingReference />
  return <StoreRankingView />
}

export default Ranking

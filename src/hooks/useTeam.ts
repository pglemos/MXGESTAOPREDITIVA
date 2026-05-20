/**
 * @deprecated Use os sub-hooks em `@/hooks/team` (`useTeamMembers`, `useTeamMembership`,
 * `useTeamInvites`, `useTeamMetrics`) e `@/hooks/useStores` (`useStores`, `useStoresStats`,
 * `useSellersByStore`, `useAllSellers`). Este shim re-exporta a API combinada para preservar
 * compatibilidade — ver `docs/migrations/usage-useTeam.md` e ADR-0051.
 *
 * Sprint 4: este arquivo será removido após migração completa dos consumers.
 */
import { useTeamMembers, useTeamMembership, useTeamInvites } from './team'
import type { TeamMember, TeamMemberUpdateFields, RegisterUserInput } from './team'

// Re-export public types (preservar contrato)
export type { TeamMember, TeamMemberUpdateFields, RegisterUserInput }

// Re-export store hooks extraídos para `useStores.ts` (preservar contrato de imports)
export {
  useStores,
  useStoresStats,
  useSellersByStore,
  useAllSellers,
  type StoreUpdateFields,
} from './useStores'

/**
 * @deprecated Shim sobre 4 sub-hooks de `@/hooks/team`. Use os sub-hooks diretamente.
 *
 * Composição:
 * - `useTeamMembers` — lista de membros + loading/error/refetch
 * - `useTeamMembership` — updateVigencia / updateTeamMember / deleteTeamMember
 * - `useTeamInvites` — registerUser
 *
 * Para métricas agregadas, use `useTeamMetrics({ sellers })` diretamente.
 */
export function useTeam(storeIdOverride?: string) {
  const { sellers, loading, error, refetch } = useTeamMembers({ storeIdOverride })
  const { updateVigencia, updateTeamMember, deleteTeamMember } = useTeamMembership({
    storeIdOverride,
    sellers,
    refetchMembers: refetch,
  })
  const { registerUser } = useTeamInvites({ refetchMembers: refetch })

  return {
    sellers,
    team: sellers, // Alias para consistência MX
    loading,
    error,
    refetch,
    updateVigencia,
    updateTeamMember,
    deleteTeamMember,
    registerUser,
  }
}

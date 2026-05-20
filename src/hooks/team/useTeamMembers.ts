import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { isAdministradorMx, useAuth } from '@/hooks/useAuth'
import { calculateReferenceDate } from '@/hooks/useCheckins'
import { isLancamentosViaRpcEnabled } from '@/lib/feature-flags'
import {
  TEAM_MEMBERSHIP_SELECT,
  TEAM_SELLER_TENURE_SELECT,
  hasStoreTeamUser,
  type SellerTenureRow,
  type SellerTenureWithUserRow,
  type TeamMember,
  type TeamMembershipRow,
} from './types'

export type UseTeamMembersInput = {
  storeIdOverride?: string
}

export type UseTeamMembersReturn = {
  sellers: TeamMember[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Sub-hook: fetch + assemble da equipe (membros, vínculos, vigências e checkin do dia).
 *
 * Responsabilidade única: leitura crua + composição de `TeamMember[]`.
 */
export function useTeamMembers({ storeIdOverride }: UseTeamMembersInput = {}): UseTeamMembersReturn {
  const { storeId: authStoreId, role } = useAuth()
  const storeId = storeIdOverride || authStoreId
  const [sellers, setSellers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const referenceDate = calculateReferenceDate()

  const fetchTeam = useCallback(async () => {
    setLoading(true)

    try {
      let teamData: TeamMembershipRow[] = []
      let tenureRows: SellerTenureWithUserRow[] = []
      let tenureMap = new Map<string, SellerTenureRow>()
      let checkedIn = new Set<string>()
      const isGlobalView = !storeId || storeId === 'all'

      if (isGlobalView && !isAdministradorMx(role)) {
        setSellers([])
        setError(null)
        return
      }

      // 1. Fetch Users & Memberships
      if (storeId && storeId !== 'all') {
        const { data: members, error: membersError } = await supabase
          .from('vinculos_loja')
          .select(TEAM_MEMBERSHIP_SELECT)
          .eq('store_id', storeId)
          .eq('is_active', true)
        if (membersError) throw membersError
        teamData = (members || []) as unknown as TeamMembershipRow[]
      } else {
        const { data: members, error: membersError } = await supabase
          .from('vinculos_loja')
          .select(TEAM_MEMBERSHIP_SELECT)
          .eq('is_active', true)
        if (membersError) throw membersError
        teamData = ((members || []) as unknown as TeamMembershipRow[]).filter(hasStoreTeamUser)
      }

      // 2. Fetch Tenures (Vigência)
      let tenuresQuery = supabase.from('vendedores_loja').select(TEAM_SELLER_TENURE_SELECT)
      if (storeId && storeId !== 'all') {
        tenuresQuery = tenuresQuery.eq('store_id', storeId)
      }
      const { data: tenures, error: tenuresError } = await tenuresQuery
      if (tenuresError) throw tenuresError
      tenureRows = (tenures || []) as unknown as SellerTenureWithUserRow[]
      tenureMap = new Map(tenureRows.map((t) => [`${t.store_id}:${t.seller_user_id}`, t]))

      // 3. Fetch Checkins
      let todayCheckins: { seller_user_id: string }[] | null = null
      if (isLancamentosViaRpcEnabled() && storeId && storeId !== 'all') {
        const { data: rpcData, error: rpcErr } = await supabase.rpc(
          'get_lancamentos_por_loja_periodo',
          {
            p_store_id: storeId,
            p_start_date: referenceDate,
            p_end_date: referenceDate,
            p_scope: 'daily',
          },
        )
        if (rpcErr) throw rpcErr
        todayCheckins = (rpcData as { seller_user_id: string }[] | null) || []
      } else if (isLancamentosViaRpcEnabled() && isGlobalView) {
        const { data: rpcData, error: rpcErr } = await supabase.rpc(
          'get_lancamentos_referencia_dia',
          {
            p_reference_date: referenceDate,
            p_scope: 'daily',
          },
        )
        if (rpcErr) throw rpcErr
        todayCheckins = (rpcData as { seller_user_id: string }[] | null) || []
      } else {
        let checkinsQuery = supabase
          .from('lancamentos_diarios')
          .select('seller_user_id')
          .eq('reference_date', referenceDate)
          .eq('metric_scope', 'daily')
        if (storeId && storeId !== 'all') {
          checkinsQuery = checkinsQuery.eq('store_id', storeId)
        }
        const { data, error: checkinsError } = await checkinsQuery
        if (checkinsError) throw checkinsError
        todayCheckins = data || []
      }
      checkedIn = new Set((todayCheckins || []).map((c) => c.seller_user_id))

      // 4. Assemble Final Team
      setSellers(
        teamData.filter(hasStoreTeamUser).map((m) => {
          const u = m.users
          const memberStoreId = m.store_id
          const tenure = tenureMap.get(`${memberStoreId}:${u.id}`)
          return {
            ...u,
            role: m.role || u.role,
            store_id: memberStoreId,
            store_name: m.store?.name || undefined,
            checkin_today: checkedIn.has(u.id),
            started_at: tenure?.started_at ?? undefined,
            ended_at: tenure?.ended_at ?? undefined,
            is_active: tenure?.is_active ?? u?.active ?? true,
            closing_month_grace: tenure?.closing_month_grace ?? false,
          }
        }),
      )
      setError(null)
    } catch (err) {
      console.error('Audit Error [useTeamMembers]: fetchTeam fail ->', err)
      setSellers([])
      setError('Não foi possível carregar os vínculos da equipe desta loja.')
    } finally {
      setLoading(false)
    }
  }, [storeId, referenceDate, role])

  useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  return { sellers, loading, error, refetch: fetchTeam }
}

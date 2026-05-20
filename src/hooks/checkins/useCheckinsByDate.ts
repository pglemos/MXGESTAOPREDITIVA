import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { DailyCheckin, CheckinWithTotals } from '@/types/database'
import { isLancamentosViaRpcEnabled } from '@/lib/feature-flags'
import { CHECKIN_SELECT, withCheckinTotals } from './types'

/**
 * Hook responsável por buscar um lançamento específico por data + scope.
 * Retorna função imperativa (não há state interno).
 */
export function useCheckinsByDate(
    profile: { id: string } | null,
    storeId: string | null,
    onError?: (msg: string) => void,
) {
    const fetchCheckinByDate = useCallback(async (date: string, scope: string = 'daily'): Promise<CheckinWithTotals | null> => {
        if (!profile || !storeId) return null

        let data: DailyCheckin | null = null
        let queryError: { message: string } | null = null

        if (isLancamentosViaRpcEnabled()) {
            const { data: rpcData, error: rpcErr } = await supabase.rpc('get_lancamento_por_dia', {
                p_seller_id: profile.id,
                p_store_id: storeId,
                p_reference_date: date,
                p_scope: scope,
            })
            const row = rpcData as DailyCheckin | null
            data = row && row.id ? row : null
            queryError = rpcErr
        } else {
            const res = await supabase
                .from('lancamentos_diarios')
                .select(CHECKIN_SELECT)
                .eq('seller_user_id', profile.id)
                .eq('store_id', storeId)
                .eq('reference_date', date)
                .eq('metric_scope', scope)
                .maybeSingle()
            data = res.data as DailyCheckin | null
            queryError = res.error
        }

        if (queryError) {
            console.error('Audit Error [useCheckinsByDate]: fetchCheckinByDate fail ->', queryError.message)
            onError?.('Não foi possível carregar o lançamento desta data.')
            return null
        }
        return data ? withCheckinTotals(data as DailyCheckin) : null
    }, [profile, storeId, onError])

    return { fetchCheckinByDate }
}

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { DailyCheckin, CheckinWithTotals } from '@/types/database'
import { isLancamentosViaRpcEnabled } from '@/lib/feature-flags'
import { traced } from '@/lib/observability'
import { CHECKIN_SELECT, withCheckinTotals } from './types'

/**
 * Hook responsável pelo lançamento oficial do dia (referência atual).
 */
export function useCheckinsToday(
    profile: { id: string } | null,
    storeId: string | null,
    referenceDate: string,
) {
    const [todayCheckin, setTodayCheckin] = useState<CheckinWithTotals | null>(null)
    const [error, setError] = useState<string | null>(null)

    const fetchTodayCheckin = useCallback(async () => {
        if (!profile || !storeId) {
            setTodayCheckin(null)
            return
        }

        let data: DailyCheckin | null = null
        let queryError: { message: string } | null = null

        if (isLancamentosViaRpcEnabled()) {
            const { result } = await traced(async () =>
                supabase.rpc('get_lancamento_por_dia', {
                    p_seller_id: profile.id,
                    p_store_id: storeId,
                    p_reference_date: referenceDate,
                    p_scope: 'daily',
                }),
            )
            const row = result.data as DailyCheckin | null
            data = row && row.id ? row : null
            queryError = result.error
        } else {
            const res = await supabase
                .from('lancamentos_diarios')
                .select(CHECKIN_SELECT)
                .eq('seller_user_id', profile.id)
                .eq('store_id', storeId)
                .eq('reference_date', referenceDate)
                .eq('metric_scope', 'daily')
                .maybeSingle()
            data = res.data as DailyCheckin | null
            queryError = res.error
        }

        if (queryError) {
            console.error('Audit Error [useCheckinsToday]: fetchTodayCheckin fail ->', queryError.message)
            setError('Não foi possível carregar o lançamento oficial do dia.')
            setTodayCheckin(null)
        } else if (data) {
            setTodayCheckin(withCheckinTotals(data as DailyCheckin))
        } else {
            setTodayCheckin(null)
        }
    }, [profile, storeId, referenceDate])

    return { todayCheckin, setTodayCheckin, error, setError, fetchTodayCheckin }
}

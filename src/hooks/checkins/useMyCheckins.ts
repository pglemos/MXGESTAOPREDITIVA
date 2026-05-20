import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { DailyCheckin, CheckinWithTotals } from '@/types/database'
import { isLancamentosViaRpcEnabled } from '@/lib/feature-flags'
import { CHECKIN_SELECT, withCheckinTotals } from './types'

/**
 * Hook focado no histórico de lançamentos do próprio vendedor logado.
 */
export function useMyCheckins() {
    const { profile, storeId } = useAuth()
    const [checkins, setCheckins] = useState<CheckinWithTotals[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetch = useCallback(async (filters?: { startDate?: string; endDate?: string }) => {
        if (!profile || !storeId) {
            setCheckins([])
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            let data: DailyCheckin[] | null = null
            if (isLancamentosViaRpcEnabled() && filters?.startDate && filters?.endDate) {
                const { data: rpcData, error: rpcErr } = await supabase.rpc('get_lancamentos_por_vendedor_periodo', {
                    p_seller_id: profile.id,
                    p_store_id: storeId,
                    p_start_date: filters.startDate,
                    p_end_date: filters.endDate,
                    p_scope: 'daily',
                })
                if (rpcErr) throw rpcErr
                data = (rpcData as DailyCheckin[] | null) || []
            } else {
                let query = supabase.from('lancamentos_diarios').select(CHECKIN_SELECT)
                    .eq('seller_user_id', profile.id).eq('store_id', storeId).order('reference_date', { ascending: false })
                if (filters?.startDate) query = query.gte('reference_date', filters.startDate)
                if (filters?.endDate) query = query.lte('reference_date', filters.endDate)
                const { data: rows, error: queryError } = await query
                if (queryError) throw queryError
                data = (rows as DailyCheckin[] | null) || []
            }
            setCheckins((data || []).map(withCheckinTotals))
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro desconhecido'
            console.error('Audit Error [useMyCheckins]: fetch fail ->', message)
            setError('Não foi possível carregar o histórico de lançamentos.')
            setCheckins([])
        } finally {
            setLoading(false)
        }
    }, [profile, storeId])

    useEffect(() => { fetch() }, [fetch])
    return { checkins, loading, error, refetch: fetch }
}

/**
 * Hook para buscar lançamentos de uma loja em um intervalo de datas (scope daily).
 */
export function useCheckinsByDateRange(storeId: string | null, startDate: string, endDate: string) {
    const [checkins, setCheckins] = useState<CheckinWithTotals[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetch = useCallback(async () => {
        if (!storeId) {
            setCheckins([])
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            let data: DailyCheckin[] | null = null
            if (isLancamentosViaRpcEnabled()) {
                const { data: rpcData, error: rpcErr } = await supabase.rpc('get_lancamentos_por_loja_periodo', {
                    p_store_id: storeId,
                    p_start_date: startDate,
                    p_end_date: endDate,
                    p_scope: 'daily',
                })
                if (rpcErr) throw rpcErr
                data = (rpcData as DailyCheckin[] | null) || []
            } else {
                const { data: rows, error: queryError } = await supabase
                    .from('lancamentos_diarios')
                    .select(CHECKIN_SELECT)
                    .eq('store_id', storeId)
                    .eq('metric_scope', 'daily')
                    .gte('reference_date', startDate)
                    .lte('reference_date', endDate)
                    .order('reference_date', { ascending: false })

                if (queryError) throw queryError
                data = (rows as DailyCheckin[] | null) || []
            }
            setCheckins((data || []).map(withCheckinTotals))
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro desconhecido'
            console.error('Audit Error [useCheckinsByDateRange]: fetch fail ->', message)
            setError('Não foi possível carregar os lançamentos do período.')
            setCheckins([])
        } finally {
            setLoading(false)
        }
    }, [storeId, startDate, endDate])

    useEffect(() => { fetch() }, [fetch])
    return { checkins, loading, error, refetch: fetch }
}

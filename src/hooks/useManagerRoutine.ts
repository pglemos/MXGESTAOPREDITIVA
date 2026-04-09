import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { ManagerRoutineLog, RankingEntry } from '@/types/database'

export type RoutineRankingSnapshot = Pick<RankingEntry, 'user_id' | 'user_name' | 'position' | 'vnd_total' | 'meta' | 'atingimento'>

interface RegisterRoutinePayload {
    reference_date: string
    checkins_pending_count: number
    sem_registro_count?: number
    agd_cart_today?: number
    agd_net_today?: number
    previous_day_leads?: number
    previous_day_sales?: number
    ranking_snapshot?: RoutineRankingSnapshot[]
    notes?: string
}

export function useManagerRoutine(storeIdOverride?: string) {
    const { profile, storeId: authStoreId } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const routineDate = format(new Date(), 'yyyy-MM-dd')
    const [routineLog, setRoutineLog] = useState<ManagerRoutineLog | null>(null)
    const [history, setHistory] = useState<ManagerRoutineLog[]>([])
    const [loading, setLoading] = useState(true)

    const fetchRoutineLogs = useCallback(async () => {
        if (!storeId) {
            setRoutineLog(null)
            setHistory([])
            setLoading(false)
            return
        }

        setLoading(true)
        const { data } = await supabase
            .from('manager_routine_logs')
            .select('*')
            .eq('store_id', storeId)
            .order('routine_date', { ascending: false })
            .limit(7)

        const logs = (data || []) as ManagerRoutineLog[]
        setHistory(logs)
        setRoutineLog(logs.find(log => log.routine_date === routineDate) || null)
        setLoading(false)
    }, [storeId, routineDate])

    const registerRoutine = async (payload: RegisterRoutinePayload): Promise<{ error: string | null }> => {
        if (!profile || !storeId) return { error: 'Usuario ou loja nao encontrados para registrar rotina.' }

        const { data, error } = await supabase
            .from('manager_routine_logs')
            .upsert({
                store_id: storeId,
                manager_id: profile.id,
                routine_date: routineDate,
                reference_date: payload.reference_date,
                checkins_pending_count: payload.checkins_pending_count,
                sem_registro_count: payload.sem_registro_count ?? 0,
                agd_cart_today: payload.agd_cart_today ?? 0,
                agd_net_today: payload.agd_net_today ?? 0,
                previous_day_leads: payload.previous_day_leads ?? 0,
                previous_day_sales: payload.previous_day_sales ?? 0,
                ranking_snapshot: payload.ranking_snapshot ?? [],
                notes: payload.notes?.trim() || null,
                status: 'completed',
                executed_at: new Date().toISOString(),
            }, { onConflict: 'store_id,manager_id,routine_date' })
            .select('*')
            .single()

        if (error) return { error: error.message }

        setRoutineLog(data as ManagerRoutineLog)
        await fetchRoutineLogs()
        return { error: null }
    }

    useEffect(() => { fetchRoutineLogs() }, [fetchRoutineLogs])

    return { routineLog, history, loading, routineDate, fetchRoutineLogs, registerRoutine }
}

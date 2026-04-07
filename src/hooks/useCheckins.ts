import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { DailyCheckin, CheckinFormData, CheckinWithTotals } from '@/types/database'
import { calcularTotais } from '@/lib/calculations'

export const CHECKIN_DEADLINE_MINUTES = 9 * 60 + 30
export const CHECKIN_EDIT_LIMIT_MINUTES = 9 * 60 + 45
export const CHECKIN_DEADLINE_LABEL = '09:30'
export const CHECKIN_EDIT_LIMIT_LABEL = '09:45'

function minutesSinceStartOfDay(date: Date) {
    return date.getHours() * 60 + date.getMinutes()
}

// Regra MX: envio acontece hoje, mas a produção declarada se refere sempre ao dia anterior.
export function calculateReferenceDate(baseDate = new Date()): string {
    const refDate = new Date(baseDate)
    refDate.setDate(baseDate.getDate() - 1)
    return refDate.toISOString().split('T')[0]
}

export function isCheckinLate(baseDate = new Date()): boolean {
    return minutesSinceStartOfDay(baseDate) > CHECKIN_DEADLINE_MINUTES
}

export function canEditCurrentCheckin(baseDate = new Date()): boolean {
    return minutesSinceStartOfDay(baseDate) <= CHECKIN_EDIT_LIMIT_MINUTES
}

export function getCheckinEditLockedAt(baseDate = new Date()): string {
    const refDate = new Date(baseDate)
    refDate.setHours(9, 45, 0, 0)
    return refDate.toISOString()
}

export function useCheckins(storeIdOverride?: string) {
    const { profile, storeId: authStoreId } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [checkins, setCheckins] = useState<CheckinWithTotals[]>([])
    const [loading, setLoading] = useState(true)
    const [todayCheckin, setTodayCheckin] = useState<CheckinWithTotals | null>(null)

    const referenceDate = calculateReferenceDate()

    const fetchCheckins = useCallback(async (filters?: { startDate?: string; endDate?: string; userId?: string }) => {
        if (!storeId) {
            setCheckins([])
            setLoading(false)
            return
        }
        setLoading(true)

        let query = supabase.from('daily_checkins')
            .select('*')
            .eq('store_id', storeId)
            .order('reference_date', { ascending: false })

        if (filters?.startDate) query = query.gte('reference_date', filters.startDate)
        if (filters?.endDate) query = query.lte('reference_date', filters.endDate)
        if (filters?.userId) query = query.eq('seller_user_id', filters.userId)

        const { data, error } = await query
        if (!error && data) {
            const withTotals = data.map(c => ({ ...c, ...calcularTotais(c) }))
            setCheckins(withTotals)
        }
        setLoading(false)
    }, [storeId])

    const fetchTodayCheckin = useCallback(async () => {
        if (!profile || !storeId) {
            setTodayCheckin(null)
            return
        }
        const { data } = await supabase
            .from('daily_checkins')
            .select('*')
            .eq('seller_user_id', profile.id)
            .eq('store_id', storeId)
            .eq('reference_date', referenceDate)
            .maybeSingle()
        
        if (data) setTodayCheckin({ ...data, ...calcularTotais(data) })
        else setTodayCheckin(null)
    }, [profile, storeId, referenceDate])

    const saveCheckin = async (formData: CheckinFormData): Promise<{ error: string | null }> => {
        if (!profile || !storeId) return { error: 'Usuário não autenticado' }
        if (todayCheckin && !canEditCurrentCheckin()) {
            return { error: `Correções do check-in ficam disponíveis somente até ${CHECKIN_EDIT_LIMIT_LABEL}.` }
        }

        const submittedAt = new Date()
        const payload = {
            seller_user_id: profile.id,
            store_id: storeId,
            reference_date: referenceDate,
            submitted_at: submittedAt.toISOString(),
            metric_scope: 'daily',
            submitted_late: isCheckinLate(submittedAt),
            submission_status: isCheckinLate(submittedAt) ? 'late' : 'on_time',
            edit_locked_at: getCheckinEditLockedAt(submittedAt),
            leads_prev_day: formData.leads,
            agd_cart_prev_day: formData.agd_cart_prev,
            agd_net_prev_day: formData.agd_net_prev,
            agd_cart_today: formData.agd_cart,
            agd_net_today: formData.agd_net,
            vnd_porta_prev_day: formData.vnd_porta,
            vnd_cart_prev_day: formData.vnd_cart,
            vnd_net_prev_day: formData.vnd_net,
            visit_prev_day: formData.visitas,
            zero_reason: formData.zero_reason || null,
            note: formData.note || null,
        }

        const { error } = todayCheckin
            ? await supabase.from('daily_checkins').update(payload).eq('id', todayCheckin.id)
            : await supabase.from('daily_checkins').insert(payload)

        if (error) return { error: error.message }
        await fetchTodayCheckin()
        return { error: null }
    }

    useEffect(() => { fetchCheckins() }, [fetchCheckins])
    useEffect(() => { fetchTodayCheckin() }, [fetchTodayCheckin])

    return { checkins, todayCheckin, loading, fetchCheckins, fetchTodayCheckin, saveCheckin, referenceDate }
}


export function useMyCheckins() {
    const { profile, storeId } = useAuth()
    const [checkins, setCheckins] = useState<CheckinWithTotals[]>([])
    const [loading, setLoading] = useState(true)

    const fetch = useCallback(async (filters?: { startDate?: string; endDate?: string }) => {
        if (!profile || !storeId) {
            setCheckins([])
            setLoading(false)
            return
        }
        setLoading(true)
        let query = supabase.from('daily_checkins').select('*')
            .eq('seller_user_id', profile.id).eq('store_id', storeId).order('reference_date', { ascending: false })
        if (filters?.startDate) query = query.gte('reference_date', filters.startDate)
        if (filters?.endDate) query = query.lte('reference_date', filters.endDate)
        const { data } = await query
        if (data) setCheckins(data.map(c => ({ ...c, ...calcularTotais(c) })))
        setLoading(false)
    }, [profile, storeId])

    useEffect(() => { fetch() }, [fetch])
    return { checkins, loading, refetch: fetch }
}

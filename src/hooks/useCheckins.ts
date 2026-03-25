import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { DailyCheckin, CheckinFormData, CheckinWithTotals } from '@/types/database'
import { calcularTotais } from '@/lib/calculations'

export function useCheckins(storeIdOverride?: string) {
    const { profile, storeId: authStoreId } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [checkins, setCheckins] = useState<CheckinWithTotals[]>([])
    const [loading, setLoading] = useState(true)
    const [todayCheckin, setTodayCheckin] = useState<CheckinWithTotals | null>(null)

    const today = new Date().toISOString().split('T')[0]

    const fetchCheckins = useCallback(async (filters?: { startDate?: string; endDate?: string; userId?: string }) => {
        if (!storeId) {
            setCheckins([])
            setLoading(false)
            return
        }
        setLoading(true)

        let query = supabase.from('daily_checkins').select('*').eq('store_id', storeId).order('date', { ascending: false })

        if (filters?.startDate) query = query.gte('date', filters.startDate)
        if (filters?.endDate) query = query.lte('date', filters.endDate)
        if (filters?.userId) query = query.eq('user_id', filters.userId)

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
            .eq('user_id', profile.id)
            .eq('store_id', storeId)
            .eq('date', today)
            .single()
        if (data) setTodayCheckin({ ...data, ...calcularTotais(data) })
        else setTodayCheckin(null)
    }, [profile, storeId, today])

    const saveCheckin = async (formData: CheckinFormData): Promise<{ error: string | null }> => {
        if (!profile || !storeId) return { error: 'Usuário não autenticado' }

        const payload = {
            user_id: profile.id,
            store_id: storeId,
            date: today,
            leads: formData.leads,
            agd_cart: formData.agd_cart,
            agd_net: formData.agd_net,
            vnd_porta: formData.vnd_porta,
            vnd_cart: formData.vnd_cart,
            vnd_net: formData.vnd_net,
            visitas: formData.visitas,
            note: formData.note || null,
            zero_reason: formData.zero_reason || null,
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

    return { checkins, todayCheckin, loading, fetchCheckins, fetchTodayCheckin, saveCheckin }
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
            .eq('user_id', profile.id).eq('store_id', storeId).order('date', { ascending: false })
        if (filters?.startDate) query = query.gte('date', filters.startDate)
        if (filters?.endDate) query = query.lte('date', filters.endDate)
        const { data } = await query
        if (data) setCheckins(data.map(c => ({ ...c, ...calcularTotais(c) })))
        setLoading(false)
    }, [profile, storeId])

    useEffect(() => { fetch() }, [fetch])
    return { checkins, loading, refetch: fetch }
}

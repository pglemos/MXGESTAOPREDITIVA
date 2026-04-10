import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { calculateReferenceDate } from '@/hooks/useCheckins'
import type { User } from '@/types/database'

export function useTeam(storeIdOverride?: string) {
    const { storeId: authStoreId } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [sellers, setSellers] = useState<(User & { checkin_today: boolean; started_at?: string; ended_at?: string; is_active?: boolean; closing_month_grace?: boolean })[]>([])
    const [loading, setLoading] = useState(true)

    const referenceDate = calculateReferenceDate()

    const fetchTeam = useCallback(async () => {
        if (!storeId) {
            setSellers([])
            setLoading(false)
            return
        }
        setLoading(true)

        const { data: tenures } = await supabase
            .from('store_sellers')
            .select('seller_user_id, started_at, ended_at, is_active, closing_month_grace, users:seller_user_id(*)')
            .eq('store_id', storeId)

        const { data: fallbackMembers } = (!tenures || tenures.length === 0)
            ? await supabase
                .from('memberships')
                .select('user_id, role, users(*)')
                .eq('store_id', storeId)
                .eq('role', 'vendedor')
            : { data: null }

        const { data: todayCheckins } = await supabase
            .from('daily_checkins')
            .select('seller_user_id')
            .eq('store_id', storeId)
            .eq('reference_date', referenceDate)

        const checkedIn = new Set((todayCheckins || []).map(c => c.seller_user_id))
        const sourceRows = (tenures && tenures.length > 0)
            ? tenures.map((item: any) => ({ 
                user_id: item.seller_user_id, 
                users: item.users,
                tenure: {
                    started_at: item.started_at,
                    ended_at: item.ended_at,
                    is_active: item.is_active,
                    closing_month_grace: item.closing_month_grace
                }
            }))
            : (fallbackMembers || [])

        if (sourceRows) {
            setSellers(sourceRows.map((m: any) => ({
                ...m.users,
                checkin_today: checkedIn.has(m.user_id),
                started_at: m.tenure?.started_at,
                ended_at: m.tenure?.ended_at,
                is_active: m.tenure?.is_active ?? m.users?.active ?? true,
                closing_month_grace: m.tenure?.closing_month_grace ?? false,
            })))
        }
        setLoading(false)
    }, [storeId, referenceDate])

    const updateVigencia = async (userId: string, data: any) => {
        if (!storeId) return { error: 'Loja não identificada' }
        const { error } = await supabase.from('store_sellers').upsert({
            store_id: storeId,
            seller_user_id: userId,
            ...data
        }, { onConflict: 'store_id, seller_user_id' })
        if (!error) await fetchTeam()
        return { error: error?.message || null }
    }

    useEffect(() => { fetchTeam() }, [fetchTeam])
    return { 
        sellers, 
        team: sellers, // Alias para consistência MX
        loading, 
        refetch: fetchTeam,
        updateVigencia 
    }
}

export function useStores() {
    const { role, memberships, storeId } = useAuth()
    const [stores, setStores] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchStores = useCallback(async () => {
        setLoading(true)
        let query = supabase.from('stores').select('*').eq('active', true).order('name')
        if (role === 'dono') {
            const storeIds = memberships.map(m => m.store_id)
            if (!storeIds.length) {
                setStores([])
                setLoading(false)
                return
            }
            query = query.in('id', storeIds)
        } else if ((role === 'gerente' || role === 'vendedor') && storeId) {
            query = query.eq('id', storeId)
        }
        const { data } = await query
        if (data) {
            console.log('DEBUG: Stores from useStores:', data.length, data.map(s => s.name));
            setStores(data)
        }
        setLoading(false)
    }, [role, memberships, storeId])

    const createStore = async (name: string, managerEmail?: string) => {
        if (role !== 'admin') return { error: 'Apenas admin pode criar lojas.' }
        const { data: store, error } = await supabase
            .from('stores')
            .insert({ name, manager_email: managerEmail || null })
            .select('id')
            .single()

        if (error) return { error: error.message }

        if (store?.id) {
            const recipients = managerEmail ? [managerEmail] : []
            const { error: deliveryError } = await supabase.from('store_delivery_rules').upsert({
                store_id: store.id,
                matinal_recipients: recipients,
                weekly_recipients: recipients,
                monthly_recipients: recipients,
                timezone: 'America/Sao_Paulo',
                active: true,
            }, { onConflict: 'store_id' })

            if (deliveryError) return { error: deliveryError.message }
        }

        await fetchStores()
        return { error: null }
    }

    const updateStore = async (id: string, updates: { name?: string; manager_email?: string; active?: boolean }) => {
        if (role !== 'admin') return { error: 'Apenas admin pode editar lojas.' }
        const { error } = await supabase.from('stores').update(updates).eq('id', id)
        if (error) return { error: error.message }

        if (typeof updates.manager_email !== 'undefined') {
            const recipients = updates.manager_email ? [updates.manager_email] : []
            const { error: deliveryError } = await supabase.from('store_delivery_rules').upsert({
                store_id: id,
                matinal_recipients: recipients,
                weekly_recipients: recipients,
                monthly_recipients: recipients,
                timezone: 'America/Sao_Paulo',
                active: true,
            }, { onConflict: 'store_id' })

            if (deliveryError) return { error: deliveryError.message }
        }

        await fetchStores()
        return { error: null }
    }

    useEffect(() => { fetchStores() }, [fetchStores])
    return { stores, loading, createStore, updateStore, refetch: fetchStores }
}

export function useMemberships() {
    const { role } = useAuth()
    const [memberships, setMemberships] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetch = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase.from('memberships').select('*, store:store_id(name)')
        if (data) setMemberships(data)
        setLoading(false)
    }, [])

    useEffect(() => { fetch() }, [fetch])
    return { memberships, loading, refetch: fetch }
}

export function useStoresStats() {
    const { role, memberships, storeId: authStoreId } = useAuth()
    const [stats, setStats] = useState<Record<string, { sellers: number; checkedIn: number; disciplinePct: number }>>({})
    const [loading, setLoading] = useState(true)
    const referenceDate = calculateReferenceDate()

    const fetchStats = useCallback(async () => {
        setLoading(true)
        try {
            let authorizedStoreIds: string[] | null = null
            if (role === 'dono') {
                authorizedStoreIds = memberships.map(m => m.store_id)
            } else if ((role === 'gerente' || role === 'vendedor') && authStoreId) {
                authorizedStoreIds = [authStoreId]
            }

            let sellersQuery = supabase.from('store_sellers').select('store_id').eq('is_active', true)
            let checkinsQuery = supabase.from('daily_checkins').select('store_id').eq('reference_date', referenceDate)

            if (authorizedStoreIds) {
                sellersQuery = sellersQuery.in('store_id', authorizedStoreIds)
                checkinsQuery = checkinsQuery.in('store_id', authorizedStoreIds)
            }

            const [sellersRes, checkinsRes] = await Promise.all([
                sellersQuery,
                checkinsQuery
            ])

            const newStats: Record<string, { sellers: number; checkedIn: number; disciplinePct: number }> = {}

            if (sellersRes.data) {
                sellersRes.data.forEach((s: any) => {
                    if (!newStats[s.store_id]) newStats[s.store_id] = { sellers: 0, checkedIn: 0, disciplinePct: 0 }
                    newStats[s.store_id].sellers++
                })
            }

            if (checkinsRes.data) {
                checkinsRes.data.forEach((c: any) => {
                    if (!newStats[c.store_id]) newStats[c.store_id] = { sellers: 0, checkedIn: 0, disciplinePct: 0 }
                    newStats[c.store_id].checkedIn++
                })
            }

            Object.keys(newStats).forEach(sid => {
                const s = newStats[sid]
                s.disciplinePct = s.sellers > 0 ? Math.round((s.checkedIn / s.sellers) * 100) : 100
            })

            setStats(newStats)
        } catch (err) {
            console.error('Error fetching stores stats:', err)
        } finally {
            setLoading(false)
        }
    }, [referenceDate, role, memberships, authStoreId])

    useEffect(() => { fetchStats() }, [fetchStats])

    return { stats, loading, refetch: fetchStats }
}

export function useSellersByStore(storeId: string | null) {
    const [sellers, setSellers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const referenceDate = calculateReferenceDate()

    const fetch = useCallback(async () => {
        if (!storeId) {
            setSellers([])
            setLoading(false)
            return
        }
        setLoading(true)
        const { data: sellersData } = await supabase
            .from('store_sellers')
            .select('*, users:seller_user_id(*)')
            .eq('store_id', storeId)
            .eq('is_active', true)

        const { data: checkins } = await supabase
            .from('daily_checkins')
            .select('seller_user_id')
            .eq('store_id', storeId)
            .eq('reference_date', referenceDate)

        const checkedIn = new Set(checkins?.map(c => c.seller_user_id) || [])

        if (sellersData) {
            setSellers(sellersData.map((s: any) => ({
                ...s.users,
                checkin_today: checkedIn.has(s.seller_user_id)
            })))
        }
        setLoading(false)
    }, [storeId, referenceDate])

    useEffect(() => { fetch() }, [fetch])
    return { sellers, loading, refetch: fetch }
}

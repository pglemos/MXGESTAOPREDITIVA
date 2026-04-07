import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { calculateReferenceDate } from '@/hooks/useCheckins'
import type { User } from '@/types/database'

export function useTeam(storeIdOverride?: string) {
    const { storeId: authStoreId } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [sellers, setSellers] = useState<(User & { checkin_today: boolean })[]>([])
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
            .select('seller_user_id, users:seller_user_id(*)')
            .eq('store_id', storeId)
            .eq('is_active', true)

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
            ? tenures.map((item: any) => ({ user_id: item.seller_user_id, users: item.users }))
            : (fallbackMembers || [])

        if (sourceRows) {
            setSellers(sourceRows.map((m: any) => ({
                ...m.users,
                checkin_today: checkedIn.has(m.user_id),
            })))
        }
        setLoading(false)
    }, [storeId, referenceDate])

    useEffect(() => { fetchTeam() }, [fetchTeam])
    return { sellers, loading, refetch: fetchTeam }
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
        if (data) setStores(data)
        setLoading(false)
    }, [role, memberships, storeId])

    const createStore = async (name: string, managerEmail?: string) => {
        if (role !== 'admin') return { error: 'Apenas admin pode criar lojas.' }
        const { error } = await supabase.from('stores').insert({ name, manager_email: managerEmail || null })
        if (!error) await fetchStores()
        return { error: error?.message || null }
    }

    const updateStore = async (id: string, updates: { name?: string; manager_email?: string; active?: boolean }) => {
        if (role !== 'admin') return { error: 'Apenas admin pode editar lojas.' }
        const { error } = await supabase.from('stores').update(updates).eq('id', id)
        if (!error) await fetchStores()
        return { error: error?.message || null }
    }

    useEffect(() => { fetchStores() }, [fetchStores])
    return { stores, loading, createStore, updateStore, refetch: fetchStores }
}

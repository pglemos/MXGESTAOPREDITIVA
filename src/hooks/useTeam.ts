import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { User } from '@/types/database'

export function useTeam(storeIdOverride?: string) {
    const { storeId: authStoreId } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [sellers, setSellers] = useState<(User & { checkin_today: boolean })[]>([])
    const [loading, setLoading] = useState(true)

    const today = new Date().toISOString().split('T')[0]

    const fetchTeam = useCallback(async () => {
        if (!storeId) return
        setLoading(true)

        const { data: members } = await supabase
            .from('memberships')
            .select('user_id, role, users(*)')
            .eq('store_id', storeId)
            .eq('role', 'vendedor')

        const { data: todayCheckins } = await supabase
            .from('daily_checkins')
            .select('user_id')
            .eq('store_id', storeId)
            .eq('date', today)

        const checkedIn = new Set((todayCheckins || []).map(c => c.user_id))

        if (members) {
            setSellers(members.map((m: any) => ({
                ...m.users,
                checkin_today: checkedIn.has(m.user_id),
            })))
        }
        setLoading(false)
    }, [storeId, today])

    useEffect(() => { fetchTeam() }, [fetchTeam])
    return { sellers, loading, refetch: fetchTeam }
}

export function useStores() {
    const [stores, setStores] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchStores = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase.from('stores').select('*').eq('active', true).order('name')
        if (data) setStores(data)
        setLoading(false)
    }, [])

    const createStore = async (name: string, managerEmail?: string) => {
        const { error } = await supabase.from('stores').insert({ name, manager_email: managerEmail || null })
        if (!error) await fetchStores()
        return { error: error?.message || null }
    }

    const updateStore = async (id: string, updates: { name?: string; manager_email?: string; active?: boolean }) => {
        const { error } = await supabase.from('stores').update(updates).eq('id', id)
        if (!error) await fetchStores()
        return { error: error?.message || null }
    }

    useEffect(() => { fetchStores() }, [fetchStores])
    return { stores, loading, createStore, updateStore, refetch: fetchStores }
}

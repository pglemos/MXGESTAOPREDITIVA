import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Goal, GoalFormData } from '@/types/database'

export function useGoals(storeIdOverride?: string) {
    const { storeId: authStoreId, role } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [storeGoal, setStoreGoal] = useState<Goal | null>(null)
    const [sellerGoals, setSellerGoals] = useState<Goal[]>([])
    const [loading, setLoading] = useState(true)

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const fetchGoals = useCallback(async () => {
        if (!storeId) {
            setStoreGoal(null)
            setSellerGoals([])
            setLoading(false)
            return
        }
        setLoading(true)
        const { data } = await supabase
            .from('goals')
            .select('*')
            .eq('store_id', storeId)
            .eq('month', currentMonth)
            .eq('year', currentYear)

        if (data) {
            setStoreGoal(data.find(g => g.user_id === null) || null)
            setSellerGoals(data.filter(g => g.user_id !== null))
        }
        setLoading(false)
    }, [storeId, currentMonth, currentYear])

    const upsertGoal = async (formData: GoalFormData): Promise<{ error: string | null }> => {
        const { error } = await supabase.from('goals').upsert({
            store_id: formData.store_id,
            user_id: formData.user_id,
            month: formData.month,
            year: formData.year,
            target: formData.target,
        }, { onConflict: 'store_id,user_id,month,year', ignoreDuplicates: false })
        if (error) return { error: error.message }
        await fetchGoals()
        return { error: null }
    }

    useEffect(() => { fetchGoals() }, [fetchGoals])
    return { storeGoal, sellerGoals, loading, fetchGoals, upsertGoal, currentMonth, currentYear }
}

export function useAllStoreGoals() {
    const [goals, setGoals] = useState<(Goal & { store_name?: string })[]>([])
    const [loading, setLoading] = useState(true)
    const now = new Date()

    useEffect(() => {
        async function fetch() {
            const { data } = await supabase
                .from('goals')
                .select('*, stores(name)')
                .is('user_id', null)
                .eq('month', now.getMonth() + 1)
                .eq('year', now.getFullYear())
            if (data) setGoals(data.map((g: any) => ({ ...g, store_name: g.stores?.name })))
            setLoading(false)
        }
        fetch()
    }, [])

    return { goals, loading }
}

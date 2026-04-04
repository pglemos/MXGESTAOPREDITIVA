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
    const [benchmarks, setBenchmarks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const now = new Date()

    const fetchData = useCallback(async () => {
        setLoading(true)
        const [goalsRes, benchRes] = await Promise.all([
            supabase.from('goals').select('*, stores(name)').is('user_id', null).eq('month', now.getMonth() + 1).eq('year', now.getFullYear()),
            supabase.from('store_benchmarks').select('*')
        ])
        
        if (goalsRes.data) setGoals(goalsRes.data.map((g: any) => ({ ...g, store_name: g.stores?.name })))
        if (benchRes.data) setBenchmarks(benchRes.data)
        setLoading(false)
    }, [now.getMonth(), now.getFullYear()])

    const updateGoal = async (storeId: string, target: number) => {
        const { error } = await supabase.from('goals').upsert({
            store_id: storeId,
            user_id: null,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            target
        }, { onConflict: 'store_id,user_id,month,year' })
        if (!error) await fetchData()
        return { error: error?.message || null }
    }

    const updateBenchmark = async (storeId: string, data: any) => {
        const { error } = await supabase.from('store_benchmarks').upsert({
            store_id: storeId,
            ...data
        }, { onConflict: 'store_id' })
        if (!error) await fetchData()
        return { error: error?.message || null }
    }

    useEffect(() => { fetchData() }, [fetchData])

    return { goals, benchmarks, loading, updateGoal, updateBenchmark, refetch: fetchData }
}

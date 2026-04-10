import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { StoreMetaRules } from '@/types/database'

export function useGoals(storeIdOverride?: string) {
    const { storeId: authStoreId } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [storeGoal, setStoreGoal] = useState<{ target: number } | null>(null)
    const [loading, setLoading] = useState(true)

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const fetchGoals = useCallback(async () => {
        if (!storeId) {
            setStoreGoal(null)
            setLoading(false)
            return
        }
        setLoading(true)
        const { data } = await supabase
            .from('store_meta_rules')
            .select('monthly_goal')
            .eq('store_id', storeId)
            .maybeSingle()

        if (data) {
            setStoreGoal({ target: data.monthly_goal || 0 })
        } else {
            setStoreGoal({ target: 0 })
        }
        setLoading(false)
    }, [storeId])

    const upsertGoal = async (formData: { store_id: string; target: number }): Promise<{ error: string | null }> => {
        const { error } = await supabase.from('store_meta_rules').upsert({
            store_id: formData.store_id,
            monthly_goal: formData.target,
        }, { onConflict: 'store_id' })
        if (error) return { error: error.message }
        await fetchGoals()
        return { error: null }
    }

    useEffect(() => { fetchGoals() }, [fetchGoals])
    return { storeGoal, sellerGoals: [], loading, fetchGoals, upsertGoal, currentMonth, currentYear }
}

export function useAllStoreGoals() {
    const [goals, setGoals] = useState<{ store_id: string, target: number, store_name?: string }[]>([])
    const [benchmarks, setBenchmarks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        setLoading(true)
        const [goalsRes, benchRes] = await Promise.all([
            supabase.from('store_meta_rules').select('store_id, monthly_goal, stores(name)'),
            supabase.from('store_benchmarks').select('*')
        ])
        
        if (goalsRes.data) {
            setGoals(goalsRes.data.map((g: any) => ({
                store_id: g.store_id,
                target: g.monthly_goal,
                store_name: g.stores?.name
            })))
        }
        if (benchRes.data) setBenchmarks(benchRes.data)
        setLoading(false)
    }, [])

    const updateGoal = async (storeId: string, target: number) => {
        const { error } = await supabase.from('store_meta_rules').upsert({
            store_id: storeId,
            monthly_goal: target
        }, { onConflict: 'store_id' })
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

export function useStoreMetaRules(storeIdOverride?: string) {
    const { storeId: authStoreId } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [metaRules, setMetaRules] = useState<StoreMetaRules | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchMetaRules = useCallback(async () => {
        if (!storeId) {
            setMetaRules(null)
            setLoading(false)
            return
        }
        setLoading(true)
        const { data } = await supabase
            .from('store_meta_rules')
            .select('*')
            .eq('store_id', storeId)
            .maybeSingle()

        setMetaRules((data as StoreMetaRules) || null)
        setLoading(false)
    }, [storeId])

    const updateMetaRules = async (data: Partial<StoreMetaRules>) => {
        if (!storeId) return { error: 'Loja não selecionada' }
        const { error } = await supabase.from('store_meta_rules').upsert({
            store_id: storeId,
            ...data
        }, { onConflict: 'store_id' })
        if (!error) await fetchMetaRules()
        return { error: error?.message || null }
    }

    useEffect(() => { fetchMetaRules() }, [fetchMetaRules])

    return { metaRules, loading, fetchMetaRules, updateMetaRules }
}

export function useStoreGoal(storeIdOverride?: string | null) {
    const { storeId: authStoreId } = useAuth()
    const storeId = storeIdOverride !== undefined ? storeIdOverride : authStoreId
    const [goal, setGoal] = useState<{ target: number } | null>(null)
    const [loading, setLoading] = useState(true)

    const fetch = useCallback(async () => {
        if (!storeId) {
            setGoal(null)
            setLoading(false)
            return
        }
        setLoading(true)
        const { data } = await supabase
            .from('store_meta_rules')
            .select('monthly_goal')
            .eq('store_id', storeId)
            .maybeSingle()

        if (data) setGoal({ target: data.monthly_goal || 0 })
        else setGoal({ target: 0 })
        setLoading(false)
    }, [storeId])

    const updateGoal = async (target: number) => {
        const finalStoreId = storeId
        if (!finalStoreId) return { error: 'Loja não selecionada' }
        const { error } = await supabase.from('store_meta_rules').upsert({
            store_id: finalStoreId,
            monthly_goal: target
        }, { onConflict: 'store_id' })
        if (!error) await fetch()
        return { error: error?.message || null }
    }

    useEffect(() => { fetch() }, [fetch])
    return { goal, loading, refetch: fetch, updateGoal }
}

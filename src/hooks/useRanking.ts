import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { RankingEntry } from '@/types/database'
import { calcularAtingimento } from '@/lib/calculations'

export function useRanking(storeIdOverride?: string) {
    const { storeId: authStoreId } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [ranking, setRanking] = useState<RankingEntry[]>([])
    const [loading, setLoading] = useState(true)

    const now = new Date()
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`

    const fetchRanking = useCallback(async () => {
        if (!storeId) {
            setRanking([])
            setLoading(false)
            return
        }
        setLoading(true)

        // Get checkins for the month
        const { data: checkins } = await supabase
            .from('daily_checkins')
            .select('user_id, leads, agd_cart, agd_net, vnd_porta, vnd_cart, vnd_net, visitas')
            .eq('store_id', storeId)
            .gte('date', startOfMonth)
            .lte('date', endOfMonth)

        // Get users for this store
        const { data: members } = await supabase
            .from('memberships')
            .select('user_id, users(name)')
            .eq('store_id', storeId)
            .eq('role', 'vendedor')

        // Get goals for sellers
        const { data: goals } = await supabase
            .from('goals')
            .select('user_id, target')
            .eq('store_id', storeId)
            .eq('month', now.getMonth() + 1)
            .eq('year', now.getFullYear())
            .not('user_id', 'is', null)

        if (!checkins || !members) { setLoading(false); return }

        // Aggregate per seller
        const goalsMap = new Map((goals || []).map(g => [g.user_id, g.target]))
        const aggregated = new Map<string, { leads: number; agd: number; visitas: number; vnd: number; name: string }>()

        for (const m of members) {
            const user = (m as any).users
            aggregated.set(m.user_id, { leads: 0, agd: 0, visitas: 0, vnd: 0, name: user?.name || 'Vendedor' })
        }

        for (const c of checkins) {
            const current = aggregated.get(c.user_id)
            if (current) {
                current.leads += c.leads || 0
                current.agd += (c.agd_cart || 0) + (c.agd_net || 0)
                current.visitas += c.visitas || 0
                current.vnd += (c.vnd_porta || 0) + (c.vnd_cart || 0) + (c.vnd_net || 0)
            }
        }

        const entries: RankingEntry[] = Array.from(aggregated.entries())
            .map(([userId, data]) => ({
                user_id: userId,
                user_name: data.name,
                vnd_total: data.vnd,
                leads: data.leads,
                agd_total: data.agd,
                visitas: data.visitas,
                meta: goalsMap.get(userId) || 0,
                atingimento: calcularAtingimento(data.vnd, goalsMap.get(userId) || 0),
                position: 0,
            }))
            .sort((a, b) => b.vnd_total - a.vnd_total)
            .map((e, i) => ({ ...e, position: i + 1 }))

        setRanking(entries)
        setLoading(false)
    }, [storeId, startOfMonth, endOfMonth])

    useEffect(() => { fetchRanking() }, [fetchRanking])
    return { ranking, loading, refetch: fetchRanking }
}

export function useGlobalRanking() {
    const [ranking, setRanking] = useState<RankingEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetch() {
            const now = new Date()
            const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

            const { data: checkins } = await supabase
                .from('daily_checkins')
                .select('user_id, store_id, vnd_porta, vnd_cart, vnd_net, leads, agd_cart, agd_net, visitas')
                .gte('date', startOfMonth)

            const { data: members } = await supabase
                .from('memberships')
                .select('user_id, store_id, users(name), stores(name)')
                .eq('role', 'vendedor')

            if (!checkins || !members) { setLoading(false); return }

            const agg = new Map<string, { vnd: number; leads: number; agd: number; vis: number; name: string; store: string }>()
            for (const m of members) {
                agg.set(m.user_id, { vnd: 0, leads: 0, agd: 0, vis: 0, name: (m as any).users?.name || '', store: (m as any).stores?.name || '' })
            }
            for (const c of checkins) {
                const cur = agg.get(c.user_id)
                if (cur) {
                    cur.vnd += (c.vnd_porta || 0) + (c.vnd_cart || 0) + (c.vnd_net || 0)
                    cur.leads += c.leads || 0
                    cur.agd += (c.agd_cart || 0) + (c.agd_net || 0)
                    cur.vis += c.visitas || 0
                }
            }

            const entries = Array.from(agg.entries())
                .map(([uid, d]) => ({ user_id: uid, user_name: d.name, store_name: d.store, vnd_total: d.vnd, leads: d.leads, agd_total: d.agd, visitas: d.vis, meta: 0, atingimento: 0, position: 0 }))
                .sort((a, b) => b.vnd_total - a.vnd_total)
                .map((e, i) => ({ ...e, position: i + 1 }))

            setRanking(entries)
            setLoading(false)
        }
        fetch()
    }, [])

    return { ranking, loading }
}

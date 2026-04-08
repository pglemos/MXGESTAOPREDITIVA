import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { RankingEntry } from '@/types/database'
import { calcularAtingimento } from '@/lib/calculations'

export function useRanking(storeIdOverride?: string, filters?: { startDate?: string; endDate?: string }) {
    const { storeId: authStoreId } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [ranking, setRanking] = useState<RankingEntry[]>([])
    const [loading, setLoading] = useState(true)

    const now = new Date()
    const defaultStartOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const defaultEndOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`

    const startDate = filters?.startDate || defaultStartOfMonth
    const endDate = filters?.endDate || defaultEndOfMonth

    const fetchRanking = useCallback(async () => {
        if (!storeId) {
            setRanking([])
            setLoading(false)
            return
        }
        setLoading(true)

        // Get checkins for the month using canonical EPIC-01 columns
        const { data: checkins } = await supabase
            .from('daily_checkins')
            .select('seller_user_id, leads_prev_day, agd_cart_today, agd_net_today, vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day, visit_prev_day')
            .eq('store_id', storeId)
            .eq('metric_scope', 'daily') // Garante que apenas produção diária conte para o ranking
            .gte('reference_date', startDate)
            .lte('reference_date', endDate)

        // Get active sellers by operational tenure. Fallback keeps old data readable until stores are configured.
        const { data: tenures } = await supabase
            .from('store_sellers')
            .select('seller_user_id, users:seller_user_id(name, is_venda_loja)')
            .eq('store_id', storeId)
            .eq('is_active', true)

        const { data: fallbackMembers } = (!tenures || tenures.length === 0)
            ? await supabase
                .from('memberships')
                .select('user_id, users(name, is_venda_loja)')
                .eq('store_id', storeId)
                .eq('role', 'vendedor')
            : { data: null }

        // Get goals for the store
        const { data: rules } = await supabase
            .from('store_meta_rules')
            .select('monthly_goal, include_venda_loja_in_individual_goal')
            .eq('store_id', storeId)
            .maybeSingle()

        const members = (tenures && tenures.length > 0)
            ? tenures.map((item: any) => ({ user_id: item.seller_user_id, users: item.users }))
            : (fallbackMembers || [])

        if (!checkins || !members) { setLoading(false); return }

        const storeGoal = rules?.monthly_goal || 0
        const includeVendaLojaInGoal = rules?.include_venda_loja_in_individual_goal || false
        
        const aggregated = new Map<string, { leads: number; agd: number; visitas: number; vnd: number; name: string; isVendaLoja: boolean }>()
        const realSellersCount = members.filter((m: any) => !m.users?.is_venda_loja).length
        const goalDivisor = realSellersCount + (includeVendaLojaInGoal ? members.filter((m: any) => m.users?.is_venda_loja).length : 0)

        for (const m of members) {
            const user = (m as any).users
            aggregated.set(m.user_id, { 
                leads: 0, agd: 0, visitas: 0, vnd: 0, 
                name: user?.name || 'Vendedor',
                isVendaLoja: user?.is_venda_loja || false
            })
        }

        for (const c of checkins) {
            const current = aggregated.get(c.seller_user_id)
            if (current) {
                current.leads += c.leads_prev_day || 0
                current.agd += (c.agd_cart_today || 0) + (c.agd_net_today || 0)
                current.visitas += c.visit_prev_day || 0
                current.vnd += (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0)
            }
        }

        const entries: RankingEntry[] = Array.from(aggregated.entries())
            .map(([userId, data]) => {
                const meta = data.isVendaLoja 
                    ? (includeVendaLojaInGoal ? Math.round(storeGoal / Math.max(goalDivisor, 1)) : 0)
                    : Math.round(storeGoal / Math.max(goalDivisor || realSellersCount, 1))

                return {
                    user_id: userId,
                    user_name: data.name,
                    is_venda_loja: data.isVendaLoja,
                    vnd_total: data.vnd,
                    leads: data.leads,
                    agd_total: data.agd,
                    visitas: data.visitas,
                    meta,
                    atingimento: 0,
                    position: 0,
                }
            })
            .sort((a, b) => {
                // Venda Loja sempre pro final no critério de desempate técnico, se empatar em vendas
                if (b.vnd_total !== a.vnd_total) return b.vnd_total - a.vnd_total
                if (a.is_venda_loja !== b.is_venda_loja) return a.is_venda_loja ? 1 : -1
                return b.visitas - a.visitas
            })
            .map((e, i) => {
                const atingimento = e.meta > 0 ? calcularAtingimento(e.vnd_total, e.meta) : 0
                return { ...e, atingimento, position: i + 1 }
            })

        setRanking(entries)
        setLoading(false)
    }, [storeId, startDate, endDate])

    useEffect(() => { fetchRanking() }, [fetchRanking])
    return { ranking, loading, refetch: fetchRanking }
}

export function useGlobalRanking() {
    const [ranking, setRanking] = useState<RankingEntry[]>([])
    const [loading, setLoading] = useState(true)

    const fetchGlobal = useCallback(async () => {
        const now = new Date()
        const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        setLoading(true)

        const { data: checkins } = await supabase
            .from('daily_checkins')
            .select('seller_user_id, leads_prev_day, agd_cart_today, agd_net_today, vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day, visit_prev_day')
            .eq('metric_scope', 'daily')
            .gte('reference_date', startOfMonth)

        const { data: tenures } = await supabase
            .from('store_sellers')
            .select('seller_user_id, store_id, users:seller_user_id(name, is_venda_loja), stores(name)')
            .eq('is_active', true)

        if (!checkins || !tenures) { setLoading(false); return }

        const agg = new Map<string, { vnd: number; leads: number; agd: number; vis: number; name: string; store: string; isVendaLoja: boolean }>()
        for (const m of tenures) {
            agg.set(m.seller_user_id, {
                vnd: 0, leads: 0, agd: 0, vis: 0, 
                name: (m as any).users?.name || '', 
                store: (m as any).stores?.name || '',
                isVendaLoja: (m as any).users?.is_venda_loja || false
            })
        }
        for (const c of checkins) {
            const cur = agg.get(c.seller_user_id)
            if (cur) {
                cur.vnd += (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0)
                cur.leads += c.leads_prev_day || 0
                cur.agd += (c.agd_cart_today || 0) + (c.agd_net_today || 0)
                cur.vis += c.visit_prev_day || 0
            }
        }

        const entries: RankingEntry[] = Array.from(agg.entries())
            .map(([uid, d]) => ({ 
                user_id: uid, 
                user_name: d.name, 
                store_name: d.store, 
                is_venda_loja: d.isVendaLoja,
                vnd_total: d.vnd, 
                leads: d.leads, 
                agd_total: d.agd, 
                visitas: d.vis, 
                meta: 0, 
                atingimento: 0, 
                position: 0 
            }))
            .sort((a, b) => {
                if (b.vnd_total !== a.vnd_total) return b.vnd_total - a.vnd_total
                if (a.is_venda_loja !== b.is_venda_loja) return a.is_venda_loja ? 1 : -1
                return b.visitas - a.visitas
            })
            .map((e, i) => ({ ...e, position: i + 1 }))

        setRanking(entries)
        setLoading(false)
    }, [])

    useEffect(() => { fetchGlobal() }, [fetchGlobal])

    return { ranking, loading, refetch: fetchGlobal }
}

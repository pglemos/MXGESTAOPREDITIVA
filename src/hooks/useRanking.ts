import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { RankingEntry } from '@/types/database'
import { calcularAtingimento, getDiasInfo, getOperationalStatus } from '@/lib/calculations'

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
                const diasInfo = getDiasInfo()
                const targetToday = (e.meta / diasInfo.total) * diasInfo.decorridos
                const efficiency = targetToday > 0 ? (e.vnd_total / targetToday) * 100 : 100
                const status = getOperationalStatus(efficiency, 100) // Ranking presume check-in p/ quem aparece

                const projecao = e.is_venda_loja ? e.vnd_total : Math.round((e.vnd_total / Math.max(diasInfo.decorridos, 1)) * diasInfo.total)
                const ritmo = e.is_venda_loja ? 0 : Math.max(0, Math.ceil((e.meta - e.vnd_total) / Math.max(diasInfo.restantes, 1)))
                const gap = e.is_venda_loja ? 0 : Math.max(0, e.meta - e.vnd_total)

                return { 
                    ...e, 
                    atingimento, 
                    projecao, 
                    ritmo, 
                    efficiency,
                    status,
                    gap,
                    position: i + 1 
                }
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
                projecao: d.vnd,
                ritmo: 0,
                gap: 0,
                position: 0 
              }))
            .sort((a, b) => {
                if (b.vnd_total !== a.vnd_total) return b.vnd_total - a.vnd_total
                if (a.is_venda_loja !== b.is_venda_loja) return a.is_venda_loja ? 1 : -1
                return b.visitas - a.visitas
            })
            .map((e, i) => ({ 
                ...e, 
                position: i + 1,
                efficiency: 0,
                status: { label: '-', color: 'bg-gray-100 text-gray-400' }
            }))

        setRanking(entries)
        setLoading(false)
    }, [])

    useEffect(() => { fetchGlobal() }, [fetchGlobal])

    return { ranking, loading, refetch: fetchGlobal }
}

export function useStorePerformance() {
    const [performance, setPerformance] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchPerformance = useCallback(async () => {
        setLoading(true)
        const now = new Date()
        const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        const dias = getDiasInfo()

        const [{ data: stores }, { data: rules }, { data: checkins }, { data: sellers }, { data: yesterdayCheckins }] = await Promise.all([
            supabase.from('stores').select('id, name'),
            supabase.from('store_meta_rules').select('store_id, monthly_goal'),
            supabase.from('daily_checkins')
                .select('store_id, vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day')
                .eq('metric_scope', 'daily')
                .gte('reference_date', startOfMonth),
            supabase.from('store_sellers').select('store_id, is_active').eq('is_active', true),
            supabase.from('daily_checkins')
                .select('store_id, seller_user_id')
                .eq('metric_scope', 'daily')
                .eq('reference_date', dias.referencia) // Yesterday
        ])

        if (!stores) { setLoading(false); return }

        const rulesMap = new Map(rules?.map(r => [r.store_id, r.monthly_goal]) || [])
        const salesMap = new Map<string, number>()
        checkins?.forEach(c => {
            const v = (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0)
            salesMap.set(c.store_id, (salesMap.get(c.store_id) || 0) + v)
        })

        const sellersCountMap = new Map<string, number>()
        sellers?.forEach(s => sellersCountMap.set(s.store_id, (sellersCountMap.get(s.store_id) || 0) + 1))

        const checkinsYesterdayMap = new Map<string, number>()
        yesterdayCheckins?.forEach(c => checkinsYesterdayMap.set(c.store_id, (checkinsYesterdayMap.get(c.store_id) || 0) + 1))

        const perf = stores.map(s => {
            const meta = rulesMap.get(s.id) || 0
            const realizado = salesMap.get(s.id) || 0
            const projecao = Math.round((realizado / Math.max(dias.decorridos, 1)) * dias.total)
            const gap = Math.max(0, meta - realizado)
            
            // Disciplina
            const totalSellers = sellersCountMap.get(s.id) || 0
            const doneSellers = checkinsYesterdayMap.get(s.id) || 0
            const isDisciplined = totalSellers > 0 ? doneSellers >= totalSellers : true
            
            // Semáforo logic
            const targetToday = (meta / dias.total) * dias.decorridos
            const efficiency = targetToday > 0 ? realizado / targetToday : 1
            const status = efficiency >= 1 ? 'green' : efficiency >= 0.8 ? 'yellow' : 'red'

            return {
                id: s.id,
                name: s.name,
                meta,
                realizado,
                projecao,
                gap,
                status,
                disciplina: { total: totalSellers, done: doneSellers, ok: isDisciplined },
                efficiency: Math.round(efficiency * 100)
            }
        })

        setPerformance(perf)
        setLoading(false)
    }, [])

    useEffect(() => { fetchPerformance() }, [fetchPerformance])
    return { performance, loading, refetch: fetchPerformance }
}

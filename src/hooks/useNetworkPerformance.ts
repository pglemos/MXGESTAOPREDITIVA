import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAllStoreGoals } from '@/hooks/useGoals'
import { getDiasInfo, calcularProjecao, calcularAtingimento } from '@/lib/calculations'

export interface NetworkMetric {
  totalSales: number
  totalLeads: number
  totalAgd: number
  totalVis: number
  networkGoal: number
  projection: number
  reaching: number
  storeCount: number
  byMonth: { month: string; sales: number }[]
  byStore: { storeId: string; storeName: string; sales: number; goal: number; reaching: number }[]
}

const EMPTY_METRIC: NetworkMetric = {
  totalSales: 0, totalLeads: 0, totalAgd: 0, totalVis: 0,
  networkGoal: 0, projection: 0, reaching: 0, storeCount: 0,
  byMonth: [], byStore: [],
}

export function useNetworkPerformance() {
  const { role } = useAuth()
  const { goals, loading: goalsLoading } = useAllStoreGoals()
  const [metrics, setMetrics] = useState<NetworkMetric>(EMPTY_METRIC)
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    if (role !== 'admin') {
      setMetrics(EMPTY_METRIC)
      setLoading(false)
      return
    }
    setLoading(true)

    try {
      const dias = getDiasInfo()
      const monthStart = new Date(dias.referencia).toISOString().slice(0, 8) + '01'
      const now = new Date().toISOString().slice(0, 10)

      let allCheckins: Record<string, unknown>[] = []
      let from = 0
      while (true) {
        const { data, error } = await supabase.from('daily_checkins')
          .select('store_id, reference_date, vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day, leads_prev_day, agd_cart_today, agd_net_today, visit_prev_day')
          .gte('reference_date', monthStart)
          .lte('reference_date', now)
          .range(from, from + 999)
        if (error) throw error
        if (!data || data.length === 0) break
        allCheckins = allCheckins.concat(data)
        if (data.length < 1000) break
        from += 1000
      }

      const { data: stores } = await supabase.from('stores').select('id, name')

      const byMonth: Record<string, number> = {}
      const byStoreMap: Record<string, { sales: number; leads: number; agd: number; vis: number }> = {}
      let totalSales = 0, totalLeads = 0, totalAgd = 0, totalVis = 0

      for (const c of allCheckins) {
        const sale = Number(c.vnd_porta_prev_day || 0) + Number(c.vnd_cart_prev_day || 0) + Number(c.vnd_net_prev_day || 0)
        const leads = Number(c.leads_prev_day || 0)
        const agd = Number(c.agd_cart_today || 0) + Number(c.agd_net_today || 0)
        const vis = Number(c.visit_prev_day || 0)
        const sid = c.store_id as string
        const month = (c.reference_date as string)?.slice(0, 7)

        totalSales += sale
        totalLeads += leads
        totalAgd += agd
        totalVis += vis

        if (month) byMonth[month] = (byMonth[month] || 0) + sale

        if (!byStoreMap[sid]) byStoreMap[sid] = { sales: 0, leads: 0, agd: 0, vis: 0 }
        byStoreMap[sid].sales += sale
        byStoreMap[sid].leads += leads
        byStoreMap[sid].agd += agd
        byStoreMap[sid].vis += vis
      }

      let networkGoal = 0
      const byStore: NetworkMetric['byStore'] = []
      for (const store of stores || []) {
        const goal = goals.find(g => g.store_id === store.id)?.target || 0
        networkGoal += goal
        const s = byStoreMap[store.id] || { sales: 0 }
        byStore.push({
          storeId: store.id,
          storeName: store.name,
          sales: s.sales,
          goal,
          reaching: calcularAtingimento(s.sales, goal),
        })
      }

      byStore.sort((a, b) => b.sales - a.sales)

      const projection = calcularProjecao(totalSales, dias.decorridos, dias.total)
      const reaching = calcularAtingimento(totalSales, networkGoal)

      setMetrics({
        totalSales, totalLeads, totalAgd, totalVis,
        networkGoal, projection, reaching,
        storeCount: stores?.length || 0,
        byMonth: Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, sales]) => ({ month, sales })),
        byStore,
      })
    } catch {
      setMetrics(EMPTY_METRIC)
    } finally {
      setLoading(false)
    }
  }, [role, goals])

  useEffect(() => { fetchMetrics() }, [fetchMetrics])

  return { metrics, loading: loading || goalsLoading, refetch: fetchMetrics }
}

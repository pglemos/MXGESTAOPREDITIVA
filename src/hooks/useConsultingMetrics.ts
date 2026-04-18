import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  parseConsultingInventorySnapshotArray,
  parseConsultingMarketingMonthlyArray,
  parseConsultingMetricCatalogArray,
  parseConsultingMetricResultArray,
  parseConsultingMetricTargetArray,
  type ConsultingInventorySnapshot,
  type ConsultingMarketingMonthly,
  type ConsultingMetricCatalogItem,
  type ConsultingMetricResult,
  type ConsultingMetricTarget,
} from '@/lib/schemas/consulting-client.schema'

export function useConsultingMetrics(clientId?: string) {
  const { profile } = useAuth()
  const [catalog, setCatalog] = useState<ConsultingMetricCatalogItem[]>([])
  const [targets, setTargets] = useState<ConsultingMetricTarget[]>([])
  const [results, setResults] = useState<ConsultingMetricResult[]>([])
  const [marketing, setMarketing] = useState<ConsultingMarketingMonthly[]>([])
  const [inventory, setInventory] = useState<ConsultingInventorySnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    if (!clientId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const [catalogRes, targetsRes, resultsRes, marketingRes, inventoryRes] = await Promise.all([
      supabase.from('consulting_metric_catalog').select('*').eq('active', true).order('sort_order', { ascending: true }),
      supabase.from('consulting_client_metric_targets').select('*').eq('client_id', clientId).order('reference_month', { ascending: false }),
      supabase.from('consulting_client_metric_results').select('*').eq('client_id', clientId).order('reference_date', { ascending: false }),
      supabase.from('consulting_marketing_monthly').select('*').eq('client_id', clientId).order('reference_month', { ascending: false }),
      supabase.from('consulting_inventory_snapshots').select('*').eq('client_id', clientId).order('reference_month', { ascending: false }),
    ])

    const fetchError = catalogRes.error || targetsRes.error || resultsRes.error || marketingRes.error || inventoryRes.error
    if (fetchError) {
      setError(fetchError.message)
    } else {
      setCatalog(parseConsultingMetricCatalogArray(catalogRes.data || []))
      setTargets(parseConsultingMetricTargetArray(targetsRes.data || []))
      setResults(parseConsultingMetricResultArray(resultsRes.data || []))
      setMarketing(parseConsultingMarketingMonthlyArray(marketingRes.data || []))
      setInventory(parseConsultingInventorySnapshotArray(inventoryRes.data || []))
    }
    setLoading(false)
  }, [clientId])

  const upsertTarget = useCallback(async (input: { metric_key: string; reference_month: string; target_value: number; source?: string }) => {
    if (!clientId) return { error: 'Cliente nao informado.' }
    const { error: upsertError } = await supabase.from('consulting_client_metric_targets').upsert({
      client_id: clientId,
      metric_key: input.metric_key,
      reference_month: input.reference_month,
      target_value: input.target_value,
      source: input.source || 'manual',
      created_by: profile?.id || null,
    }, { onConflict: 'client_id,metric_key,reference_month' })
    if (upsertError) return { error: upsertError.message }
    await fetchMetrics()
    return { error: null }
  }, [clientId, fetchMetrics, profile?.id])

  const upsertResult = useCallback(async (input: { metric_key: string; reference_date: string; result_value: number; source?: string; source_payload?: Record<string, unknown> }) => {
    if (!clientId) return { error: 'Cliente nao informado.' }
    const { error: upsertError } = await supabase.from('consulting_client_metric_results').upsert({
      client_id: clientId,
      metric_key: input.metric_key,
      reference_date: input.reference_date,
      result_value: input.result_value,
      source: input.source || 'manual',
      source_payload: input.source_payload || {},
      created_by: profile?.id || null,
    }, { onConflict: 'client_id,metric_key,reference_date,source' })
    if (upsertError) return { error: upsertError.message }
    await fetchMetrics()
    return { error: null }
  }, [clientId, fetchMetrics, profile?.id])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const latestResults = useMemo(() => {
    const map = new Map<string, ConsultingMetricResult>()
    for (const result of results) {
      if (!map.has(result.metric_key)) map.set(result.metric_key, result)
    }
    return map
  }, [results])

  return { catalog, targets, results, latestResults, marketing, inventory, loading, error, upsertTarget, upsertResult, refetch: fetchMetrics }
}


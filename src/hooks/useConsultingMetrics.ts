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
import {
  derivePmrMetricResults,
  mergeLatestPmrResults,
  type PmrFinancialRow,
  type PmrSalesEntry,
} from '@/lib/consultoria/pmr-engine'

export function useConsultingMetrics(clientId?: string) {
  const { profile } = useAuth()
  const [catalog, setCatalog] = useState<ConsultingMetricCatalogItem[]>([])
  const [targets, setTargets] = useState<ConsultingMetricTarget[]>([])
  const [results, setResults] = useState<ConsultingMetricResult[]>([])
  const [marketing, setMarketing] = useState<ConsultingMarketingMonthly[]>([])
  const [inventory, setInventory] = useState<ConsultingInventorySnapshot[]>([])
  const [sales, setSales] = useState<PmrSalesEntry[]>([])
  const [financials, setFinancials] = useState<PmrFinancialRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    if (!clientId) {
      setCatalog([])
      setTargets([])
      setResults([])
      setMarketing([])
      setInventory([])
      setSales([])
      setFinancials([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const [catalogRes, targetsRes, resultsRes, marketingRes, inventoryRes, salesRes, financialsRes] = await Promise.all([
      supabase.from('catalogo_metricas_consultoria').select('*').eq('active', true).order('sort_order', { ascending: true }),
      supabase.from('metas_metricas_cliente').select('*').eq('client_id', clientId).order('reference_month', { ascending: false }),
      supabase.from('resultados_metricas_cliente').select('*').eq('client_id', clientId).order('reference_date', { ascending: false }),
      supabase.from('marketing_mensal_consultoria').select('*').eq('client_id', clientId).order('reference_month', { ascending: false }),
      supabase.from('snapshots_estoque_consultoria').select('*').eq('client_id', clientId).order('reference_month', { ascending: false }),
      supabase.from('entradas_vendas_consultoria').select('*').eq('client_id', clientId).order('sale_date', { ascending: false }),
      supabase.from('financeiro_consultoria').select('*').eq('client_id', clientId).order('reference_date', { ascending: false }),
    ])

    const fetchError = catalogRes.error || targetsRes.error || resultsRes.error || marketingRes.error || inventoryRes.error || salesRes.error || financialsRes.error
    if (fetchError) {
      setError(fetchError.message)
    } else {
      setCatalog(parseConsultingMetricCatalogArray(catalogRes.data || []))
      setTargets(parseConsultingMetricTargetArray(targetsRes.data || []))
      setResults(parseConsultingMetricResultArray(resultsRes.data || []))
      setMarketing(parseConsultingMarketingMonthlyArray(marketingRes.data || []))
      setInventory(parseConsultingInventorySnapshotArray(inventoryRes.data || []))
      setSales((salesRes.data || []) as PmrSalesEntry[])
      setFinancials((financialsRes.data || []) as PmrFinancialRow[])
    }
    setLoading(false)
  }, [clientId])

  const upsertTarget = useCallback(async (input: { metric_key: string; reference_month: string; target_value: number; source?: string }) => {
    if (!clientId) return { error: 'Cliente nao informado.' }
    const { error: upsertError } = await supabase.from('metas_metricas_cliente').upsert({
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
    const { error: upsertError } = await supabase.from('resultados_metricas_cliente').upsert({
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

  const derivedResults = useMemo(() => (
    clientId
      ? derivePmrMetricResults({ clientId, marketing, sales, inventory, financials })
      : []
  ), [clientId, financials, inventory, marketing, sales])

  const latestResults = useMemo(() => mergeLatestPmrResults(results, derivedResults), [derivedResults, results])

  return { catalog, targets, results, derivedResults, latestResults, marketing, inventory, sales, financials, loading, error, upsertTarget, upsertResult, refetch: fetchMetrics }
}

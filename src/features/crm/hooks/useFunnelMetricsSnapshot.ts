import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

type JsonRecord = Record<string, unknown>

export type FunnelMetricsSnapshot = {
  id: string
  loja_id: string
  seller_user_id: string
  period_start: string
  period_end: string
  period_key: string
  meta: number | null
  vendas_realizadas: number
  vendas_faltantes: number | null
  atingimento: number | null
  totals: JsonRecord
  channels: JsonRecord
  source: string
  created_at: string
  updated_at: string
}

type UseFunnelMetricsSnapshotOptions = {
  periodStart: Date
  periodEnd: Date
  periodKey: string
  enabled?: boolean
}

export function useFunnelMetricsSnapshot({
  periodStart,
  periodEnd,
  periodKey,
  enabled = true,
}: UseFunnelMetricsSnapshotOptions) {
  const { profile } = useAuth()
  const [snapshot, setSnapshot] = useState<FunnelMetricsSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const periodStartKey = useMemo(() => formatDateParam(periodStart), [periodStart])
  const periodEndKey = useMemo(() => formatDateParam(periodEnd), [periodEnd])
  const normalizedPeriodKey = useMemo(() => periodKey.trim().toLowerCase() || 'custom', [periodKey])

  const fetchSnapshot = useCallback(async () => {
    if (!enabled || !profile?.id) {
      setSnapshot(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('funnel_metrics')
      .select('*')
      .eq('seller_user_id', profile.id)
      .eq('period_start', periodStartKey)
      .eq('period_end', periodEndKey)
      .eq('period_key', normalizedPeriodKey)
      .maybeSingle()

    if (fetchError) {
      setSnapshot(null)
      setError(fetchError.message)
    } else {
      setSnapshot(normalizeSnapshot(data))
    }

    setLoading(false)
  }, [enabled, normalizedPeriodKey, periodEndKey, periodStartKey, profile?.id])

  const refreshSnapshot = useCallback(async (): Promise<{ error: string | null }> => {
    if (!profile?.id) {
      const message = 'Sessao invalida.'
      setError(message)
      return { error: message }
    }

    setSaving(true)
    setError(null)

    const { data, error: rpcError } = await supabase.rpc('upsert_funnel_metrics_snapshot', {
      p_period_start: periodStartKey,
      p_period_end: periodEndKey,
      p_period_key: normalizedPeriodKey,
    })

    if (rpcError) {
      setError(rpcError.message)
      setSaving(false)
      return { error: rpcError.message }
    }

    setSnapshot(normalizeSnapshot(data))
    setSaving(false)
    return { error: null }
  }, [normalizedPeriodKey, periodEndKey, periodStartKey, profile?.id])

  useEffect(() => {
    fetchSnapshot()
  }, [fetchSnapshot])

  return {
    snapshot,
    loading,
    saving,
    error,
    refetch: fetchSnapshot,
    refreshSnapshot,
  }
}

function formatDateParam(date: Date) {
  return date.toISOString().slice(0, 10)
}

function normalizeSnapshot(value: unknown): FunnelMetricsSnapshot | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>

  return {
    id: String(row.id || ''),
    loja_id: String(row.loja_id || ''),
    seller_user_id: String(row.seller_user_id || ''),
    period_start: String(row.period_start || ''),
    period_end: String(row.period_end || ''),
    period_key: String(row.period_key || 'custom'),
    meta: nullableNumber(row.meta),
    vendas_realizadas: Number(row.vendas_realizadas || 0),
    vendas_faltantes: nullableNumber(row.vendas_faltantes),
    atingimento: nullableNumber(row.atingimento),
    totals: asRecord(row.totals),
    channels: asRecord(row.channels),
    source: String(row.source || ''),
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
  }
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

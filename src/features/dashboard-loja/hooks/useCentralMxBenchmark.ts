import { useCallback, useState } from 'react'
import { toast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'

/**
 * Hook do Blitz 48h Dia 2 — T4.
 *
 * Encapsula a RPC `public.get_benchmark` para a tela interativa de Benchmarking.
 * Aplica a regra de privacidade da ata (delta N6 — 2026-05-22 §00:37–§00:38):
 * se o recorte tiver menos de 5 lojas, o hook NÃO devolve dados específicos —
 * apenas a média geral ou vazio. Isso evita engenharia reversa do ranking.
 */

export type CentralMxBenchmarkPeerGroup = 'mercado' | 'regiao' | 'porte' | 'segmento'

export type CentralMxBenchmarkRow = {
  loja_value: number | null
  peer_avg: number | null
  peer_median: number | null
  peer_top: number | null
  loja_rank: number | null
  loja_percentile: number | null
  peer_count: number
  computed_at: string | null
}

export const CENTRAL_MX_BENCHMARK_PRIVACY_MIN = 5

export type CentralMxBenchmarkQuery = {
  storeId: string
  metricCode: string
  peerGroup?: CentralMxBenchmarkPeerGroup
  period?: string
}

export type CentralMxBenchmarkState = {
  loading: boolean
  error: string | null
  data: CentralMxBenchmarkRow | null
  privacyApplied: boolean
}

export type UseCentralMxBenchmarkResult = CentralMxBenchmarkState & {
  fetchBenchmark: (query: CentralMxBenchmarkQuery) => Promise<void>
  reset: () => void
}

const INITIAL_STATE: CentralMxBenchmarkState = {
  loading: false,
  error: null,
  data: null,
  privacyApplied: false,
}

export function useCentralMxBenchmark(): UseCentralMxBenchmarkResult {
  const [state, setState] = useState<CentralMxBenchmarkState>(INITIAL_STATE)

  const fetchBenchmark = useCallback(async (query: CentralMxBenchmarkQuery) => {
    if (!query.storeId || !query.metricCode) {
      setState({ ...INITIAL_STATE, error: 'Parâmetros incompletos para o benchmark.' })
      return
    }
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const { data, error } = await supabase.rpc('get_benchmark', {
        p_loja_id: query.storeId,
        p_metric_code: query.metricCode,
        p_peer_group: query.peerGroup ?? 'mercado',
        p_period: query.period ?? null,
      })
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      if (!row) {
        setState({ loading: false, error: null, data: null, privacyApplied: false })
        return
      }
      const normalized = row as CentralMxBenchmarkRow
      const privacyApplied = normalized.peer_count < CENTRAL_MX_BENCHMARK_PRIVACY_MIN
      if (privacyApplied) {
        setState({
          loading: false,
          error: null,
          data: {
            ...normalized,
            loja_value: normalized.loja_value,
            peer_avg: normalized.peer_avg,
            peer_median: null,
            peer_top: null,
            loja_rank: null,
            loja_percentile: null,
          },
          privacyApplied: true,
        })
        toast.info(
          `Recorte com ${normalized.peer_count} loja(s) — exibindo apenas média geral por privacidade.`,
        )
        return
      }
      setState({ loading: false, error: null, data: normalized, privacyApplied: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao consultar o benchmark.'
      setState({ ...INITIAL_STATE, error: message })
    }
  }, [])

  const reset = useCallback(() => setState(INITIAL_STATE), [])

  return { ...state, fetchBenchmark, reset }
}

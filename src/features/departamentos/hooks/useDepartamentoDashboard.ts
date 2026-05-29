import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Hook do Sprint 2 — S2-T2.
 *
 * Consome a RPC `consolidar_dashboard_departamento(loja, code, period)` que
 * agrega checklist + biblioteca + fluxograma + KPIs em uma única chamada.
 */

export type DepartamentoCode =
  | 'comercial'
  | 'marketing'
  | 'produto'
  | 'financeiro'
  | 'rh'
  | 'operacional'

export type DepartamentoKpi = {
  indicador_code: string
  meta: number | null
  realizado: number | null
  ano_anterior: number | null
  unidade: string | null
}

export type DepartamentoChecklistItem = {
  id: string
  ordem: number
  titulo: string
  descricao: string | null
  obrigatorio: boolean
}

export type DepartamentoBibliotecaItem = {
  id: string
  ordem: number
  titulo: string
  categoria: 'regra' | 'boa_pratica' | 'exemplo' | 'referencia'
  url_externo: string | null
}

export type DepartamentoFluxoStep = {
  passo: number
  titulo: string
  descricao: string | null
  responsavel_papel: string | null
}

export type DepartamentoDashboardData = {
  found: boolean
  departamento?: {
    id: string
    code: DepartamentoCode
    name: string
    status: string
    responsible_id: string | null
  }
  kpis?: DepartamentoKpi[]
  checklist?: DepartamentoChecklistItem[]
  biblioteca?: DepartamentoBibliotecaItem[]
  fluxograma?: DepartamentoFluxoStep[]
  period?: string
}

export type UseDepartamentoDashboardResult = {
  data: DepartamentoDashboardData | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDepartamentoDashboard(
  storeId: string | null | undefined,
  code: DepartamentoCode | null | undefined,
  period?: string,
): UseDepartamentoDashboardResult {
  const [data, setData] = useState<DepartamentoDashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    if (!storeId || !code) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'consolidar_dashboard_departamento',
        {
          p_loja_id: storeId,
          p_code: code,
          p_period: period ?? null,
        },
      )
      if (rpcError) throw rpcError
      setData(rpcData as DepartamentoDashboardData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar departamento.'
      setError(message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [storeId, code, period])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return { data, loading, error, refresh: fetchDashboard }
}

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface OfficialSellerPerformance {
  seller_user_id: string
  seller_name: string
  store_id: string
  store_name: string
  vendas_realizadas: number
  vendas_ultimo_dia: number
  vendas_projetadas: number
  faturamento_realizado: number
  meta: number
  atingimento: number
  comissao_realizada: number
  comissao_projetada: number
  disciplina: number
  leads: number
  atendimentos: number
  agendamentos: number
  regularizacoes_pendentes: number
  regularizacoes_aprovadas: number
}

const numberFields = new Set([
  'vendas_realizadas', 'vendas_ultimo_dia', 'vendas_projetadas', 'faturamento_realizado', 'meta', 'atingimento',
  'comissao_realizada', 'comissao_projetada', 'disciplina', 'leads', 'atendimentos', 'agendamentos',
  'regularizacoes_pendentes', 'regularizacoes_aprovadas',
])

const normalize = (row: Record<string, unknown>) => Object.fromEntries(
  Object.entries(row).map(([key, value]) => [key, numberFields.has(key) ? Number(value || 0) : value]),
) as unknown as OfficialSellerPerformance

export function useOfficialSellerPerformance(startDate: string, endDate: string, sellerId?: string | null, storeId?: string | null) {
  const { profile } = useAuth()
  const [rows, setRows] = useState<OfficialSellerPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPerformance = useCallback(async () => {
    setLoading(true)
    const { data, error: rpcError } = await supabase.rpc('vendedor_performance_oficial', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_seller_id: sellerId || null,
      p_store_id: storeId || null,
    })
    setError(rpcError?.message || null)
    setRows(rpcError ? [] : ((data || []) as Record<string, unknown>[]).map(normalize))
    setLoading(false)
  }, [endDate, sellerId, startDate, storeId])

  useEffect(() => { void fetchPerformance() }, [fetchPerformance, profile?.id])
  return { rows, performance: rows[0] || null, loading, error, refetch: fetchPerformance }
}


import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type OwnerInventoryMetrics = {
  total: number
  available: number
  reserved: number
  agingOver90: number
  value: number
}

const EMPTY: OwnerInventoryMetrics = { total: 0, available: 0, reserved: 0, agingOver90: 0, value: 0 }

export function useOwnerInventoryMetrics(storeId: string | null) {
  const [metrics, setMetrics] = useState<OwnerInventoryMetrics>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    if (!storeId) {
      setMetrics(EMPTY)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase
      .from('veiculos_estoque')
      .select('status, preco, data_entrada')
      .eq('loja_id', storeId)

    if (queryError) {
      setMetrics(EMPTY)
      setError('Não foi possível carregar o estoque da unidade.')
    } else {
      const today = new Date()
      const rows = data || []
      setMetrics({
        total: rows.filter(row => row.status !== 'vendido').length,
        available: rows.filter(row => row.status === 'disponivel').length,
        reserved: rows.filter(row => row.status === 'reservado').length,
        agingOver90: rows.filter(row => {
          const entered = new Date(`${row.data_entrada}T12:00:00`)
          return row.status !== 'vendido' && (today.getTime() - entered.getTime()) / 86400000 > 90
        }).length,
        value: rows.filter(row => row.status !== 'vendido').reduce((sum, row) => sum + Number(row.preco || 0), 0),
      })
    }
    setLoading(false)
  }, [storeId])

  useEffect(() => { void fetchMetrics() }, [fetchMetrics])
  return { metrics, loading, error, refetch: fetchMetrics }
}

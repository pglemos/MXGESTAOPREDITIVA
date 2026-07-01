import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export type VeiculoEstoque = {
  id: string
  loja_id: string
  created_by: string
  marca: string
  modelo: string
  versao: string | null
  ano: string | null
  preco: number | null
  data_entrada: string
  observacao: string | null
  status: 'disponivel' | 'reservado' | 'vendido'
  created_at: string
  updated_at: string
}

export type VeiculoEstoqueInput = {
  marca: string
  modelo: string
  versao?: string | null
  ano?: string | null
  preco?: number | null
  data_entrada?: string
  observacao?: string | null
}

/**
 * Veiculos recem-chegados na loja (ultimos 7 dias por padrao) — fonte da
 * aba "Plano de Ataque" da Carteira. Escopo por loja, nao por vendedor:
 * qualquer vendedor da loja ve e registra no mesmo estoque comum.
 */
export function useVeiculosEstoque(diasJanela = 7) {
  const { supabaseUser, activeStoreId, storeId } = useAuth()
  const effectiveStoreId = activeStoreId || storeId || null
  const [veiculos, setVeiculos] = useState<VeiculoEstoque[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVeiculos = useCallback(async () => {
    if (!supabaseUser || !effectiveStoreId) {
      setVeiculos([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const limite = new Date()
    limite.setDate(limite.getDate() - diasJanela)
    const limiteStr = limite.toISOString().slice(0, 10)

    const { data, error: fetchError } = await supabase
      .from('veiculos_estoque')
      .select('*')
      .eq('loja_id', effectiveStoreId)
      .gte('data_entrada', limiteStr)
      .order('data_entrada', { ascending: false })
      .limit(50)

    if (fetchError) {
      setError(fetchError.message)
      setVeiculos([])
    } else {
      setVeiculos((data || []) as VeiculoEstoque[])
    }
    setLoading(false)
  }, [supabaseUser, effectiveStoreId, diasJanela])

  const createVeiculo = useCallback(async (input: VeiculoEstoqueInput): Promise<{ error: string | null; id?: string }> => {
    if (!supabaseUser) return { error: 'Sessão inválida.' }
    if (!effectiveStoreId) return { error: 'Loja não identificada para o vendedor.' }
    if (!input.marca.trim() || !input.modelo.trim()) return { error: 'Informe marca e modelo.' }

    const payload = {
      loja_id: effectiveStoreId,
      created_by: supabaseUser.id,
      marca: input.marca.trim(),
      modelo: input.modelo.trim(),
      versao: input.versao?.trim() || null,
      ano: input.ano?.trim() || null,
      preco: input.preco ?? null,
      data_entrada: input.data_entrada || new Date().toISOString().slice(0, 10),
      observacao: input.observacao?.trim() || null,
    }

    const { data, error: insertError } = await supabase
      .from('veiculos_estoque')
      .insert(payload)
      .select('id')
      .single()

    if (insertError) return { error: insertError.message }
    await fetchVeiculos()
    return { error: null, id: data?.id }
  }, [supabaseUser, effectiveStoreId, fetchVeiculos])

  useEffect(() => { fetchVeiculos() }, [fetchVeiculos])

  return { veiculos, loading, error, refetch: fetchVeiculos, createVeiculo }
}

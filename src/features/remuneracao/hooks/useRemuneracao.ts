import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export { useLojasDoUsuario, type LojaOption } from '@/hooks/useLojasDoUsuario'
export {
  totalPlano,
  montarComparativo,
  type RemuneracaoPlano,
  type RemuneracaoPlanoInsert,
  type RemuneracaoBenchmark,
  type Classificacao,
  type ComparativoLinha,
} from '../lib/comparativo'
import type { RemuneracaoPlano, RemuneracaoPlanoInsert, RemuneracaoBenchmark } from '../lib/comparativo'

/** Planos de remuneração de uma loja + mutations. */
export function usePlanosRemuneracao(lojaId: string | null) {
  const [planos, setPlanos] = useState<RemuneracaoPlano[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!lojaId) { setPlanos([]); return }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('remuneracao_planos')
      .select('*')
      .eq('loja_id', lojaId)
      .order('cargo')
    if (error) setError(error.message)
    else setPlanos((data ?? []) as RemuneracaoPlano[])
    setLoading(false)
  }, [lojaId])

  useEffect(() => { void reload() }, [reload])

  const salvarPlano = useCallback(async (input: RemuneracaoPlanoInsert) => {
    const { error } = await supabase
      .from('remuneracao_planos')
      .upsert(input, { onConflict: 'loja_id,cargo,vigencia_inicio' })
    if (error) return { error: error.message }
    await reload()
    return { error: null }
  }, [reload])

  const removerPlano = useCallback(async (id: string) => {
    const { error } = await supabase.from('remuneracao_planos').delete().eq('id', id)
    if (error) return { error: error.message }
    await reload()
    return { error: null }
  }, [reload])

  return { planos, loading, error, reload, salvarPlano, removerPlano }
}

/** Benchmark de mercado filtrado por parâmetros (região/tamanho/meta). */
export function useBenchmark(params: { regiao: string; faixaTamanho: string; meta: string }) {
  const [rows, setRows] = useState<RemuneracaoBenchmark[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!params.regiao || !params.faixaTamanho) { setRows([]); return }
      setLoading(true)
      let q = supabase
        .from('remuneracao_benchmark')
        .select('*')
        .eq('regiao', params.regiao)
        .eq('faixa_tamanho', params.faixaTamanho)
      if (params.meta) q = q.eq('meta', params.meta)
      const { data, error } = await q
      if (!alive) return
      if (!error && data) setRows(data as RemuneracaoBenchmark[])
      setLoading(false)
    })()
    return () => { alive = false }
  }, [params.regiao, params.faixaTamanho, params.meta])

  return { benchmark: rows, loading }
}

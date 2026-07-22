import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export { useLojasDoUsuario, type LojaOption } from '@/hooks/useLojasDoUsuario'
export {
  totalPlano,
  montarComparativo,
  type RemuneracaoPlano,
  type RemuneracaoPlanoInsert,
  type RemuneracaoBenchmark,
  type RemuneracaoRegra,
  type RemuneracaoRegraInsert,
  type RemuneracaoRegraTipo,
  type RemuneracaoTipoVeiculo,
  type RemuneracaoVinculoTipo,
  type RemuneracaoVenda,
  type RemuneracaoEstimadaResultado,
  type RemuneracaoResumoVendedor,
  type RemuneracaoBonusPatamarDetalhe,
  type RemuneracaoFormulaItem,
  type Classificacao,
  type ComparativoLinha,
} from '../lib/comparativo'
import {
  calcularResumoRemuneracaoVendedor,
  type RemuneracaoPlano,
  type RemuneracaoPlanoInsert,
  type RemuneracaoBenchmark,
  type RemuneracaoRegra,
  type RemuneracaoRegraInsert,
  type RemuneracaoVinculoTipo,
  type RemuneracaoVenda,
} from '../lib/comparativo'

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

/** Regras de comissão/bônus de uma loja + mutations. */
export function useRegrasRemuneracao(lojaId: string | null) {
  const [regras, setRegras] = useState<RemuneracaoRegra[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!lojaId) { setRegras([]); return }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('remuneracao_regras')
      .select('*')
      .eq('loja_id', lojaId)
      .order('cargo')
      .order('tipo')
      .order('percentual_meta_min', { ascending: true, nullsFirst: true })
    if (error) setError(error.message)
    else setRegras((data ?? []) as RemuneracaoRegra[])
    setLoading(false)
  }, [lojaId])

  useEffect(() => { void reload() }, [reload])

  const salvarRegra = useCallback(async (input: RemuneracaoRegraInsert) => {
    const { error } = await supabase.from('remuneracao_regras').insert(input)
    if (error) return { error: error.message }
    await reload()
    return { error: null }
  }, [reload])

  const removerRegra = useCallback(async (id: string) => {
    const { error } = await supabase.from('remuneracao_regras').delete().eq('id', id)
    if (error) return { error: error.message }
    await reload()
    return { error: null }
  }, [reload])

  return { regras, loading, error, reload, salvarRegra, removerRegra }
}

export function useRemuneracaoEstimadaVendedor(params: {
  lojaId: string | null
  planoId?: string | null
  cargo?: string
  vendasRealizadas: number
  vendasProjetadas: number
  meta: number
  vendasDetalhadasRealizadas?: RemuneracaoVenda[]
  faturamentoProjetado?: number
  vinculoTipo?: RemuneracaoVinculoTipo
  atingimentoLojaPercentual?: number
  carrosVendidosLoja?: number
  nivelCarreira?: 'junior' | 'pleno' | 'lider'
}) {
  const cargo = params.cargo || 'Vendedor'
  const [plano, setPlano] = useState<RemuneracaoPlano | null>(null)
  const [regras, setRegras] = useState<RemuneracaoRegra[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!params.lojaId) {
        setPlano(null)
        setRegras([])
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      const today = new Date().toISOString().slice(0, 10)
      let planosQuery = supabase
        .from('remuneracao_planos')
        .select('*')
        .eq('loja_id', params.lojaId)

      planosQuery = params.planoId
        ? planosQuery.eq('id', params.planoId).limit(1)
        : planosQuery
          .lte('vigencia_inicio', today)
          .order('vigencia_inicio', { ascending: false })
          .limit(1)
          .ilike('cargo', cargo)

      const [planosRes, regrasRes] = await Promise.all([
        planosQuery,
        supabase
          .from('remuneracao_regras')
          .select('*')
          .eq('loja_id', params.lojaId)
          .ilike('cargo', cargo)
          .eq('ativo', true)
          .lte('vigencia_inicio', today)
          .order('tipo')
          .order('percentual_meta_min', { ascending: true, nullsFirst: true }),
      ])
      if (!alive) return

      if (planosRes.error || regrasRes.error) {
        setPlano(null)
        setRegras([])
        setError(planosRes.error?.message || regrasRes.error?.message || 'Erro ao carregar remuneração.')
      } else {
        setPlano(((planosRes.data ?? [])[0] ?? null) as RemuneracaoPlano | null)
        setRegras((regrasRes.data ?? []) as RemuneracaoRegra[])
      }
      setLoading(false)
    })()
    return () => { alive = false }
  }, [cargo, params.lojaId, params.planoId])

  const resumo = useMemo(() => calcularResumoRemuneracaoVendedor({
    plano,
    regras,
    vendasRealizadas: params.vendasRealizadas,
    vendasProjetadas: params.vendasProjetadas,
    meta: params.meta,
    vendasDetalhadasRealizadas: params.vendasDetalhadasRealizadas,
    faturamentoProjetado: params.faturamentoProjetado,
    vinculoTipo: params.vinculoTipo,
    atingimentoLojaPercentual: params.atingimentoLojaPercentual,
    carrosVendidosLoja: params.carrosVendidosLoja,
    nivelCarreira: params.nivelCarreira,
  }), [
    plano,
    regras,
    params.vendasRealizadas,
    params.vendasProjetadas,
    params.meta,
    params.vendasDetalhadasRealizadas,
    params.faturamentoProjetado,
    params.vinculoTipo,
    params.atingimentoLojaPercentual,
    params.carrosVendidosLoja,
    params.nivelCarreira,
  ])

  return {
    estimativa: resumo.projetado,
    resumo,
    realizado: resumo.realizado,
    projetado: resumo.projetado,
    plano,
    regras,
    loading,
    error,
  }
}

export type NivelCarreira = 'junior' | 'pleno' | 'lider'

/** Nível de carreira de todos os vendedores de uma loja + mutation (dono/gerente). */
export function useVendedoresNivelCarreira(lojaId: string | null) {
  const [niveis, setNiveis] = useState<Record<string, NivelCarreira>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!lojaId) { setNiveis({}); return }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('vendedor_nivel_carreira')
      .select('seller_user_id, nivel_carreira')
      .eq('loja_id', lojaId)
    if (error) setError(error.message)
    else {
      const map: Record<string, NivelCarreira> = {}
      for (const row of data ?? []) map[row.seller_user_id] = row.nivel_carreira as NivelCarreira
      setNiveis(map)
    }
    setLoading(false)
  }, [lojaId])

  useEffect(() => { void reload() }, [reload])

  const salvarNivel = useCallback(async (sellerUserId: string, nivel: NivelCarreira) => {
    if (!lojaId) return { error: 'Loja não selecionada.' }
    const { error } = await supabase
      .from('vendedor_nivel_carreira')
      .upsert({ seller_user_id: sellerUserId, loja_id: lojaId, nivel_carreira: nivel }, { onConflict: 'seller_user_id' })
    if (error) return { error: error.message }
    await reload()
    return { error: null }
  }, [lojaId, reload])

  return { niveis, loading, error, salvarNivel }
}

/** Nível de carreira do próprio vendedor (leitura). */
export function useMeuNivelCarreira(sellerUserId: string | null) {
  const [nivel, setNivel] = useState<NivelCarreira | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!sellerUserId) {
        setNivel(null)
        setLoading(false)
        return
      }
      setLoading(true)
      const { data } = await supabase
        .from('vendedor_nivel_carreira')
        .select('nivel_carreira')
        .eq('seller_user_id', sellerUserId)
        .maybeSingle()
      if (!alive) return
      setNivel((data?.nivel_carreira as NivelCarreira) || null)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [sellerUserId])

  return { nivel, loading }
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

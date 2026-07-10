import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/lib/toast'
import { scopeToDb, type ScopeDb } from '@/features/dashboard-loja/lib/scopeType'
import { supabase } from '@/lib/supabase'

/**
 * Hook do Sprint 1 — Consultor IA rules-based (N9 + N10 da ata 2026-05-22).
 *
 * Encapsula a leitura do banco de soluções (`consultor_solucoes`) e a invocação
 * da RPC `consultor_ia_sugerir_acao` para gerar novas sugestões com base em
 * score, alertas e disciplina de lançamento.
 *
 * É APENAS rules-based — sem LLM, conforme NFR-IA1.
 */

export type ConsultorIaPriority = 'critica' | 'alta' | 'media' | 'baixa'

export type ConsultorIaSolucao = {
  id: string
  scope_type: ScopeDb
  scope_id: string | null
  rule_code: string
  problem: string
  recommendation: string
  rationale: string | null
  priority: ConsultorIaPriority
  rule_version: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export type UseConsultorIaResult = {
  solucoes: ConsultorIaSolucao[]
  loading: boolean
  generating: boolean
  error: string | null
  refresh: () => Promise<void>
  gerarSugestoes: (period?: string) => Promise<void>
  counts: Record<ConsultorIaPriority, number>
}

const EMPTY_COUNTS: Record<ConsultorIaPriority, number> = {
  critica: 0,
  alta: 0,
  media: 0,
  baixa: 0,
}

export const CONSULTOR_IA_STORE_SCOPE_TYPE: ScopeDb = scopeToDb('loja')

export function useConsultorIa(storeId: string | null | undefined): UseConsultorIaResult {
  const [solucoes, setSolucoes] = useState<ConsultorIaSolucao[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSolucoes = useCallback(async () => {
    if (!storeId) {
      setSolucoes([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: queryError } = await supabase
        .from('consultor_solucoes')
        .select(
          'id, scope_type, scope_id, rule_code, problem, recommendation, rationale, priority, rule_version, metadata, created_at',
        )
        .eq('scope_type', CONSULTOR_IA_STORE_SCOPE_TYPE)
        .eq('scope_id', storeId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (queryError) throw queryError
      setSolucoes((data ?? []) as ConsultorIaSolucao[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar sugestões.'
      setError(message)
      setSolucoes([])
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchSolucoes()
  }, [fetchSolucoes])

  const gerarSugestoes = useCallback(
    async (period?: string) => {
      if (!storeId) {
        toast.error('Selecione uma loja antes de gerar sugestões.')
        return
      }
      setGenerating(true)
      try {
        const { error: rpcError } = await supabase.rpc('consultor_ia_sugerir_acao', {
          p_store_id: storeId,
          p_period: period ?? null,
        })
        if (rpcError) throw rpcError
        toast.success('Sugestões do Consultor IA atualizadas.')
        await fetchSolucoes()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível gerar sugestões.')
      } finally {
        setGenerating(false)
      }
    },
    [storeId, fetchSolucoes],
  )

  const counts = useMemo<Record<ConsultorIaPriority, number>>(() => {
    if (!solucoes.length) return EMPTY_COUNTS
    return solucoes.reduce(
      (acc, item) => {
        acc[item.priority] = (acc[item.priority] ?? 0) + 1
        return acc
      },
      { ...EMPTY_COUNTS },
    )
  }, [solucoes])

  return {
    solucoes,
    loading,
    generating,
    error,
    refresh: fetchSolucoes,
    gerarSugestoes,
    counts,
  }
}

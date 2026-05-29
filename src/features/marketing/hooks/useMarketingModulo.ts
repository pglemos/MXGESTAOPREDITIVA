import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Hook do Sprint 2 — S2-T3.
 *
 * Carrega Carteira da Empresa (N5), Posicionamento (N15) e Agenda Estratégica
 * Mensal (N14) em uma única chamada paralela.
 */

export type CarteiraFluxoEstado =
  | 'novo'
  | 'contato_inicial'
  | 'aquecimento'
  | 'negociacao'
  | 'convertido'
  | 'perdido'

export type CarteiraCliente = {
  id: string
  loja_id: string
  nome_cliente: string
  contato: string | null
  canal: 'whatsapp' | 'email' | 'telefone' | 'outro' | null
  score: number | null
  fluxo_estado: CarteiraFluxoEstado
  ultimo_contato: string | null
  proximo_contato: string | null
}

export type Posicionamento = {
  missao: string | null
  visao: string | null
  valores: string | null
  posicionamento: string | null
  publico_alvo: string | null
  diferenciais: string | null
  updated_at: string | null
}

export type AgendaMktStatus = 'planejado' | 'em_execucao' | 'concluido' | 'cancelado'

export type AgendaMktItem = {
  id: string
  loja_id: string
  mes_referencia: string
  acao: string
  canais: string[]
  responsavel_id: string | null
  data_alvo: string | null
  status: AgendaMktStatus
  observacoes: string | null
}

export type UseMarketingModuloResult = {
  carteira: CarteiraCliente[]
  posicionamento: Posicionamento | null
  agendaMensal: AgendaMktItem[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  carteiraCounts: Record<CarteiraFluxoEstado, number>
}

const EMPTY_COUNTS: Record<CarteiraFluxoEstado, number> = {
  novo: 0,
  contato_inicial: 0,
  aquecimento: 0,
  negociacao: 0,
  convertido: 0,
  perdido: 0,
}

export function useMarketingModulo(
  storeId: string | null | undefined,
): UseMarketingModuloResult {
  const [carteira, setCarteira] = useState<CarteiraCliente[]>([])
  const [posicionamento, setPosicionamento] = useState<Posicionamento | null>(null)
  const [agendaMensal, setAgendaMensal] = useState<AgendaMktItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!storeId) {
      setCarteira([])
      setPosicionamento(null)
      setAgendaMensal([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const today = new Date()
      const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
      const end = new Date(today.getFullYear(), today.getMonth() + 3, 0).toISOString().slice(0, 10)
      const [carteiraRes, posicRes, agendaRes] = await Promise.all([
        supabase
          .from('carteira_empresa')
          .select(
            'id, loja_id, nome_cliente, contato, canal, score, fluxo_estado, ultimo_contato, proximo_contato',
          )
          .eq('loja_id', storeId)
          .order('score', { ascending: false, nullsFirst: false })
          .limit(50),
        supabase
          .from('posicionamento_empresa')
          .select('missao, visao, valores, posicionamento, publico_alvo, diferenciais, updated_at')
          .eq('loja_id', storeId)
          .maybeSingle(),
        supabase
          .from('agenda_estrategica_marketing')
          .select(
            'id, loja_id, mes_referencia, acao, canais, responsavel_id, data_alvo, status, observacoes',
          )
          .eq('loja_id', storeId)
          .gte('mes_referencia', start)
          .lte('mes_referencia', end)
          .order('mes_referencia', { ascending: true }),
      ])
      if (carteiraRes.error) throw carteiraRes.error
      if (posicRes.error) throw posicRes.error
      if (agendaRes.error) throw agendaRes.error
      setCarteira((carteiraRes.data ?? []) as CarteiraCliente[])
      setPosicionamento((posicRes.data ?? null) as Posicionamento | null)
      setAgendaMensal((agendaRes.data ?? []) as AgendaMktItem[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar módulo Marketing.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const carteiraCounts = useMemo<Record<CarteiraFluxoEstado, number>>(() => {
    if (!carteira.length) return EMPTY_COUNTS
    return carteira.reduce(
      (acc, cliente) => {
        acc[cliente.fluxo_estado] = (acc[cliente.fluxo_estado] ?? 0) + 1
        return acc
      },
      { ...EMPTY_COUNTS },
    )
  }, [carteira])

  return {
    carteira,
    posicionamento,
    agendaMensal,
    loading,
    error,
    refresh: fetchAll,
    carteiraCounts,
  }
}

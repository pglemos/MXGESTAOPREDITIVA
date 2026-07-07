import { useCallback, useMemo, useState } from 'react'
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns'
import { useRanking } from '@/hooks/useRanking'
import { useAuth } from '@/hooks/useAuth'
import { useStoreMetaRules } from '@/hooks/useGoals'

export type RankingPeriodo = 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual'
export const RANKING_PERIODOS: RankingPeriodo[] = ['Mensal', 'Trimestral', 'Semestral', 'Anual']

const MESES_POR_PERIODO: Record<RankingPeriodo, number> = {
  Mensal: 1,
  Trimestral: 3,
  Semestral: 6,
  Anual: 12,
}

function toISODate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPeriodoRange(periodo: RankingPeriodo): { startDate: string; endDate: string } {
  const hoje = new Date()
  if (periodo === 'Trimestral') {
    return { startDate: toISODate(startOfQuarter(hoje)), endDate: toISODate(endOfQuarter(hoje)) }
  }
  if (periodo === 'Semestral') {
    const semestreInicioMes = hoje.getMonth() < 6 ? 0 : 6
    const inicio = new Date(hoje.getFullYear(), semestreInicioMes, 1)
    const fim = new Date(hoje.getFullYear(), semestreInicioMes + 6, 0)
    return { startDate: toISODate(inicio), endDate: toISODate(fim) }
  }
  if (periodo === 'Anual') {
    return { startDate: toISODate(startOfYear(hoje)), endDate: toISODate(endOfYear(hoje)) }
  }
  return { startDate: toISODate(startOfMonth(hoje)), endDate: toISODate(endOfMonth(hoje)) }
}

export type RankedVendedor = {
  id: string
  nome: string
  foto?: string | null
  unidade?: string
  vendas: number
  meta: number
  planoRemuneracao?: string | null
}

/**
 * Aggregator hook do Ranking por Loja — replica a estrutura de dados
 * do protótipo Base44 (Pódio, Sua posição, Corrida do período, Tabela),
 * com abas de período reais (Mensal/Trimestral/Semestral/Anual) usando
 * o mesmo pipeline de dados (useRanking + useStoreMetaRules).
 */
export function useStoreRankingPageData() {
  const { profile } = useAuth()
  const [periodo, setPeriodo] = useState<RankingPeriodo>('Mensal')
  const [unidade, setUnidade] = useState('todas')
  const [isRefetching, setIsRefetching] = useState(false)

  const { startDate, endDate } = useMemo(() => getPeriodoRange(periodo), [periodo])
  const { ranking, loading, error, refetch } = useRanking(undefined, { startDate, endDate })
  const { metaRules, fetchMetaRules } = useStoreMetaRules()

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true)
    try {
      await Promise.all([refetch(), fetchMetaRules()])
    } finally {
      setIsRefetching(false)
    }
  }, [refetch, fetchMetaRules])

  const metaPeriodo = (metaRules?.monthly_goal || 0) * MESES_POR_PERIODO[periodo]

  const todosVendedores = useMemo<RankedVendedor[]>(() => {
    return ranking
      .filter(r => !r.is_venda_loja)
      .map(r => ({
        id: r.user_id,
        nome: r.user_name,
        foto: r.avatar_url,
        unidade: r.store_name,
        vendas: r.vnd_total,
      meta: r.meta || metaPeriodo,
      planoRemuneracao: r.remuneracao_plano_cargo,
      }))
      .sort((a, b) => (b.vendas !== a.vendas ? b.vendas - a.vendas : a.nome.localeCompare(b.nome)))
  }, [ranking, metaPeriodo])

  const unidades = useMemo(() => {
    const set = new Set(todosVendedores.map(v => v.unidade).filter((u): u is string => Boolean(u)))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [todosVendedores])

  const vendedores = useMemo<RankedVendedor[]>(() => {
    if (unidade === 'todas') return todosVendedores
    return todosVendedores.filter(v => v.unidade === unidade)
  }, [todosVendedores, unidade])

  const top3 = vendedores.slice(0, 3)
  const meuIndex = vendedores.findIndex(v => v.id === profile?.id)
  const posicao = meuIndex + 1
  const euVendedor = meuIndex >= 0 ? vendedores[meuIndex] : null
  const atingimento = euVendedor && euVendedor.meta > 0 ? Math.round((euVendedor.vendas / euVendedor.meta) * 100) : 0

  let faltamValor: number | null = null
  if (posicao > 1 && euVendedor) {
    const acima = vendedores[posicao - 2]
    faltamValor = Math.max(0, acima.vendas - euVendedor.vendas)
  }

  return {
    loading,
    error,
    periodo,
    setPeriodo,
    unidade,
    setUnidade,
    unidades,
    isRefetching,
    handleRefresh,
    vendedores,
    top3,
    posicao,
    totalVendedores: vendedores.length,
    atingimento,
    faltamValor,
    euVendedor,
    metaPeriodo,
    meuId: profile?.id,
    profile,
  }
}

export type StoreRankingPageData = ReturnType<typeof useStoreRankingPageData>

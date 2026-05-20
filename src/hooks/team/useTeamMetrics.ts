import { useMemo } from 'react'
import type { TeamMember } from './types'

export type UseTeamMetricsInput = {
  sellers: TeamMember[]
}

export type TeamAggregatedMetrics = {
  total: number
  totalVendedores: number
  totalGerentes: number
  totalDonos: number
  ativos: number
  inativos: number
  checkinHoje: number
  disciplinaPct: number
}

export type UseTeamMetricsReturn = {
  metrics: TeamAggregatedMetrics
}

/**
 * Sub-hook: agregações derivadas a partir da lista de membros.
 *
 * Puro/memoizado — sem fetch próprio. Owna apenas cálculo a partir de `sellers`.
 */
export function useTeamMetrics({ sellers }: UseTeamMetricsInput): UseTeamMetricsReturn {
  const metrics = useMemo<TeamAggregatedMetrics>(() => {
    const total = sellers.length
    let totalVendedores = 0
    let totalGerentes = 0
    let totalDonos = 0
    let ativos = 0
    let inativos = 0
    let checkinHoje = 0

    for (const s of sellers) {
      if (s.role === 'vendedor') totalVendedores++
      else if (s.role === 'gerente') totalGerentes++
      else if (s.role === 'dono') totalDonos++

      const isAtivo = s.is_active ?? s.active ?? true
      if (isAtivo) ativos++
      else inativos++

      if (s.checkin_today) checkinHoje++
    }

    const disciplinaPct = totalVendedores > 0
      ? Math.min(100, Math.round((checkinHoje / totalVendedores) * 100))
      : 0

    return {
      total,
      totalVendedores,
      totalGerentes,
      totalDonos,
      ativos,
      inativos,
      checkinHoje,
      disciplinaPct,
    }
  }, [sellers])

  return { metrics }
}

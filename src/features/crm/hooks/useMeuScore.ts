import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export type MeuScore = {
  value: number
  band: string
  dimResultado: number | null
  dimProcesso: number | null
  dimDisciplina: number | null
  period: string
} | null

export const BAND_LABEL: Record<string, string> = {
  elite: 'Elite MX',
  excellent: 'Excelente',
  good: 'Bom',
  attention: 'Atenção',
  critical: 'Crítico',
}

export const NEXT_BAND: Record<string, string> = {
  critical: 'Atenção',
  attention: 'Bom',
  good: 'Excelente',
  excellent: 'Elite MX',
  elite: 'Elite MX',
}

/**
 * MX Score real do vendedor logado (último cálculo em score_calculations,
 * escopo individual). Valor 0–100 + banda + dimensões. Sem dado → null.
 */
export function useMeuScore() {
  const { supabaseUser } = useAuth()
  const [score, setScore] = useState<MeuScore>(null)
  const [loading, setLoading] = useState(true)

  const fetchScore = useCallback(async () => {
    if (!supabaseUser) { setScore(null); setLoading(false); return }
    setLoading(true)
    let { data } = await supabase
      .from('score_calculations')
      .select('value, band, dim_resultado, dim_processo, dim_disciplina, period')
      .eq('scope_type', 'individual')
      .eq('scope_id', supabaseUser.id)
      .order('period', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Sem cálculo para o período: dispara o cálculo MVP (dados reais) e relê
    if (!data) {
      const { data: computed } = await supabase.rpc('compute_individual_score_mvp', {})
      if (computed) {
        const row = Array.isArray(computed) ? computed[0] : computed
        data = row
          ? {
              value: row.value,
              band: row.band,
              dim_resultado: row.dim_resultado,
              dim_processo: row.dim_processo,
              dim_disciplina: row.dim_disciplina,
              period: row.period,
            }
          : null
      }
    }

    if (data) {
      setScore({
        value: Math.round(Number(data.value)),
        band: data.band,
        dimResultado: data.dim_resultado != null ? Math.round(Number(data.dim_resultado)) : null,
        dimProcesso: data.dim_processo != null ? Math.round(Number(data.dim_processo)) : null,
        dimDisciplina: data.dim_disciplina != null ? Math.round(Number(data.dim_disciplina)) : null,
        period: data.period,
      })
    } else {
      setScore(null)
    }
    setLoading(false)
  }, [supabaseUser])

  useEffect(() => { fetchScore() }, [fetchScore])

  return { score, loading, refetch: fetchScore, bandLabel: BAND_LABEL, nextBand: NEXT_BAND }
}

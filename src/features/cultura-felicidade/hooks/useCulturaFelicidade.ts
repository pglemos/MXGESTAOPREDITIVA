import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Hook do Sprint 2 — S2-T5.
 *
 * Combina os registros de Cultura de Resultado (N11) com o Índice de Felicidade
 * agregado por ciclo (N12). Não expõe respostas individuais — só agregado.
 */

export type CulturaTipo = 'repescagem' | 'campanha' | 'reconhecimento' | 'feed_cultural'

export type CulturaRegistro = {
  id: string
  loja_id: string
  user_id: string | null
  tipo: CulturaTipo
  titulo: string
  mensagem: string | null
  alvo_role: string | null
  data_referencia: string
}

export type FelicidadeCiclo = {
  loja_id: string
  ciclo: string
  media_clima: number | null
  media_lideranca: number | null
  media_carreira: number | null
  total_respostas: number
}

export type UseCulturaFelicidadeResult = {
  registros: CulturaRegistro[]
  ciclos: FelicidadeCiclo[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  cicloAtual: FelicidadeCiclo | null
  mediasUltimos3: { ciclo: string; clima: number | null }[]
}

export function useCulturaFelicidade(
  storeId: string | null | undefined,
): UseCulturaFelicidadeResult {
  const [registros, setRegistros] = useState<CulturaRegistro[]>([])
  const [ciclos, setCiclos] = useState<FelicidadeCiclo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!storeId) {
      setRegistros([])
      setCiclos([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [registrosRes, ciclosRes] = await Promise.all([
        supabase
          .from('cultura_resultado_registros')
          .select('id, loja_id, user_id, tipo, titulo, mensagem, alvo_role, data_referencia')
          .eq('loja_id', storeId)
          .order('data_referencia', { ascending: false })
          .limit(20),
        supabase
          .from('indice_felicidade_agregado')
          .select('loja_id, ciclo, media_clima, media_lideranca, media_carreira, total_respostas')
          .eq('loja_id', storeId)
          .order('ciclo', { ascending: false })
          .limit(12),
      ])
      if (registrosRes.error) throw registrosRes.error
      if (ciclosRes.error) throw ciclosRes.error
      setRegistros((registrosRes.data ?? []) as CulturaRegistro[])
      setCiclos((ciclosRes.data ?? []) as FelicidadeCiclo[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar cultura/felicidade.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const cicloAtual = useMemo(() => ciclos[0] ?? null, [ciclos])
  const mediasUltimos3 = useMemo(
    () =>
      ciclos
        .slice(0, 3)
        .map((c) => ({ ciclo: c.ciclo, clima: c.media_clima }))
        .reverse(),
    [ciclos],
  )

  return { registros, ciclos, loading, error, refresh: fetchAll, cicloAtual, mediasUltimos3 }
}

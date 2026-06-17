import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  CADENCIA_FLUXOS_PADRAO,
  type FluxoCanal,
  type CadenciaFluxoConfiguravel,
  type CadenciaPassoConfiguravel,
} from '../lib/cadencia'

const FLUXO_CANAIS: FluxoCanal[] = ['internet', 'carteira', 'porta']

function isFluxoCanal(value: string): value is FluxoCanal {
  return FLUXO_CANAIS.includes(value as FluxoCanal)
}

/**
 * Transforma um row de `cadencia_fluxos` (DB) em `CadenciaFluxoConfiguravel`.
 * O campo `passos` é armazenado como JSON no banco e tem a mesma estrutura
 * de `CadenciaPassoConfiguravel[]`.
 */
function rowToFluxo(row: {
  canal: string
  version: number
  nome: string
  passos: unknown
}): CadenciaFluxoConfiguravel | null {
  if (!isFluxoCanal(row.canal)) return null
  const passos = row.passos as CadenciaPassoConfiguravel[]
  if (!Array.isArray(passos) || passos.length === 0) return null
  return {
    canal: row.canal,
    versao: row.version,
    nome: row.nome,
    passos,
  }
}

export type UseCadenciaFluxosResult = {
  fluxos: Record<FluxoCanal, CadenciaFluxoConfiguravel>
  loading: boolean
  error: string | null
}

/**
 * Carrega configurações de cadência da tabela `cadencia_fluxos` no Supabase.
 *
 * - Filtra por `loja_id` do vendedor autenticado (via `useAuth`).
 * - Busca apenas registros `active = true`, ordenados por `version desc`
 *   (pega a versão mais recente por canal).
 * - Fallback automático para `CADENCIA_FLUXOS_PADRAO` se o banco retornar
 *   vazio ou falhar.
 */
export function useCadenciaFluxos(): UseCadenciaFluxosResult {
  const { activeStoreId, storeId } = useAuth()
  const lojaId = activeStoreId || storeId || null

  const [rows, setRows] = useState<
    Array<{ canal: string; version: number; nome: string; passos: unknown }>
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!lojaId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('cadencia_fluxos')
        .select('canal, version, nome, passos')
        .eq('loja_id', lojaId)
        .eq('active', true)
        .order('version', { ascending: false })

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
        setRows([])
      } else {
        setRows(data ?? [])
      }
      setLoading(false)
    }

    void fetch()
    return () => { cancelled = true }
  }, [lojaId])

  const fluxos = useMemo<Record<FluxoCanal, CadenciaFluxoConfiguravel>>(() => {
    if (rows.length === 0) return CADENCIA_FLUXOS_PADRAO

    // Pega a primeira linha por canal (version desc já garante a mais recente)
    const seen = new Set<string>()
    const result: Partial<Record<FluxoCanal, CadenciaFluxoConfiguravel>> = {}

    for (const row of rows) {
      if (seen.has(row.canal)) continue
      seen.add(row.canal)
      const fluxo = rowToFluxo(row)
      if (fluxo) result[fluxo.canal] = fluxo
    }

    // Garante que todos os canais existam (fallback por canal individual)
    for (const canal of FLUXO_CANAIS) {
      if (!result[canal]) result[canal] = CADENCIA_FLUXOS_PADRAO[canal]
    }

    return result as Record<FluxoCanal, CadenciaFluxoConfiguravel>
  }, [rows])

  return { fluxos, loading, error }
}

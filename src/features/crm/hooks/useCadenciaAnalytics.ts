import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  buildCadenciaAnalytics,
  type CadenciaAnalyticsEstado,
  type CadenciaAnalyticsOportunidade,
} from '@/features/crm/lib/cadencia-analytics'
import type { OportunidadeComCliente } from '@/features/crm/hooks/useOportunidades'
import type { Database } from '@/types/database.generated'

type CadenciaEstadoRow = Database['public']['Tables']['cadencia_estado_cliente']['Row']

export function useCadenciaAnalytics(oportunidades: OportunidadeComCliente[] = []) {
  const { profile, role, activeStoreId, storeId } = useAuth()
  const effectiveStoreId = activeStoreId || storeId || null
  const [estados, setEstados] = useState<CadenciaAnalyticsEstado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!profile?.id) {
      setEstados([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    let query = supabase.from('cadencia_estado_cliente').select('*')
    if (role === 'vendedor') query = query.eq('seller_user_id', profile.id)
    else if (effectiveStoreId) query = query.eq('loja_id', effectiveStoreId)
    else query = query.eq('seller_user_id', profile.id)

    const { data, error: fetchError } = await query.order('updated_at', { ascending: false })
    if (fetchError) {
      setError(fetchError.message)
      setEstados([])
    } else {
      setEstados((data ?? []).map(normalizeEstado))
    }
    setLoading(false)
  }, [effectiveStoreId, profile?.id, role])

  useEffect(() => { void refetch() }, [refetch])

  const oportunidadesAnalytics = useMemo<CadenciaAnalyticsOportunidade[]>(() => {
    return oportunidades.map(oportunidade => ({
      id: oportunidade.id,
      cliente_id: oportunidade.cliente_id,
      loja_id: oportunidade.loja_id,
      etapa: oportunidade.etapa,
      tipo_veiculo: oportunidade.tipo_veiculo,
      valor_negociado: Number(oportunidade.valor_negociado || 0),
    }))
  }, [oportunidades])

  const analytics = useMemo(() => {
    return buildCadenciaAnalytics({ estados, oportunidades: oportunidadesAnalytics })
  }, [estados, oportunidadesAnalytics])

  return { analytics, estados, loading, error, refetch }
}

function normalizeEstado(row: CadenciaEstadoRow): CadenciaAnalyticsEstado {
  return {
    id: row.id,
    cliente_id: row.cliente_id,
    loja_id: row.loja_id,
    seller_user_id: row.seller_user_id,
    fluxo_id: row.fluxo_id,
    fluxo_version: row.fluxo_version,
    etapa_atual: row.etapa_atual,
    passo_atual_key: row.passo_atual_key,
    status: row.status,
    last_result: row.last_result,
    tentativas_passo: row.tentativas_passo,
    tentativa_limite: row.tentativa_limite,
    reagendamentos_sem_sucesso: row.reagendamentos_sem_sucesso,
    historico: row.historico,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

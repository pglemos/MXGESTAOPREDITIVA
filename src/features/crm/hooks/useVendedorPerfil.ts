import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export type CarreiraInteresse = 'nao' | 'confidencial' | 'disponivel'

export type VendedorPerfil = {
  hora_entrada: string | null
  hora_almoco_inicio: string | null
  hora_almoco_fim: string | null
  hora_saida: string | null
  dias_trabalho: string[]
  fechar_dia_notificacao_ativa: boolean
  fechar_dia_notificacao_hora: string | null
  objetivo_curto: string | null
  objetivo_medio: string | null
  objetivo_longo: string | null
  carreira_interesse: CarreiraInteresse
  pretensao_min: number | null
  pretensao_max: number | null
  cargos_interesse: string | null
  cidades_interesse: string | null
}

export const DIAS_SEMANA: { code: string; label: string }[] = [
  { code: 'seg', label: 'Seg' },
  { code: 'ter', label: 'Ter' },
  { code: 'qua', label: 'Qua' },
  { code: 'qui', label: 'Qui' },
  { code: 'sex', label: 'Sex' },
  { code: 'sab', label: 'Sáb' },
  { code: 'dom', label: 'Dom' },
]

const DEFAULT_PERFIL: VendedorPerfil = {
  hora_entrada: null, hora_almoco_inicio: null, hora_almoco_fim: null, hora_saida: null,
  dias_trabalho: ['seg', 'ter', 'qua', 'qui', 'sex'],
  fechar_dia_notificacao_ativa: true, fechar_dia_notificacao_hora: null,
  objetivo_curto: null, objetivo_medio: null, objetivo_longo: null,
  carreira_interesse: 'nao', pretensao_min: null, pretensao_max: null,
  cargos_interesse: null, cidades_interesse: null,
}

export function useVendedorPerfil() {
  const { supabaseUser, activeStoreId, storeId } = useAuth()
  const effectiveStoreId = activeStoreId || storeId || null
  const [perfil, setPerfil] = useState<VendedorPerfil>(DEFAULT_PERFIL)
  const [exists, setExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPerfil = useCallback(async () => {
    if (!supabaseUser) { setLoading(false); return }
    setLoading(true); setError(null)
    const { data, error: fetchError } = await supabase
      .from('vendedor_perfil')
      .select('*')
      .eq('seller_user_id', supabaseUser.id)
      .maybeSingle()
    if (fetchError) {
      setError(fetchError.message)
    } else if (data) {
      setExists(true)
      setPerfil({
        hora_entrada: data.hora_entrada, hora_almoco_inicio: data.hora_almoco_inicio,
        hora_almoco_fim: data.hora_almoco_fim, hora_saida: data.hora_saida,
        dias_trabalho: data.dias_trabalho || [],
        fechar_dia_notificacao_ativa: data.fechar_dia_notificacao_ativa ?? true,
        fechar_dia_notificacao_hora: data.fechar_dia_notificacao_hora,
        objetivo_curto: data.objetivo_curto, objetivo_medio: data.objetivo_medio, objetivo_longo: data.objetivo_longo,
        carreira_interesse: data.carreira_interesse, pretensao_min: data.pretensao_min, pretensao_max: data.pretensao_max,
        cargos_interesse: data.cargos_interesse, cidades_interesse: data.cidades_interesse,
      })
    }
    setLoading(false)
  }, [supabaseUser])

  const savePerfil = useCallback(async (patch: Partial<VendedorPerfil>): Promise<{ error: string | null }> => {
    if (!supabaseUser) return { error: 'Sessão inválida.' }
    const merged = { ...perfil, ...patch }
    const payload = {
      seller_user_id: supabaseUser.id,
      loja_id: effectiveStoreId,
      hora_entrada: merged.hora_entrada || null,
      hora_almoco_inicio: merged.hora_almoco_inicio || null,
      hora_almoco_fim: merged.hora_almoco_fim || null,
      hora_saida: merged.hora_saida || null,
      dias_trabalho: merged.dias_trabalho,
      fechar_dia_notificacao_ativa: merged.fechar_dia_notificacao_ativa,
      fechar_dia_notificacao_hora: merged.fechar_dia_notificacao_hora || null,
      objetivo_curto: merged.objetivo_curto || null,
      objetivo_medio: merged.objetivo_medio || null,
      objetivo_longo: merged.objetivo_longo || null,
      carreira_interesse: merged.carreira_interesse,
      pretensao_min: merged.pretensao_min,
      pretensao_max: merged.pretensao_max,
      cargos_interesse: merged.cargos_interesse || null,
      cidades_interesse: merged.cidades_interesse || null,
    }
    const { error: upErr } = await supabase
      .from('vendedor_perfil')
      .upsert(payload, { onConflict: 'seller_user_id' })
    if (upErr) return { error: upErr.message }
    setPerfil(merged); setExists(true)
    return { error: null }
  }, [supabaseUser, effectiveStoreId, perfil])

  useEffect(() => { fetchPerfil() }, [fetchPerfil])

  return { perfil, setPerfil, exists, loading, error, refetch: fetchPerfil, savePerfil }
}

export { DEFAULT_PERFIL }

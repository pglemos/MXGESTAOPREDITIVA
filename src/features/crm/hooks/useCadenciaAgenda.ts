import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { CRM_CANAIS } from '@/lib/schemas/crm.schema'

export const CadenciaAgendaItemSchema = z.object({
  cadencia_estado_id: z.string().uuid(),
  cliente_id: z.string().uuid(),
  cliente_nome: z.string(),
  cliente_telefone: z.string().nullable(),
  loja_id: z.string().uuid(),
  seller_user_id: z.string().uuid(),
  canal: z.enum(CRM_CANAIS).nullable(),
  passo_atual_key: z.string(),
  etapa_atual: z.string(),
  proxima_acao: z.string(),
  proxima_acao_em: z.string(),
  status: z.string(),
  last_result: z.enum(['feito', 'nao_feito', 'aguardando']).nullable(),
})

export type CadenciaAgendaItem = z.infer<typeof CadenciaAgendaItemSchema>

export function parseCadenciaAgenda(data: unknown): CadenciaAgendaItem[] {
  if (!Array.isArray(data)) return []
  const out: CadenciaAgendaItem[] = []
  for (const row of data) {
    const parsed = CadenciaAgendaItemSchema.safeParse(row)
    if (parsed.success) out.push(parsed.data)
  }
  return out
}

export function useCadenciaAgenda() {
  const { supabaseUser } = useAuth()
  const [acoes, setAcoes] = useState<CadenciaAgendaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAcoes = useCallback(async () => {
    if (!supabaseUser) {
      setAcoes([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase.rpc('listar_acoes_cadencia_vendedor', {
      p_data_inicio: null,
      p_data_fim: null,
    })

    if (fetchError) {
      setError(fetchError.message)
      setAcoes([])
    } else {
      setAcoes(parseCadenciaAgenda(data))
    }
    setLoading(false)
  }, [supabaseUser])

  useEffect(() => { fetchAcoes() }, [fetchAcoes])

  return { acoes, loading, error, refetch: fetchAcoes }
}

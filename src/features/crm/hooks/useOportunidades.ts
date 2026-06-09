import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  OportunidadeSchema,
  CRM_ETAPAS_FUNIL,
  CRM_ETAPAS_ATIVAS,
  type Oportunidade,
  type CrmEtapaFunil,
  type CrmCanal,
  type CrmFinanciamento,
} from '@/lib/schemas/crm.schema'
import { z } from 'zod'

const OportunidadeComClienteSchema = OportunidadeSchema.extend({
  cliente: z.object({ nome: z.string(), telefone: z.string().nullable() }).nullable().optional(),
})
export type OportunidadeComCliente = z.infer<typeof OportunidadeComClienteSchema>

export type OportunidadeInput = {
  cliente_id: string
  veiculo_interesse?: string | null
  valor_negociado?: number
  etapa?: CrmEtapaFunil
  canal?: CrmCanal | null
  sinal?: number
  financiamento?: CrmFinanciamento
  carro_avaliado?: boolean
}

function parse(data: unknown): OportunidadeComCliente[] {
  if (!Array.isArray(data)) return []
  const out: OportunidadeComCliente[] = []
  for (const row of data) {
    const r = OportunidadeComClienteSchema.safeParse(row)
    if (r.success) out.push(r.data)
  }
  return out
}

export function useOportunidades() {
  const { supabaseUser, activeStoreId, storeId } = useAuth()
  const effectiveStoreId = activeStoreId || storeId || null
  const [oportunidades, setOportunidades] = useState<OportunidadeComCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOportunidades = useCallback(async () => {
    if (!supabaseUser) { setOportunidades([]); setLoading(false); return }
    setLoading(true); setError(null)
    const { data, error: fetchError } = await supabase
      .from('oportunidades')
      .select('*, cliente:clientes(nome, telefone)')
      .eq('seller_user_id', supabaseUser.id)
      .order('updated_at', { ascending: false })
    if (fetchError) { setError(fetchError.message); setOportunidades([]) }
    else setOportunidades(parse(data))
    setLoading(false)
  }, [supabaseUser])

  const createOportunidade = useCallback(async (input: OportunidadeInput): Promise<{ error: string | null }> => {
    if (!supabaseUser) return { error: 'Sessão inválida.' }
    if (!effectiveStoreId) return { error: 'Loja não identificada para o vendedor.' }
    if (!input.cliente_id) return { error: 'Selecione o cliente da oportunidade.' }
    const payload = {
      cliente_id: input.cliente_id,
      loja_id: effectiveStoreId,
      seller_user_id: supabaseUser.id,
      veiculo_interesse: input.veiculo_interesse?.trim() || null,
      valor_negociado: input.valor_negociado ?? 0,
      etapa: input.etapa || 'prospeccao',
      canal: input.canal || null,
      sinal: input.sinal ?? 0,
      financiamento: input.financiamento || 'nao_aplica',
      carro_avaliado: input.carro_avaliado ?? false,
    }
    const { error: insertError } = await supabase.from('oportunidades').insert(payload)
    if (insertError) return { error: insertError.message }
    await fetchOportunidades()
    return { error: null }
  }, [supabaseUser, effectiveStoreId, fetchOportunidades])

  const updateEtapa = useCallback(async (id: string, etapa: CrmEtapaFunil, motivoPerda?: string): Promise<{ error: string | null }> => {
    if (!supabaseUser) return { error: 'Sessão inválida.' }
    const isTerminal = etapa === 'ganho' || etapa === 'perdido'
    const patch: Record<string, unknown> = {
      etapa,
      closed_at: isTerminal ? new Date().toISOString() : null,
      motivo_perda: etapa === 'perdido' ? (motivoPerda?.trim() || null) : null,
    }
    const { error: updateError } = await supabase.from('oportunidades').update(patch).eq('id', id)
    if (updateError) return { error: updateError.message }
    await fetchOportunidades()
    return { error: null }
  }, [supabaseUser, fetchOportunidades])

  const deleteOportunidade = useCallback(async (id: string): Promise<{ error: string | null }> => {
    if (!supabaseUser) return { error: 'Sessão inválida.' }
    const { error: delError } = await supabase.from('oportunidades').delete().eq('id', id)
    if (delError) return { error: delError.message }
    await fetchOportunidades()
    return { error: null }
  }, [supabaseUser, fetchOportunidades])

  useEffect(() => { fetchOportunidades() }, [fetchOportunidades])

  // Funil: contagem + valor por etapa, conversão entre etapas ativas, ticket médio
  const funil = useMemo(() => {
    const porEtapa = CRM_ETAPAS_FUNIL.map(etapa => {
      const itens = oportunidades.filter(o => o.etapa === etapa)
      const valor = itens.reduce((acc, o) => acc + (o.valor_negociado || 0), 0)
      return { etapa, quantidade: itens.length, valor }
    })

    const base = porEtapa.find(e => e.etapa === 'prospeccao')?.quantidade || 0
    const stagesAtivas = porEtapa.filter(e => CRM_ETAPAS_ATIVAS.includes(e.etapa))
    const stagesComConversao = stagesAtivas.map((e, idx) => {
      const ref = idx === 0 ? (base || e.quantidade) : stagesAtivas[0].quantidade
      const conversao = ref > 0 ? Math.round((e.quantidade / ref) * 1000) / 10 : 0
      return { ...e, conversao }
    })

    const ganhos = porEtapa.find(e => e.etapa === 'ganho')
    const perdidos = porEtapa.find(e => e.etapa === 'perdido')
    const totalOportunidades = oportunidades.length
    const taxaConversaoGeral = totalOportunidades > 0 && ganhos ? Math.round((ganhos.quantidade / totalOportunidades) * 1000) / 10 : 0
    const ticketMedio = ganhos && ganhos.quantidade > 0 ? ganhos.valor / ganhos.quantidade : 0
    const valorTotalFunil = stagesAtivas.reduce((acc, e) => acc + e.valor, 0)

    return {
      porEtapa, stagesComConversao,
      ganhos: ganhos || { etapa: 'ganho' as const, quantidade: 0, valor: 0 },
      perdidos: perdidos || { etapa: 'perdido' as const, quantidade: 0, valor: 0 },
      taxaConversaoGeral, ticketMedio, valorTotalFunil, totalOportunidades,
    }
  }, [oportunidades])

  return { oportunidades, funil, loading, error, refetch: fetchOportunidades, createOportunidade, updateEtapa, deleteOportunidade }
}

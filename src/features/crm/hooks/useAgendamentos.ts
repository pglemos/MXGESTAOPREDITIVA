import { useCallback, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  AgendamentoSchema,
  type CrmCanal,
  type CrmAgendamentoTipo,
  type CrmAgendamentoStatus,
} from '@/lib/schemas/crm.schema'
import { eventoJaExiste, registrarEventoComercial } from '@/features/crm/lib/eventosComerciais'
import type { CrmEventoTipo } from '@/lib/schemas/crm.schema'

/** Garantia e pós-venda não são "compromisso futuro" no sentido do funil — já nascem como o fato realizado. */
export function eventoDeCriacaoParaTipo(tipo: CrmAgendamentoTipo): CrmEventoTipo {
  if (tipo === 'garantia') return 'garantia_registrada'
  if (tipo === 'pos_venda') return 'pos_venda_realizado'
  return 'agendamento_criado'
}

const AgendamentoComClienteSchema = AgendamentoSchema.extend({
  cliente: z.object({ nome: z.string(), telefone: z.string().nullable() }).nullable().optional(),
  oportunidade: z.object({
    veiculo_interesse: z.string().nullable(),
    valor_negociado: z.coerce.number().nullable().optional(),
  }).nullable().optional(),
})
export type AgendamentoComCliente = z.infer<typeof AgendamentoComClienteSchema>

export type AgendamentoInput = {
  cliente_id?: string | null
  oportunidade_id?: string | null
  data_hora: string
  canal?: CrmCanal | null
  tipo?: CrmAgendamentoTipo
  status?: CrmAgendamentoStatus
  proxima_acao?: string | null
  observacoes?: string | null
}

function parse(data: unknown): AgendamentoComCliente[] {
  if (!Array.isArray(data)) return []
  const out: AgendamentoComCliente[] = []
  for (const row of data) {
    const r = AgendamentoComClienteSchema.safeParse(row)
    if (r.success) out.push(r.data)
  }
  return out
}

const isSameDay = (iso: string, ref: Date) => {
  const d = new Date(iso)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate()
}

export function useAgendamentos() {
  const { supabaseUser, activeStoreId, storeId } = useAuth()
  const effectiveStoreId = activeStoreId || storeId || null
  const [agendamentos, setAgendamentos] = useState<AgendamentoComCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAgendamentos = useCallback(async () => {
    if (!supabaseUser) { setAgendamentos([]); setLoading(false); return }
    setLoading(true); setError(null)
    const { data, error: fetchError } = await supabase
      .from('agendamentos')
      .select('*, cliente:clientes(nome, telefone), oportunidade:oportunidades(veiculo_interesse, valor_negociado)')
      .eq('seller_user_id', supabaseUser.id)
      .order('data_hora', { ascending: true })
    if (fetchError) { setError(fetchError.message); setAgendamentos([]) }
    else setAgendamentos(parse(data))
    setLoading(false)
  }, [supabaseUser])

  const createAgendamento = useCallback(async (input: AgendamentoInput): Promise<{ error: string | null }> => {
    if (!supabaseUser) return { error: 'Sessão inválida.' }
    if (!effectiveStoreId) return { error: 'Loja não identificada para o vendedor.' }
    if (!input.data_hora) return { error: 'Informe data e hora do agendamento.' }
    const payload = {
      cliente_id: input.cliente_id || null,
      oportunidade_id: input.oportunidade_id || null,
      loja_id: effectiveStoreId,
      seller_user_id: supabaseUser.id,
      data_hora: new Date(input.data_hora).toISOString(),
      canal: input.canal || null,
      tipo: input.tipo || 'visita',
      status: input.status || 'aguardando',
      proxima_acao: input.proxima_acao?.trim() || null,
      observacoes: input.observacoes?.trim() || null,
    }
    const { data, error: insertError } = await supabase.from('agendamentos').insert(payload).select('id').single()
    if (insertError) return { error: insertError.message }

    if (data?.id && payload.cliente_id) {
      await registrarEventoComercial({
        clienteId: payload.cliente_id,
        oportunidadeId: payload.oportunidade_id,
        agendamentoId: data.id,
        tipoEvento: eventoDeCriacaoParaTipo(payload.tipo),
        canal: payload.canal,
        observacao: payload.observacoes,
      }, { lojaId: effectiveStoreId, sellerUserId: supabaseUser.id })
    }

    await fetchAgendamentos()
    return { error: null }
  }, [supabaseUser, effectiveStoreId, fetchAgendamentos])

  const updateAgendamento = useCallback(async (id: string, input: AgendamentoInput): Promise<{ error: string | null }> => {
    if (!supabaseUser) return { error: 'Sessão inválida.' }
    if (!input.data_hora) return { error: 'Informe data e hora do agendamento.' }
    const payload = {
      cliente_id: input.cliente_id || null,
      oportunidade_id: input.oportunidade_id || null,
      data_hora: new Date(input.data_hora).toISOString(),
      canal: input.canal || null,
      tipo: input.tipo || 'visita',
      status: input.status || 'aguardando',
      proxima_acao: input.proxima_acao?.trim() || null,
      observacoes: input.observacoes?.trim() || null,
    }
    const { error: updateError } = await supabase
      .from('agendamentos')
      .update(payload)
      .eq('id', id)
      .eq('seller_user_id', supabaseUser.id)
    if (updateError) return { error: updateError.message }
    await fetchAgendamentos()
    return { error: null }
  }, [supabaseUser, fetchAgendamentos])

  const updateStatus = useCallback(async (id: string, status: CrmAgendamentoStatus): Promise<{ error: string | null }> => {
    if (!supabaseUser) return { error: 'Sessão inválida.' }
    const { error: updErr } = await supabase.from('agendamentos').update({ status }).eq('id', id)
    if (updErr) return { error: updErr.message }

    if (status === 'compareceu' && effectiveStoreId) {
      const jaRegistrado = await eventoJaExiste(id, 'atendimento_comercial_realizado', 'agendamento_id')
      if (!jaRegistrado) {
        const agendamento = agendamentos.find(a => a.id === id)
        if (agendamento?.cliente_id) {
          await registrarEventoComercial({
            clienteId: agendamento.cliente_id,
            oportunidadeId: agendamento.oportunidade_id,
            agendamentoId: id,
            tipoEvento: 'atendimento_comercial_realizado',
            canal: agendamento.canal,
          }, { lojaId: effectiveStoreId, sellerUserId: supabaseUser.id })
        }
      }
    }

    await fetchAgendamentos()
    return { error: null }
  }, [supabaseUser, effectiveStoreId, fetchAgendamentos, agendamentos])

  const deleteAgendamento = useCallback(async (id: string): Promise<{ error: string | null }> => {
    if (!supabaseUser) return { error: 'Sessão inválida.' }
    const { error: delErr } = await supabase.from('agendamentos').delete().eq('id', id)
    if (delErr) return { error: delErr.message }
    await fetchAgendamentos()
    return { error: null }
  }, [supabaseUser, fetchAgendamentos])

  useEffect(() => { fetchAgendamentos() }, [fetchAgendamentos])

  const metrics = useMemo(() => {
    const hoje = new Date()
    const doDia = agendamentos.filter(a => isSameDay(a.data_hora, hoje))
    const agendamentosHoje = doDia.length
    const compareceram = doDia.filter(a => a.status === 'compareceu').length
    const naoCompareceram = doDia.filter(a => a.status === 'nao_compareceu').length
    const confirmados = doDia.filter(a => a.status === 'confirmado').length
    const aguardando = doDia.filter(a => a.status === 'aguardando').length
    const emNegociacao = doDia.filter(a => a.tipo === 'negociacao').length
    const vendasRealizadas = doDia.filter(a => a.tipo === 'entrega' || a.status === 'compareceu').length
    const taxaComparecimento = agendamentosHoje > 0 ? Math.round((compareceram / agendamentosHoje) * 100) : 0
    return { agendamentosHoje, compareceram, naoCompareceram, confirmados, aguardando, emNegociacao, vendasRealizadas, taxaComparecimento }
  }, [agendamentos])

  return { agendamentos, metrics, loading, error, refetch: fetchAgendamentos, createAgendamento, updateAgendamento, updateStatus, deleteAgendamento }
}

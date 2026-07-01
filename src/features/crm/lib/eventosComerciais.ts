import { supabase } from '@/lib/supabase'
import type { CrmCanal, CrmEventoModalidade, CrmEventoTipo } from '@/lib/schemas/crm.schema'

export type EventoComercialInput = {
  clienteId: string
  oportunidadeId?: string | null
  agendamentoId?: string | null
  tipoEvento: CrmEventoTipo
  canal?: CrmCanal | null
  modalidade?: CrmEventoModalidade | null
  origemModulo?: string
  observacao?: string | null
  dataEvento?: string
}

export function buildEventoComercialPayload(
  input: EventoComercialInput,
  context: { lojaId: string; sellerUserId: string },
) {
  return {
    cliente_id: input.clienteId,
    oportunidade_id: input.oportunidadeId || null,
    agendamento_id: input.agendamentoId || null,
    loja_id: context.lojaId,
    seller_user_id: context.sellerUserId,
    tipo_evento: input.tipoEvento,
    canal: input.canal || null,
    modalidade: input.modalidade || null,
    origem_modulo: input.origemModulo || 'crm',
    observacao: input.observacao?.trim() || null,
    ...(input.dataEvento ? { data_evento: input.dataEvento } : {}),
  }
}

/**
 * Registra um fato comercial real (fonte do Funil de Vendas). Best-effort:
 * loga e não lança — um evento perdido não pode travar o fluxo principal
 * (criar cliente/oportunidade/agendamento).
 */
export async function registrarEventoComercial(
  input: EventoComercialInput,
  context: { lojaId: string; sellerUserId: string },
): Promise<{ error: string | null }> {
  const payload = buildEventoComercialPayload(input, context)
  const { error } = await supabase.from('eventos_comerciais').insert(payload)
  if (error) {
    console.error('Erro ao registrar evento comercial:', input.tipoEvento, error.message)
    return { error: error.message }
  }
  return { error: null }
}

/**
 * Idempotência: evita registrar o mesmo evento duas vezes para a mesma
 * oportunidade/agendamento (ex.: marcar "ganho" mais de uma vez não deve
 * duplicar venda_realizada; marcar "compareceu" de novo não deve duplicar
 * atendimento_comercial_realizado).
 */
export async function eventoJaExiste(
  refId: string,
  tipoEvento: CrmEventoTipo,
  refField: 'oportunidade_id' | 'agendamento_id' = 'oportunidade_id',
): Promise<boolean> {
  const { data } = await supabase
    .from('eventos_comerciais')
    .select('id')
    .eq(refField, refId)
    .eq('tipo_evento', tipoEvento)
    .limit(1)
    .maybeSingle()
  return !!data
}

import { describe, expect, it } from 'bun:test'
import { buildEventoComercialPayload } from './eventosComerciais'

const context = {
  lojaId: '11111111-1111-4111-8111-111111111111',
  sellerUserId: '22222222-2222-4222-8222-222222222222',
}

describe('buildEventoComercialPayload', () => {
  it('monta payload minimo com defaults', () => {
    const payload = buildEventoComercialPayload({
      clienteId: '33333333-3333-4333-8333-333333333333',
      tipoEvento: 'cliente_qualificado',
    }, context)

    expect(payload).toMatchObject({
      cliente_id: '33333333-3333-4333-8333-333333333333',
      oportunidade_id: null,
      agendamento_id: null,
      loja_id: context.lojaId,
      seller_user_id: context.sellerUserId,
      tipo_evento: 'cliente_qualificado',
      canal: null,
      modalidade: null,
      origem_modulo: 'crm',
      observacao: null,
    })
    expect(payload.data_evento).toBeUndefined()
  })

  it('preenche canal, modalidade, observacao e vinculos quando informados', () => {
    const payload = buildEventoComercialPayload({
      clienteId: '33333333-3333-4333-8333-333333333333',
      oportunidadeId: '44444444-4444-4444-8444-444444444444',
      agendamentoId: '55555555-5555-4555-8555-555555555555',
      tipoEvento: 'venda_realizada',
      canal: 'internet',
      modalidade: 'videochamada',
      origemModulo: 'checkin',
      observacao: '  Venda sem atendimento comercial registrado previamente.  ',
      dataEvento: '2026-06-30T12:00:00-03:00',
    }, context)

    expect(payload).toMatchObject({
      oportunidade_id: '44444444-4444-4444-8444-444444444444',
      agendamento_id: '55555555-5555-4555-8555-555555555555',
      tipo_evento: 'venda_realizada',
      canal: 'internet',
      modalidade: 'videochamada',
      origem_modulo: 'checkin',
      observacao: 'Venda sem atendimento comercial registrado previamente.',
      data_evento: '2026-06-30T12:00:00-03:00',
    })
  })
})

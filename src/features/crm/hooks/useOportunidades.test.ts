import { describe, expect, it, mock } from 'bun:test'

mock.restore()

const { buildOportunidadePayload } = await import('./useOportunidades')

describe('buildOportunidadePayload', () => {
  it('monta payload de venda realizada com closed_at informado', () => {
    const payload = buildOportunidadePayload({
      cliente_id: 'cliente-1',
      veiculo_interesse: '  Corolla XEi  ',
      tipo_veiculo: 'carro',
      valor_negociado: 145000,
      etapa: 'ganho',
      canal: 'showroom',
      sinal: 10000,
      financiamento: 'aprovado',
      carro_avaliado: true,
      closed_at: '2026-06-15T12:00:00-03:00',
    }, {
      loja_id: 'loja-1',
      seller_user_id: 'seller-1',
    })

    expect(payload).toEqual({
      cliente_id: 'cliente-1',
      loja_id: 'loja-1',
      seller_user_id: 'seller-1',
      veiculo_interesse: 'Corolla XEi',
      tipo_veiculo: 'carro',
      valor_negociado: 145000,
      etapa: 'ganho',
      canal: 'showroom',
      sinal: 10000,
      financiamento: 'aprovado',
      carro_avaliado: true,
      motivo_perda: null,
      closed_at: '2026-06-15T12:00:00-03:00',
    })
  })

  it('mantem motivo_perda apenas para oportunidades perdidas', () => {
    const payload = buildOportunidadePayload({
      cliente_id: 'cliente-2',
      etapa: 'perdido',
      motivo_perda: '  Preco acima do orçamento  ',
    }, {
      loja_id: 'loja-1',
      seller_user_id: 'seller-1',
    }, () => '2026-06-16T10:00:00.000Z')

    expect(payload.motivo_perda).toBe('Preco acima do orçamento')
    expect(payload.closed_at).toBe('2026-06-16T10:00:00.000Z')
  })
})

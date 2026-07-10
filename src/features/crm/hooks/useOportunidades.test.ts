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
      data_competencia: null,
      origem_modulo: 'crm',
      fechamento_id: null,
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

  // P1-05/P0-05a (auditoria 2026-07-10): a previsão de entrega desaparecia ao
  // confirmar venda/perda ou editar outro campo, porque o payload de UPDATE
  // sempre gravava `data_entrega_prevista`/`placa_veiculo` com default null,
  // mesmo quando o caller (confirmVenda, confirmPerda, CheckinCrmSection) não
  // tinha esses campos no seu formulário local.
  describe('placa_veiculo / data_entrega_prevista — update esparso (P0-05a)', () => {
    it('omite as duas chaves do payload quando o caller não as informa (edição não deve apagar o que já estava salvo)', () => {
      const payload = buildOportunidadePayload({
        cliente_id: 'cliente-3',
        etapa: 'ganho',
        closed_at: '2026-07-10T12:00:00.000Z',
        // simula confirmVenda/confirmPerda: não tocam em placa/entrega
      }, { loja_id: 'loja-1', seller_user_id: 'seller-1' })

      expect('placa_veiculo' in payload).toBe(false)
      expect('data_entrega_prevista' in payload).toBe(false)
    })

    it('grava normalmente quando o caller informa os dois campos (fluxo de criação/edição que os possui)', () => {
      const payload = buildOportunidadePayload({
        cliente_id: 'cliente-4',
        placa_veiculo: '  abc1234  ',
        data_entrega_prevista: '2026-07-15T14:00:00.000Z',
      }, { loja_id: 'loja-1', seller_user_id: 'seller-1' })

      expect(payload.placa_veiculo).toBe('abc1234')
      expect(payload.data_entrega_prevista).toBe('2026-07-15T14:00:00.000Z')
    })

    it('permite limpar explicitamente enviando null (distinto de não informar)', () => {
      const payload = buildOportunidadePayload({
        cliente_id: 'cliente-5',
        placa_veiculo: null,
        data_entrega_prevista: null,
      }, { loja_id: 'loja-1', seller_user_id: 'seller-1' })

      expect(payload.placa_veiculo).toBeNull()
      expect(payload.data_entrega_prevista).toBeNull()
    })
  })
})

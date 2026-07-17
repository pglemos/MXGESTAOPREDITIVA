import { describe, expect, it } from 'bun:test'
import { buildExistingClientFormPatch, findMostRecentClientAppointment, findRecentClientAppointment } from './existing-client-lookup'

const cliente = {
  id: '11111111-1111-4111-8111-111111111111',
  nome: 'João Santos',
  telefone: '(31) 98888-8888',
  canal_origem: 'carteira' as const,
  empresa: null,
  observacoes: 'Retornar após aprovação do financiamento.',
}

describe('existing client lookup', () => {
  it('constrói patch com os dados comerciais já cadastrados', () => {
    const patch = buildExistingClientFormPatch({
      cliente,
      oportunidade: {
        veiculo_interesse: 'HB20 1.0 COMFORT',
        valor_negociado: 68900,
        etapa: 'negociacao',
        financiamento: 'aprovado',
        carro_avaliado: true,
      },
    })

    expect(patch).toMatchObject({
      nome: 'JOÃO SANTOS',
      whatsapp: '(31) 98888-8888',
      canal: 'Carteira',
      veiculo_texto: 'HB20 1.0 COMFORT',
      valor_negociado: 'R$ 68.900,00',
      negociacao: 'negociacao',
      financiamento: 'Aprovado',
      possui_troca: 'Sim',
      observacao: 'Retornar após aprovação do financiamento.',
    })
  })

  it('encontra o agendamento mais recente do cliente para exibir na ficha', () => {
    const atual = { id: 'ag-2', cliente_id: cliente.id, data_hora: '2026-07-14T14:00:00-03:00' }
    const anterior = { id: 'ag-1', cliente_id: cliente.id, data_hora: '2026-06-20T14:00:00-03:00' }

    expect(findMostRecentClientAppointment([anterior, atual], cliente.id)).toEqual(atual)
  })

  it('bloqueia agendamento com data exatamente 90 dias antes da referência', () => {
    const agendamento = { id: 'ag-90', cliente_id: cliente.id, data_hora: '2026-04-16T09:00:00-03:00' }

    expect(findRecentClientAppointment([agendamento], cliente.id, '2026-07-15')).toEqual(agendamento)
  })

  it('permite agendamento fora da janela e ignora datas inválidas', () => {
    const antigo = { id: 'ag-antigo', cliente_id: cliente.id, data_hora: '2026-04-15T09:00:00-03:00' }
    const invalido = { id: 'ag-invalido', cliente_id: cliente.id, data_hora: 'data inválida' }

    expect(findRecentClientAppointment([antigo, invalido], cliente.id, '2026-07-15')).toBeNull()
  })
})

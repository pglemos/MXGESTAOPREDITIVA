import { describe, expect, it } from 'bun:test'
import { deriveAgendaHojeFromCrm, type AgendamentoForAgendaHoje, type OportunidadeForAgendaHoje } from './agenda-hoje'

const HOJE = '2026-06-26'

function op(overrides: Partial<OportunidadeForAgendaHoje> = {}): OportunidadeForAgendaHoje {
  return {
    id: 'op-1',
    cliente_id: 'cli-1',
    seller_user_id: 'seller-1',
    veiculo_interesse: 'Compass',
    tipo_veiculo: 'carro',
    valor_negociado: 0,
    etapa: 'negociacao',
    canal: 'carteira',
    sinal: 0,
    financiamento: 'nao_aplica',
    carro_avaliado: false,
    motivo_perda: null,
    created_at: `${HOJE}T08:00:00.000Z`,
    cliente: { nome: 'Carlos Mendes', telefone: '31999998888' },
    ...overrides,
  }
}

function ag(overrides: Partial<AgendamentoForAgendaHoje> = {}): AgendamentoForAgendaHoje {
  return {
    id: 'ag-1',
    cliente_id: 'cli-1',
    oportunidade_id: 'op-1',
    data_hora: `${HOJE}T12:00:00.000Z`,
    canal: 'carteira',
    tipo: 'retorno',
    status: 'aguardando',
    proxima_acao: 'Apresentação do veículo',
    observacoes: null,
    ...overrides,
  }
}

describe('deriveAgendaHojeFromCrm', () => {
  it('Teste 1/2: inclui oportunidade Em Negociação com agendamento hoje (origem Fechamento ou Carteira é indiferente — mesma fonte)', () => {
    const result = deriveAgendaHojeFromCrm([op()], [ag()], HOJE)
    expect(result).toHaveLength(1)
    expect(result[0].clienteNome).toBe('Carlos Mendes')
  })

  it('inclui agendamento de hoje mesmo quando a oportunidade vinculada já foi ganha (ex.: acompanhamento pós-venda)', () => {
    const result = deriveAgendaHojeFromCrm([op({ etapa: 'ganho' })], [ag()], HOJE)
    expect(result).toHaveLength(1)
  })

  it('inclui agendamento de hoje mesmo quando a oportunidade vinculada já foi perdida', () => {
    const result = deriveAgendaHojeFromCrm([op({ etapa: 'perdido' })], [ag()], HOJE)
    expect(result).toHaveLength(1)
  })

  it('inclui agendamento de hoje sem nenhuma oportunidade vinculada (atividade avulsa criada via Nova Atividade)', () => {
    const result = deriveAgendaHojeFromCrm([], [ag({ oportunidade_id: null })], HOJE)
    expect(result).toHaveLength(1)
    expect(result[0].oportunidadeId).toBeNull()
  })

  it('Teste 3: exclui quando o agendamento foi reagendado para amanhã (sem duplicar, sem precisar de lógica de remoção — é a mesma fonte recalculada)', () => {
    const result = deriveAgendaHojeFromCrm([op()], [ag({ data_hora: '2026-06-27T12:00:00.000Z' })], HOJE)
    expect(result).toHaveLength(0)
  })

  it('exclui oportunidade sem nenhum agendamento hoje vinculado', () => {
    const result = deriveAgendaHojeFromCrm([op()], [], HOJE)
    expect(result).toHaveLength(0)
  })

  it('usa o agendamento mais recente quando há mais de um vinculado à mesma oportunidade', () => {
    const result = deriveAgendaHojeFromCrm(
      [op()],
      [
        ag({ id: 'ag-velho', data_hora: '2026-06-20T12:00:00.000Z' }),
        ag({ id: 'ag-novo', data_hora: `${HOJE}T15:00:00.000Z` }),
      ],
      HOJE,
    )
    expect(result).toHaveLength(1)
    expect(result[0].agendamentoId).toBe('ag-novo')
  })

  it('ordena atrasados-não-tratados primeiro, depois por horário crescente, e exclui os já tratados', () => {
    const now = new Date(`${HOJE}T14:00:00.000Z`)
    const result = deriveAgendaHojeFromCrm(
      [
        op({ id: 'op-futuro', cliente: { nome: 'Futuro', telefone: null } }),
        op({ id: 'op-atrasado', cliente: { nome: 'Atrasado', telefone: null } }),
        op({ id: 'op-cedo', cliente: { nome: 'Cedo', telefone: null } }),
      ],
      [
        ag({ id: 'ag-futuro', oportunidade_id: 'op-futuro', data_hora: `${HOJE}T18:00:00.000Z`, status: 'aguardando' }),
        ag({ id: 'ag-atrasado', oportunidade_id: 'op-atrasado', data_hora: `${HOJE}T10:00:00.000Z`, status: 'aguardando' }),
        ag({ id: 'ag-cedo', oportunidade_id: 'op-cedo', data_hora: `${HOJE}T09:00:00.000Z`, status: 'compareceu' }),
      ],
      HOJE,
      now,
    )
    // "Cedo" já foi tratado (compareceu) e some da lista — igual ao Base44 AbaHoje.jsx.
    expect(result.map(r => r.clienteNome)).toEqual(['Atrasado', 'Futuro'])
  })

  it('exclui da lista um agendamento já tratado (compareceu/não compareceu), mesmo se estava vencido', () => {
    const now = new Date(`${HOJE}T14:00:00.000Z`)
    const result = deriveAgendaHojeFromCrm(
      [op()],
      [ag({ data_hora: `${HOJE}T09:00:00.000Z`, status: 'compareceu' })],
      HOJE,
      now,
    )
    expect(result).toHaveLength(0)
  })
})

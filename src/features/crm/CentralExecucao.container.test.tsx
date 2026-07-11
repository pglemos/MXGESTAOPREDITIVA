import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
// Importado estaticamente (antes de qualquer mock.module abaixo) pra preservar
// a função pura real no mock do hook — outros arquivos de teste (ex.:
// useScoreRotina.test.ts) também resolvem esse mesmo path e quebrariam se o
// mock só expusesse `useScoreRotina`.
import { calcularScoreRotina } from '@/features/crm/hooks/useScoreRotina'

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
const toastSuccess = mock(() => {})
const toastError = mock(() => {})
const toastInfo = mock(() => {})

let oportunidadesMock: unknown[] = []
let agendamentosMock: unknown[] = []
let scoreMock = { score: 10, items: [{ label: 'Abriu a Central de Execução', value: '10pts', done: true }] }
const organizacaoTemplate = {
  tipo: 'organizacao',
  nome: 'Organização do Dia',
  objetivo: 'Sair da organização sabendo quais clientes e ações devem ser priorizados.',
  ordem: 2,
  duracao_minutos: 40,
  instrucoes: ['Confira os agendamentos de hoje'],
  meta_sugerida: null,
  atalhos: [],
}
let routinePlaybookMock = {
  slots: [
    { key: 'mentalidade', time: '08:00', template: null, isCurrent: false },
    { key: 'organizacao', time: '08:15', template: organizacaoTemplate, isCurrent: true },
  ],
  currentSlot: {
    key: 'organizacao',
    time: '08:15',
    isCurrent: true,
    template: organizacaoTemplate,
  },
  prospeccaoHoje: [],
  storyIdeaHoje: null,
  conflitoCliente: null as null | { clienteNome: string },
}

mock.module('sonner', () => ({
  toast: { error: toastError, success: toastSuccess, info: toastInfo },
}))

mock.module('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: '22222222-2222-4222-8222-222222222222', name: 'Ana Vendedora' },
    activeStoreId: '44444444-4444-4444-8444-444444444444',
    storeId: null,
    supabaseUser: { id: '22222222-2222-4222-8222-222222222222' },
  }),
}))

mock.module('@/hooks/checkins', () => ({
  CHECKIN_DEADLINE_MINUTES: 570,
  CHECKIN_EDIT_LIMIT_MINUTES: 585,
  CHECKIN_DEADLINE_LABEL: '09:30',
  CHECKIN_EDIT_LIMIT_LABEL: '09:45',
  MX_TIMEZONE: 'America/Sao_Paulo',
  CHECKIN_ZERO_REASONS: ['Sem movimento'],
  CHECKIN_MAX_INPUT_VALUE: 999,
  CHECKIN_SELECT: '*',
  withCheckinTotals: (checkin: unknown) => checkin,
  calculateReferenceDate: () => today,
  isCheckinLate: () => false,
  canEditCurrentCheckin: () => true,
  getCheckinEditLockedAt: () => `${today}T12:45:00.000Z`,
  validateCheckinSubmissionDate: () => null,
  useCheckinsList: () => ({
    checkins: [],
    loading: false,
    error: null,
    setError: mock(),
    fetchCheckins: mock(async () => []),
  }),
  useMyCheckins: () => ({ checkins: [] }),
  useCheckinsByDateRange: () => ({
    checkins: [],
    loading: false,
    error: null,
    fetchCheckinsByDateRange: mock(async () => []),
  }),
  useCheckinsToday: () => ({ todayCheckin: null, fetchTodayCheckin: mock(async () => {}) }),
  useCheckinsByDate: () => ({ fetchCheckinByDate: mock(async () => null) }),
  useCheckinsSubmit: () => ({ saveCheckin: mock(async () => ({ error: null })) }),
}))

mock.module('@/features/crm/hooks/useOportunidades', () => ({
  useOportunidades: () => ({
    oportunidades: oportunidadesMock,
    updateOportunidade: mock(async () => ({ error: null })),
  }),
}))

mock.module('@/features/crm/hooks/useAgendamentos', () => ({
  useAgendamentos: () => ({
    agendamentos: agendamentosMock,
    updateAgendamento: mock(async () => ({ error: null })),
  }),
}))

mock.module('@/features/crm/hooks/useClientes', () => ({
  useClientes: () => ({ clientes: [] }),
}))

mock.module('@/features/crm/hooks/useVendedorPerfil', () => ({
  useVendedorPerfil: () => ({
    perfil: { hora_entrada: null, hora_almoco_fim: null, hora_saida: null },
  }),
}))

mock.module('@/features/crm/hooks/useScoreRotina', () => ({
  calcularScoreRotina,
  useScoreRotina: () => scoreMock,
}))

mock.module('@/features/crm/hooks/useRoutinePlaybook', () => ({
  TIPO_ACAO_LABEL: {},
  useRoutinePlaybook: () => routinePlaybookMock,
}))

const { CentralExecucao } = await import('./CentralExecucao.container')

afterEach(() => {
  cleanup()
  toastSuccess.mockClear()
  toastError.mockClear()
  toastInfo.mockClear()
  oportunidadesMock = []
  agendamentosMock = []
  scoreMock = { score: 10, items: [{ label: 'Abriu a Central de Execução', value: '10pts', done: true }] }
  routinePlaybookMock = { ...routinePlaybookMock, conflitoCliente: null }
})

function oportunidade(overrides: Record<string, unknown> = {}) {
  return {
    id: 'op-1',
    cliente_id: 'cli-1',
    seller_user_id: '22222222-2222-4222-8222-222222222222',
    veiculo_interesse: 'Compass',
    tipo_veiculo: 'carro',
    valor_negociado: 0,
    etapa: 'negociacao',
    canal: 'carteira',
    sinal: 0,
    financiamento: 'nao_aplica',
    carro_avaliado: false,
    motivo_perda: null,
    created_at: `${today}T08:00:00.000Z`,
    cliente: { nome: 'Carlos Mendes', telefone: '31999998888' },
    ...overrides,
  }
}

function agendamento(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ag-1',
    cliente_id: 'cli-1',
    oportunidade_id: 'op-1',
    data_hora: `${today}T12:00:00.000Z`,
    canal: 'carteira',
    tipo: 'retorno',
    status: 'aguardando',
    proxima_acao: 'Apresentação do veículo',
    observacoes: null,
    ...overrides,
  }
}

describe('CentralExecucao', () => {
  it('mostra a aba Hoje por padrão com o estado vazio quando não há atividades hoje', async () => {
    render(<MemoryRouter><CentralExecucao /></MemoryRouter>)

    expect(await screen.findByText('O que você não pode deixar de fazer hoje')).toBeTruthy()
    expect(screen.getByText('Tela limpa por hoje.')).toBeTruthy()
    expect(screen.getByText('Ver Rotina do Dia')).toBeTruthy()
    expect(screen.getByText('Abrir Carteira')).toBeTruthy()
  })

  it('lista cliente em negociação com agendamento hoje (deriva de oportunidades+agendamentos reais)', async () => {
    oportunidadesMock = [oportunidade()]
    agendamentosMock = [agendamento()]

    render(<MemoryRouter><CentralExecucao /></MemoryRouter>)

    expect((await screen.findAllByText('Carlos Mendes')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Retorno').length).toBeGreaterThan(0)
  })

  it('lista o agendamento de hoje mesmo quando a oportunidade vinculada já foi concluída (ex.: pós-venda)', async () => {
    oportunidadesMock = [oportunidade({ etapa: 'ganho' })]
    agendamentosMock = [agendamento()]

    render(<MemoryRouter><CentralExecucao /></MemoryRouter>)

    expect((await screen.findAllByText('Carlos Mendes')).length).toBeGreaterThan(0)
  })

  it('mostra a entrega prevista da venda como atividade tipo Entrega (2.2.5, auditoria 2026-07-10)', async () => {
    oportunidadesMock = [oportunidade({ etapa: 'ganho', data_entrega_prevista: `${today}T15:00:00.000Z` })]
    agendamentosMock = [agendamento({ tipo: 'entrega', data_hora: `${today}T15:00:00.000Z`, proxima_acao: 'Entrega do veículo' })]

    render(<MemoryRouter><CentralExecucao /></MemoryRouter>)

    expect((await screen.findAllByText('Carlos Mendes')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Entrega').length).toBeGreaterThan(0)
  })

  it('troca para a aba Rotina do Dia e mostra a etapa atual', async () => {
    render(<MemoryRouter><CentralExecucao /></MemoryRouter>)

    screen.getByRole('button', { name: 'Rotina do Dia' }).click()

    expect((await screen.findAllByText('Organização do Dia')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sair da organização sabendo quais clientes e ações devem ser priorizados.').length).toBeGreaterThan(0)
    expect(screen.getByText('Confira os agendamentos de hoje')).toBeTruthy()
  })

  it('mostra aviso de conflito sem bloquear quando há cliente agendado no horário da rotina', async () => {
    routinePlaybookMock = { ...routinePlaybookMock, conflitoCliente: { clienteNome: 'Carlos Mendes' } }

    render(<MemoryRouter><CentralExecucao /></MemoryRouter>)
    screen.getByRole('button', { name: 'Rotina do Dia' }).click()

    expect(await screen.findByText(/Você possui um cliente agendado neste horário/)).toBeTruthy()
  })
})

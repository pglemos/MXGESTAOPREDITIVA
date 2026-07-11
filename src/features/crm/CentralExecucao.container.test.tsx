import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
// Importado estaticamente (antes de qualquer mock.module abaixo) pra preservar
// a função pura real no mock do hook — outros arquivos de teste (ex.:
// useScoreRotina.test.ts) também resolvem esse mesmo path e quebrariam se o
// mock só expusesse `useScoreRotina`.
import { calcularScoreRotina } from '@/features/crm/hooks/useScoreRotina'
// Mesmo motivo do calcularScoreRotina acima — useAgendamentos.test.ts resolve
// esse mesmo path e quebraria se o mock só expusesse os campos usados aqui.
import { eventoDeCriacaoParaTipo } from '@/features/crm/hooks/useAgendamentos'

// Radix Dialog (Modal) precisa desses globais em jsdom/happy-dom — ver
// CarteiraClientes.container.test.tsx para o mesmo shim.
globalThis.getComputedStyle ||= (() => ({ animationName: 'none' })) as typeof getComputedStyle
globalThis.MutationObserver ||= class {
  observe() {}
  disconnect() {}
  takeRecords() { return [] }
} as unknown as typeof MutationObserver

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
const toastSuccess = mock(() => {})
const toastError = mock(() => {})
const toastInfo = mock(() => {})

let oportunidadesMock: unknown[] = []
let agendamentosMock: unknown[] = []
let clientesMock: unknown[] = []
let scoreMock = { score: 10, items: [{ label: 'Abriu a Central de Execução', value: '10pts', done: true }] }

// Named mocks (2.2.4, auditoria 2026-07-10) — precisam ser inspecionáveis por
// call para provar QUAL registro foi alterado em cada transição (contador de
// pendências, atividade vencida some da lista, reagendamento não duplica,
// venda encerra a atividade certa, garantia não reabre a venda).
const updateOportunidadeMock = mock(async () => ({ error: null }))
const updateAgendamentoMock = mock(async () => ({ error: null }))
const createAgendamentoMock = mock(async () => ({ error: null }))
const updateStatusMock = mock(async () => ({ error: null }))
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
    updateOportunidade: updateOportunidadeMock,
  }),
}))

mock.module('@/features/crm/hooks/useAgendamentos', () => ({
  eventoDeCriacaoParaTipo,
  useAgendamentos: () => ({
    agendamentos: agendamentosMock,
    createAgendamento: createAgendamentoMock,
    updateAgendamento: updateAgendamentoMock,
    updateStatus: updateStatusMock,
  }),
}))

mock.module('@/features/crm/hooks/useClientes', () => ({
  useClientes: () => ({ clientes: clientesMock }),
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
  updateOportunidadeMock.mockClear()
  updateAgendamentoMock.mockClear()
  createAgendamentoMock.mockClear()
  updateStatusMock.mockClear()
  oportunidadesMock = []
  agendamentosMock = []
  clientesMock = []
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

function cliente(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cli-1',
    loja_id: 'loja-1',
    seller_user_id: '22222222-2222-4222-8222-222222222222',
    nome: 'Carlos Mendes',
    telefone: '31999998888',
    empresa: null,
    canal_origem: 'carteira',
    status: 'aguardando_contato',
    relacionamento: 'neutro',
    ultima_interacao: `${today}T08:00:00.000Z`,
    proxima_acao: null,
    proxima_acao_em: null,
    potencial_negocio: 0,
    observacoes: null,
    created_at: `${today}T08:00:00.000Z`,
    updated_at: `${today}T08:00:00.000Z`,
    ...overrides,
  }
}

function op1(overrides: Record<string, unknown> = {}) {
  return oportunidade(overrides)
}

function op2(overrides: Record<string, unknown> = {}) {
  return oportunidade({
    id: 'op-2',
    cliente_id: 'cli-2',
    cliente: { nome: 'Ana Paula', telefone: '31988887777' },
    ...overrides,
  })
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

  // 2.2.4 (auditoria 2026-07-10) — prova das 5 transições da Rotina/Mentor:
  // contador de pendências, atividade vencida sai da lista, reagendamento não
  // duplica competência, venda encerra a atividade certa, garantia não reabre venda.
  describe('transições da Rotina (2.2.4, auditoria 2026-07-10)', () => {
    it('contador de pendências: soma agendamentos não tratados de dias anteriores e concorda no singular/plural', async () => {
      oportunidadesMock = [op1(), op2()]
      agendamentosMock = [
        agendamento({ id: 'ag-velho-1', oportunidade_id: 'op-1', data_hora: '2026-06-01T12:00:00.000Z', status: 'aguardando' }),
        agendamento({ id: 'ag-velho-2', oportunidade_id: 'op-2', cliente_id: 'cli-2', data_hora: '2026-06-02T09:00:00.000Z', status: 'confirmado' }),
      ]

      render(<MemoryRouter><CentralExecucao /></MemoryRouter>)

      expect(await screen.findByText('Você possui 2 pendências de dias anteriores.')).toBeTruthy()
    })

    it('contador de pendências: usa singular quando há apenas 1 e não conta agendamentos já tratados nem os de hoje', async () => {
      oportunidadesMock = [op1()]
      agendamentosMock = [
        agendamento({ id: 'ag-velho', data_hora: '2026-06-01T12:00:00.000Z', status: 'aguardando' }),
        // Tratado (compareceu) não é pendência, mesmo estando no passado.
        agendamento({ id: 'ag-tratado', data_hora: '2026-06-01T12:00:00.000Z', status: 'compareceu' }),
        // De hoje não é "anterior".
        agendamento({ id: 'ag-hoje', data_hora: `${today}T12:00:00.000Z`, status: 'aguardando' }),
      ]

      render(<MemoryRouter><CentralExecucao /></MemoryRouter>)

      expect(await screen.findByText('Você possui 1 pendência de dias anteriores.')).toBeTruthy()
    })

    it('atividade vencida sai da lista quando o vendedor marca Compareceu (dispara updateStatus com o id certo)', async () => {
      oportunidadesMock = [op1()]
      // 5 minutos atrás — vencido em relação ao "agora" real usado pelo componente,
      // sem depender de um horário fixo (evita flakiness perto da virada UTC do dia).
      const horarioVencido = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      agendamentosMock = [agendamento({ id: 'ag-vencido', data_hora: horarioVencido, status: 'aguardando' })]

      render(<MemoryRouter><CentralExecucao /></MemoryRouter>)
      expect(await screen.findByText('Vencido')).toBeTruthy()

      fireEvent.click(screen.getByRole('button', { name: 'Resolver' }))
      fireEvent.click(await screen.findByRole('button', { name: /Compareceu/ }))

      expect(updateStatusMock).toHaveBeenCalledTimes(1)
      expect(updateStatusMock).toHaveBeenCalledWith('ag-vencido', 'compareceu')
      // A saída em si é provada pela função pura em agenda-hoje.test.ts
      // ("exclui da lista um agendamento já tratado") — aqui provamos que a
      // ação do usuário aciona exatamente essa transição de status.
    })

    it('reagendamento não duplica competência: usa updateAgendamento (não createAgendamento) e mantém o mesmo id', async () => {
      oportunidadesMock = [op1()]
      agendamentosMock = [agendamento({ id: 'ag-1', data_hora: `${today}T12:00:00.000Z` })]

      render(<MemoryRouter><CentralExecucao /></MemoryRouter>)
      const horarioButton = await screen.findByRole('button', { name: /Alterar horário de Carlos Mendes/ })
      fireEvent.click(horarioButton)

      const dialog = await screen.findByRole('dialog', { name: 'Reagendar' })
      fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }))

      await waitFor(() => expect(updateAgendamentoMock).toHaveBeenCalledTimes(1))
      expect(toastSuccess).toHaveBeenCalledWith('Agendamento atualizado.', { duration: 3000 })
      expect(updateAgendamentoMock.mock.calls[0][0]).toBe('ag-1')
      expect(createAgendamentoMock).not.toHaveBeenCalled()
    })

    it('venda encerra a atividade certa: com duas atividades no dia, confirmar venda na segunda atualiza a oportunidade certa (op-2), não a primeira', async () => {
      oportunidadesMock = [op1(), op2()]
      agendamentosMock = [
        agendamento({ id: 'ag-1', oportunidade_id: 'op-1', cliente_id: 'cli-1', data_hora: `${today}T09:00:00.000Z` }),
        agendamento({ id: 'ag-2', oportunidade_id: 'op-2', cliente_id: 'cli-2', data_hora: `${today}T10:00:00.000Z`, tipo: 'negociacao' }),
      ]

      render(<MemoryRouter><CentralExecucao /></MemoryRouter>)
      await screen.findByText('Carlos Mendes')
      await screen.findByText('Ana Paula')

      const resolverButtons = screen.getAllByRole('button', { name: 'Resolver' })
      expect(resolverButtons).toHaveLength(2)
      // A lista é ordenada por prioridade/horário — resolve explicitamente a
      // atividade da Ana (op-2) clicando no botão dentro do card dela.
      const anaCard = screen.getByText('Ana Paula').closest('div.group') as HTMLElement
      fireEvent.click(within(anaCard).getByRole('button', { name: 'Resolver' }))

      fireEvent.click(await screen.findByRole('button', { name: /Registrar Venda/ }))
      fireEvent.change(screen.getByLabelText('Valor negociado *'), { target: { value: '95000' } })
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar venda' }))

      await waitFor(() => expect(updateOportunidadeMock).toHaveBeenCalledTimes(1))
      expect(toastSuccess).toHaveBeenCalledWith('Venda registrada com sucesso.', { duration: 3000 })
      const [calledId, calledPayload] = updateOportunidadeMock.mock.calls[0] as [string, Record<string, unknown>]
      expect(calledId).toBe('op-2')
      expect(calledPayload.etapa).toBe('ganho')
    })

    it('garantia não reabre venda: registrar uma garantia cria apenas o agendamento, sem tocar na oportunidade já ganha', async () => {
      oportunidadesMock = [op1({ etapa: 'ganho' })]
      agendamentosMock = []
      clientesMock = [cliente({ id: 'cli-1', nome: 'Carlos Mendes', telefone: '31999998888' })]

      render(<MemoryRouter><CentralExecucao /></MemoryRouter>)

      // Sem atividades hoje, o botão "Nova atividade" aparece duas vezes
      // (cabeçalho + estado vazio) — usa o primeiro, igual ao fluxo real do vendedor.
      fireEvent.click((await screen.findAllByRole('button', { name: /Nova atividade/ }))[0])
      fireEvent.click(await screen.findByRole('button', { name: 'Garantia' }))

      const telefoneInput = screen.getByLabelText('Cliente ou Telefone')
      fireEvent.change(telefoneInput, { target: { value: '31999998888' } })
      fireEvent.keyDown(telefoneInput, { key: 'Enter' })

      expect(await screen.findByText('Carlos Mendes')).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: /Salvar atividade/ }))

      await waitFor(() => expect(createAgendamentoMock).toHaveBeenCalledTimes(1))
      expect(toastSuccess).toHaveBeenCalledWith('Atividade criada com sucesso.', { duration: 3000 })
      const [payload] = createAgendamentoMock.mock.calls[0] as [Record<string, unknown>]
      expect(payload.tipo).toBe('garantia')
      // Prova central: garantia NÃO reabre a venda — nenhuma chamada tocou a oportunidade.
      expect(updateOportunidadeMock).not.toHaveBeenCalled()
    })
  })
})

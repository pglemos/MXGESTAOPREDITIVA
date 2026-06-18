import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
const fetchTodayCheckin = mock(async () => {})
const refetchCadencia = mock(async () => {})
const refetchClientes = mock(async () => {})
const refetchFeedbackActions = mock(async () => {})
const refetchExecutionActions = mock(async () => {})
const registrarStatusCadencia = mock(async () => ({ error: null }))
const concluirAcaoFeedback = mock(async () => ({ error: null }))
const concluirExecutionAction = mock(async () => ({ error: null }))
const toastSuccess = mock(() => {})
const toastError = mock(() => {})
let feedbackActionsMock: unknown[] = []
let executionActionsMock: unknown[] = []
let cadenciaErrorMock: string | null = null

const cadenceAction = {
  cadencia_estado_id: '33333333-3333-4333-8333-333333333333',
  cliente_id: '11111111-1111-4111-8111-111111111111',
  cliente_nome: 'Ana Souza',
  cliente_telefone: '(31) 99999-0000',
  loja_id: '44444444-4444-4444-8444-444444444444',
  seller_user_id: '22222222-2222-4222-8222-222222222222',
  canal: 'internet',
  passo_atual_key: 'internet_mensagem_1',
  etapa_atual: 'lead',
  proxima_acao: 'Enviar mensagem 1 de primeiro contato',
  proxima_acao_em: today,
  status: 'ativo',
  last_result: null,
}

function parseCadenciaAgendaMock(data: unknown) {
  if (!Array.isArray(data)) return []
  const required = [
    'cadencia_estado_id',
    'cliente_id',
    'cliente_nome',
    'loja_id',
    'seller_user_id',
    'passo_atual_key',
    'etapa_atual',
    'proxima_acao',
    'proxima_acao_em',
    'status',
  ]

  return data.filter((row) => {
    if (!row || typeof row !== 'object') return false
    const item = row as Record<string, unknown>
    return required.every((key) => typeof item[key] === 'string')
  })
}

mock.module('sonner', () => ({
  toast: {
    error: toastError,
    success: toastSuccess,
    info: mock(() => {}),
  },
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
  calculateReferenceDate: () => today,
  useCheckinsToday: () => ({
    todayCheckin: null,
    fetchTodayCheckin,
  }),
}))

mock.module('@/features/crm/hooks/useAgendamentos', () => ({
  useAgendamentos: () => ({
    agendamentos: [],
    metrics: {
      agendamentosHoje: 0,
      compareceram: 0,
      naoCompareceram: 0,
      confirmados: 0,
      aguardando: 0,
      emNegociacao: 0,
      vendasRealizadas: 0,
      taxaComparecimento: 0,
    },
    loading: false,
    error: null,
    createAgendamento: mock(async () => ({ error: null })),
    updateAgendamento: mock(async () => ({ error: null })),
    deleteAgendamento: mock(async () => ({ error: null })),
  }),
}))

mock.module('@/features/crm/hooks/useAtendimentos', () => ({
  useAtendimentos: () => ({
    atendimentos: [],
    porCanal: {
      showroom: 1,
      carteira: 1,
      internet: 2,
      porta: 1,
      total: 5,
    },
    loading: false,
    error: null,
    refetch: mock(async () => {}),
    registrarAtendimento: mock(async () => ({ error: null })),
    removerUltimoAtendimento: mock(async () => ({ error: null })),
  }),
}))

mock.module('@/features/crm/hooks/useCadenciaAgenda', () => ({
  parseCadenciaAgenda: parseCadenciaAgendaMock,
  useCadenciaAgenda: () => ({
    acoes: [cadenceAction],
    loading: false,
    error: cadenciaErrorMock,
    refetch: refetchCadencia,
  }),
}))

mock.module('@/features/crm/hooks/useFeedbackActions', () => ({
  useFeedbackActions: () => ({
    acoes: feedbackActionsMock,
    loading: false,
    error: null,
    refetch: refetchFeedbackActions,
    concluirAcaoFeedback,
  }),
}))

mock.module('@/features/crm/hooks/useExecutionActions', () => ({
  useExecutionActions: () => ({
    acoes: executionActionsMock,
    loading: false,
    error: null,
    refetch: refetchExecutionActions,
    concluirExecutionAction,
  }),
}))

mock.module('@/features/crm/hooks/useClientes', () => ({
  buildClientePayload: (
    input: {
      nome: string
      telefone?: string | null
      canal_origem?: string | null
      proxima_acao?: string | null
      proxima_acao_em?: string | null
    },
    context: { lojaId: string; sellerUserId: string },
    now: Date = new Date(),
  ) => ({
    ...(() => {
      const proximaAcaoManual = input.proxima_acao?.trim() || null
      const dateOnly = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now)
      return {
        loja_id: context.lojaId,
        seller_user_id: context.sellerUserId,
        nome: input.nome.trim(),
        telefone: input.telefone?.trim() || null,
        canal_origem: input.canal_origem || null,
        status: 'aguardando_contato',
        relacionamento: 'neutro',
        proxima_acao: proximaAcaoManual || 'Enviar mensagem 1 de primeiro contato',
        proxima_acao_em: input.proxima_acao_em || (!proximaAcaoManual ? dateOnly : null),
        ultima_interacao: dateOnly,
      }
    })(),
  }),
  useClientes: () => ({
    clientes: [],
    metrics: {
      total: 0,
      ativos: 0,
      oportunidades: 0,
      posVenda: 0,
      aguardando: 0,
      inativos: 0,
      potencialTotal: 0,
    },
    loading: false,
    error: null,
    refetch: refetchClientes,
    createCliente: mock(async () => ({ error: null })),
    updateCliente: mock(async () => ({ error: null })),
    deleteCliente: mock(async () => ({ error: null })),
    registrarStatusCadencia,
  }),
}))

mock.module('@/features/crm/hooks/useVendedorPerfil', () => ({
  useVendedorPerfil: () => ({
    perfil: {
      fechar_dia_notificacao_ativa: false,
      fechar_dia_notificacao_hora: null,
      hora_saida: null,
      dias_trabalho: [],
    },
  }),
}))

const { CentralExecucao } = await import('./CentralExecucao.container')

afterEach(() => {
  cleanup()
  fetchTodayCheckin.mockClear()
  refetchCadencia.mockClear()
refetchClientes.mockClear()
refetchFeedbackActions.mockClear()
refetchExecutionActions.mockClear()
registrarStatusCadencia.mockClear()
concluirAcaoFeedback.mockClear()
concluirExecutionAction.mockClear()
  toastSuccess.mockClear()
  toastError.mockClear()
feedbackActionsMock = []
executionActionsMock = []
cadenciaErrorMock = null
})

describe('CentralExecucao', () => {
  it('mostra estado neutro quando nao ha feedback obrigatorio pendente', async () => {
    render(<MemoryRouter><CentralExecucao /></MemoryRouter>)

    expect(await screen.findByText('Nenhuma ação obrigatória no momento.')).toBeTruthy()
  })

  it('mostra alerta discreto quando a cadencia falha sem expor erro tecnico', async () => {
    cadenciaErrorMock = 'relation cadencia_estados does not exist'

    render(<MemoryRouter><CentralExecucao /></MemoryRouter>)

    expect(await screen.findByText('Ações de cadência não carregadas. Tentaremos novamente automaticamente.')).toBeTruthy()
    expect(screen.queryByText('relation cadencia_estados does not exist')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Recarregar/i }))
    expect(refetchCadencia).toHaveBeenCalled()
    expect(refetchFeedbackActions).toHaveBeenCalled()
  })

  it('mostra acao de cadencia na agenda e conclui pelo mesmo status da Carteira', async () => {
    render(<MemoryRouter><CentralExecucao /></MemoryRouter>)

    expect(await screen.findByText('Ana Souza')).toBeTruthy()
    expect(screen.getByText('Enviar mensagem 1 de primeiro contato')).toBeTruthy()
    expect(screen.getAllByText('Cadência').length).toBeGreaterThan(0)
    expect(screen.getByText('Ações Comerciais de Hoje')).toBeTruthy()
    expect(screen.getByText('Status da Ação')).toBeTruthy()
    expect(screen.getAllByText('08:55').length).toBeGreaterThan(0)
    expect(screen.getByText('5/5 atendimentos')).toBeTruthy()

    fireEvent.click(screen.getAllByRole('button', { name: /Feito/i })[0])

    await waitFor(() => {
      expect(registrarStatusCadencia).toHaveBeenCalledWith({
        clienteId: '11111111-1111-4111-8111-111111111111',
        status: 'feito',
      })
    })
    expect(refetchCadencia).toHaveBeenCalled()
    expect(refetchClientes).toHaveBeenCalled()
    expect(toastSuccess).toHaveBeenCalledWith('Cadência atualizada.')
  })

  it('mostra acao de feedback como alerta e permite concluir pela Central', async () => {
    feedbackActionsMock = [{
      id: 'action-feedback-1',
      devolutiva_id: 'feedback-1',
      store_id: '44444444-4444-4444-8444-444444444444',
      seller_id: '22222222-2222-4222-8222-222222222222',
      manager_id: '55555555-5555-4555-8555-555555555555',
      action_text: 'Agendar 3 retornos/dia às 10:00',
      status: 'pendente',
      recorrencia: 'diaria',
      data_inicio: today,
      horario_sugerido: '10:00',
      obrigatoria_fechamento: false,
      concluida_at: null,
      concluida_por: null,
      justificativa: null,
      created_at: `${today}T09:00:00Z`,
      updated_at: `${today}T09:00:00Z`,
    }]

    render(<MemoryRouter><CentralExecucao /></MemoryRouter>)

    expect((await screen.findAllByText('Ação do gestor')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Agendar 3 retornos/dia às 10:00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Feedback').length).toBeGreaterThan(0)
    expect(screen.getByText('Ação obrigatória')).toBeTruthy()

    const feedbackRow = screen
      .getAllByText('Agendar 3 retornos/dia às 10:00')[0]
      .closest('tr')

    expect(feedbackRow).toBeTruthy()
    fireEvent.click(within(feedbackRow as HTMLElement).getByRole('button', { name: /^Feito$/i }))

    await waitFor(() => {
      expect(concluirAcaoFeedback).toHaveBeenCalledWith('action-feedback-1')
    })
  expect(refetchFeedbackActions).toHaveBeenCalled()
  expect(toastSuccess).toHaveBeenCalledWith('Ação do feedback concluída.')
})

it('mostra acao de PDI persistida e permite concluir pela Central', async () => {
  executionActionsMock = [{
    id: 'execution-pdi-1',
    store_id: '44444444-4444-4444-8444-444444444444',
    seller_id: '22222222-2222-4222-8222-222222222222',
    source_type: 'pdi',
    source_id: 'pdi-action-1',
    title: 'Realizar 10 contatos ativos por dia',
    description: 'PDI: Curto Prazo',
    due_at: `${today}T11:00:00Z`,
    status: 'pendente',
    priority: 'medium',
    alert_tone: 'warning',
    created_by: '22222222-2222-4222-8222-222222222222',
    completed_at: null,
    completed_by: null,
    justificativa: null,
    metadata: { pdi_acao_id: 'pdi-action-1' },
    created_at: `${today}T09:00:00Z`,
    updated_at: `${today}T09:00:00Z`,
  }]

  render(<MemoryRouter><CentralExecucao /></MemoryRouter>)

  expect(await screen.findByText('Plano de Desenvolvimento')).toBeTruthy()
  expect(screen.getAllByText('Realizar 10 contatos ativos por dia').length).toBeGreaterThan(0)
  expect(screen.getAllByText('PDI').length).toBeGreaterThan(0)
  expect(screen.getByText('Ação rastreável')).toBeTruthy()

  const pdiRow = screen
    .getAllByText('Realizar 10 contatos ativos por dia')[0]
    .closest('tr')

  expect(pdiRow).toBeTruthy()
  fireEvent.click(within(pdiRow as HTMLElement).getByRole('button', { name: /^Feito$/i }))

  await waitFor(() => {
    expect(concluirExecutionAction).toHaveBeenCalledWith('execution-pdi-1')
  })
  expect(refetchExecutionActions).toHaveBeenCalled()
  expect(toastSuccess).toHaveBeenCalledWith('Ação da Central concluída.')
})
})

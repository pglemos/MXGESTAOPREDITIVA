import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const createCliente = mock(async () => ({ error: null, id: '22222222-2222-4222-8222-222222222222' }))
const createOportunidade = mock(async () => ({ error: null }))
const toastError = mock(() => {})
const toastSuccess = mock(() => {})

mock.module('sonner', () => ({
  toast: {
    error: toastError,
    success: toastSuccess,
  },
}))

mock.module('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: '11111111-1111-4111-8111-111111111111' },
  }),
}))

mock.module('@/features/crm/hooks/useAtendimentos', () => ({
  useAtendimentos: () => ({
    porCanal: {
      showroom: 0,
      carteira: 0,
      internet: 0,
      porta: 0,
      total: 0,
    },
    registrarAtendimento: mock(async () => ({ error: null })),
    removerUltimoAtendimento: mock(async () => ({ error: null })),
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
  ) => {
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
  },
  useClientes: () => ({
    clientes: [],
    createCliente,
  }),
}))

mock.module('@/features/crm/hooks/useOportunidades', () => ({
  buildOportunidadePayload: (
    input: {
      cliente_id: string
      veiculo_interesse?: string | null
      tipo_veiculo?: string | null
      valor_negociado?: number
      etapa?: string
      canal?: string | null
      sinal?: number
      financiamento?: string
      carro_avaliado?: boolean
      motivo_perda?: string | null
      closed_at?: string | null
    },
    context: { loja_id: string; seller_user_id: string },
    now: () => string = () => new Date().toISOString(),
  ) => {
    const etapa = input.etapa || 'prospeccao'
    return {
      cliente_id: input.cliente_id,
      loja_id: context.loja_id,
      seller_user_id: context.seller_user_id,
      veiculo_interesse: input.veiculo_interesse?.trim() || null,
      tipo_veiculo: input.tipo_veiculo || null,
      valor_negociado: input.valor_negociado ?? 0,
      etapa,
      canal: input.canal || null,
      sinal: input.sinal ?? 0,
      financiamento: input.financiamento || 'nao_aplica',
      carro_avaliado: input.carro_avaliado ?? false,
      motivo_perda: etapa === 'perdido' ? input.motivo_perda?.trim() || null : null,
      closed_at: input.closed_at || (etapa === 'ganho' || etapa === 'perdido' ? now() : null),
    }
  },
  useOportunidades: () => ({
    funil: {
      ganhos: {
        quantidade: 0,
        valor: 0,
      },
    },
    createOportunidade,
  }),
}))

mock.module('@/features/crm/hooks/useAgendamentos', () => ({
  useAgendamentos: () => ({
    agendamentos: [],
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
  calculateReferenceDate: () => '2026-06-16',
  isCheckinLate: () => false,
  canEditCurrentCheckin: () => true,
  getCheckinEditLockedAt: () => '2026-06-16T12:45:00.000Z',
  validateCheckinSubmissionDate: () => null,
  useCheckinsList: () => ({
    checkins: [],
    loading: false,
    error: null,
    setError: mock(),
    fetchCheckins: mock(async () => []),
  }),
  useMyCheckins: () => ({
    checkins: [],
  }),
  useCheckinsByDateRange: () => ({
    checkins: [],
    loading: false,
    error: null,
    fetchCheckinsByDateRange: mock(async () => []),
  }),
  useCheckinsToday: () => ({
    todayCheckin: null,
    fetchTodayCheckin: mock(async () => null),
  }),
  useCheckinsByDate: () => ({
    fetchCheckinByDate: mock(async () => null),
  }),
  useCheckinsSubmit: () => ({
    saveCheckin: mock(async () => ({ error: null })),
  }),
}))

const { CheckinCrmSection } = await import('./CheckinCrmSection')

afterEach(() => {
  cleanup()
  createCliente.mockClear()
  createOportunidade.mockClear()
  toastError.mockClear()
  toastSuccess.mockClear()
})

// As 3 validações abaixo (tipo_veiculo obrigatório, motivo_perda obrigatório,
// oportunidade rica com sinal/financiamento) pertenciam ao formulário inline
// antigo, que era o alvo direto do botão "+ Novo Cliente". Esse botão agora
// abre o NovoRegistroModal (Base44: seletor de 4 tipos + formulário por
// tipo — ver NovoRegistroModal.test.tsx), então o form antigo só é alcançável
// hoje pelo fluxo de edição de um registro já existente.
describe('CheckinCrmSection', () => {
  it('abre o NovoRegistroModal ao clicar em + Novo Cliente', () => {
    render(
      <MemoryRouter>
        <CheckinCrmSection />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /\+ novo cliente/i }))

    expect(screen.getByText('Novo Registro')).toBeTruthy()
    expect(screen.getByText('Qual tipo de registro você quer adicionar?')).toBeTruthy()
  })
})

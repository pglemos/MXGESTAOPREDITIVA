import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const createCliente = mock(async () => ({ error: null, id: 'cliente-1' }))
const deleteCliente = mock(async () => ({ error: null }))
const registrarStatusCadencia = mock(async () => ({ error: null }))
const toastSuccess = mock(() => {})
const toastError = mock(() => {})

const cliente = {
  id: 'cliente-1',
  loja_id: 'loja-1',
  seller_user_id: 'seller-1',
  nome: 'Ana Souza',
  telefone: '(31) 99999-0000',
  empresa: null,
  canal_origem: 'internet',
  status: 'aguardando_contato',
  relacionamento: 'neutro',
  ultima_interacao: '2026-06-16',
  proxima_acao: 'Enviar mensagem 1 de primeiro contato',
  proxima_acao_em: '2026-06-16',
  potencial_negocio: 0,
  observacoes: null,
  created_at: '2026-06-16T12:00:00Z',
  updated_at: '2026-06-16T12:00:00Z',
}

mock.module('sonner', () => ({
  toast: {
    error: toastError,
    success: toastSuccess,
  },
}))

mock.module('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'seller-1', name: 'Ana Vendedora' },
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
    clientes: [cliente],
    metrics: {
      total: 1,
      ativos: 0,
      oportunidades: 0,
      posVenda: 0,
      aguardando: 1,
      inativos: 0,
      potencialTotal: 0,
    },
    loading: false,
    error: null,
    createCliente,
    deleteCliente,
    registrarStatusCadencia,
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
    oportunidades: [],
  }),
}))

mock.module('@/features/crm/hooks/useAgendamentos', () => ({
  useAgendamentos: () => ({
    agendamentos: [],
  }),
}))

const { CarteiraClientes } = await import('./CarteiraClientes.container')

afterEach(() => {
  cleanup()
  createCliente.mockClear()
  deleteCliente.mockClear()
  registrarStatusCadencia.mockClear()
  toastSuccess.mockClear()
  toastError.mockClear()
})

describe('CarteiraClientes', () => {
  it('registra status Feito da acao de cadencia sem exigir observacao', async () => {
    render(<CarteiraClientes />)

    expect(screen.getAllByText('Enviar mensagem 1 de primeiro contato').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Feito' }))

    await waitFor(() => {
      expect(registrarStatusCadencia).toHaveBeenCalledWith({ clienteId: 'cliente-1', status: 'feito' })
    })
    expect(toastSuccess).toHaveBeenCalledWith('Cadência atualizada.')
  })

  it('registra tentativa sem contato como status nao_feito', async () => {
    render(<CarteiraClientes />)

    fireEvent.click(screen.getByRole('button', { name: 'Sem contato' }))

    await waitFor(() => {
      expect(registrarStatusCadencia).toHaveBeenCalledWith({ clienteId: 'cliente-1', status: 'nao_feito' })
    })
    expect(toastSuccess).toHaveBeenCalledWith('Cadência atualizada.')
  })
})

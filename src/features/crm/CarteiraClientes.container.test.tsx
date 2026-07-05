import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const createCliente = mock(async () => ({ error: null, id: 'cliente-1' }))
const registrarStatusCadencia = mock(async () => ({ error: null }))
const toastSuccess = mock(() => {})
const toastError = mock(() => {})

globalThis.getComputedStyle ||= (() => ({ animationName: 'none' })) as typeof getComputedStyle
globalThis.MutationObserver ||= class {
  observe() {}
  disconnect() {}
  takeRecords() { return [] }
} as unknown as typeof MutationObserver

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

mock.module('@/components/organisms/Modal', () => ({
  Modal: ({ open, title, description, children, footer }: {
    open: boolean
    title: string
    description?: string
    children: React.ReactNode
    footer?: React.ReactNode
  }) => open ? (
    <section role="dialog" aria-label={title}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {children}
      {footer}
    </section>
  ) : null,
}))

const { CarteiraClientes } = await import('./CarteiraClientes.container')

afterEach(() => {
  cleanup()
  createCliente.mockClear()
  registrarStatusCadencia.mockClear()
  toastSuccess.mockClear()
  toastError.mockClear()
})

describe('CarteiraClientes', () => {
  it('abre ficha com os blocos operacionais do Base44', () => {
    render(<CarteiraClientes />)

    fireEvent.click(screen.getByRole('button', { name: /Abrir ficha/i }))

    expect(screen.getAllByText('Mentor Comercial').length).toBeGreaterThan(0)
    expect(screen.getByText('O que falta para evoluir')).toBeTruthy()
    expect(screen.getByText('O que sabemos')).toBeTruthy()
  })

  it('registra status Feito da acao de cadencia sem exigir observacao', async () => {
    render(<CarteiraClientes />)

    expect(screen.getAllByText('Ana Souza').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /Abrir ficha/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Feito' }))

    await waitFor(() => {
      expect(registrarStatusCadencia).toHaveBeenCalledWith({ clienteId: 'cliente-1', status: 'feito' })
    })
    expect(toastSuccess).toHaveBeenCalledWith('Cadência atualizada.')
  })

  it('registra tentativa nao respondeu como status nao_feito', async () => {
    render(<CarteiraClientes />)

    fireEvent.click(screen.getByRole('button', { name: /Abrir ficha/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Não respondeu' }))
    expect(screen.getByRole('heading', { name: 'Cliente não respondeu' })).toBeTruthy()
    expect(screen.getByText('Amanhã às 10:00 - Tentativa 2/3')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reagendamento' }))

    await waitFor(() => {
      expect(registrarStatusCadencia).toHaveBeenCalledWith({ clienteId: 'cliente-1', status: 'nao_feito' })
    })
    expect(toastSuccess).toHaveBeenCalledWith('Tentativa registrada e próxima ação mantida no fluxo.')
  })
})

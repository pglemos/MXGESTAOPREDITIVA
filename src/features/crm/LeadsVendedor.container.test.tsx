import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const makeLead = (partial: Record<string, unknown>) => ({
  id: '11111111-1111-4111-8111-111111111111',
  nome: 'Lead Padrão',
  telefone: '11999990000',
  canal_origem: 'internet',
  status: 'aguardando_contato',
  created_at: new Date().toISOString(),
  proxima_acao: null,
  proxima_acao_em: null,
  ...partial,
})

let clientesMock: ReturnType<typeof makeLead>[] = []
let errorMock: string | null = null

mock.module('@/features/crm/hooks/useClientes', () => ({
  useClientes: () => ({
    clientes: clientesMock,
    loading: false,
    error: errorMock,
    updateCliente: () => Promise.resolve(),
  }),
}))

const { LeadsVendedor } = await import('./LeadsVendedor.container')

afterEach(() => {
  cleanup()
  clientesMock = []
  errorMock = null
})

describe('LeadsVendedor', () => {
  it('renders metrics with correct counts', () => {
    clientesMock = [
      makeLead({ id: '11111111-1111-4111-8111-111111111111', nome: 'Lead A', status: 'aguardando_contato' }),
      makeLead({ id: '22222222-2222-4222-8222-222222222222', nome: 'Lead B', status: 'aguardando_contato' }),
      makeLead({ id: '33333333-3333-4333-8333-333333333333', nome: 'Lead C', status: 'oportunidade' }),
    ]

    render(<MemoryRouter><LeadsVendedor /></MemoryRouter>)

    expect(screen.getByText('Leads aguardando')).toBeInTheDocument()
    expect(screen.getByText('Novos (7 dias)')).toBeInTheDocument()
    expect(screen.getByText('Total na carteira')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders empty state when no leads exist', () => {
    clientesMock = [
      makeLead({ id: '44444444-4444-4444-8444-444444444444', nome: 'Ativo', status: 'ativo' }),
    ]

    render(<MemoryRouter><LeadsVendedor /></MemoryRouter>)

    expect(screen.getByText('Nenhum lead aguardando')).toBeInTheDocument()
  })

  it('shows error message when hook returns error', () => {
    errorMock = 'Falha ao carregar clientes'

    render(<MemoryRouter><LeadsVendedor /></MemoryRouter>)

    expect(screen.getByText('Falha ao carregar clientes')).toBeInTheDocument()
  })
})

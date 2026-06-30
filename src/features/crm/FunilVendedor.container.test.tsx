import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

type OportunidadeMock = {
  cliente_id?: string | null
  etapa: string
  canal: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
  valor_negociado?: number
}

type AgendamentoMock = {
  canal: string | null
  data_hora: string
  status: string
}

type ClienteMock = {
  id: string
  canal_origem: string | null
  status: string
  created_at: string
  updated_at: string
}

const makeOpportunity = (partial: Partial<OportunidadeMock>): OportunidadeMock => ({
  cliente_id: 'cliente-oportunidade',
  etapa: 'ganho',
  canal: 'internet',
  created_at: dateDaysAgo(2),
  updated_at: dateDaysAgo(2),
  closed_at: dateDaysAgo(2),
  valor_negociado: 100000,
  ...partial,
})

const makeAgendamento = (partial: Partial<AgendamentoMock>): AgendamentoMock => ({
  canal: 'internet',
  data_hora: dateDaysAgo(2),
  status: 'confirmado',
  ...partial,
})

const makeCliente = (partial: Partial<ClienteMock>): ClienteMock => ({
  id: 'cliente-carteira',
  canal_origem: 'Internet',
  status: 'oportunidade',
  created_at: dateDaysAgo(2),
  updated_at: dateDaysAgo(2),
  ...partial,
})

function dateDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

let oportunidadesMock: OportunidadeMock[] = []
let agendamentosMock: AgendamentoMock[] = []
let clientesMock: ClienteMock[] = []
let oportunidadesErrorMock: string | null = null

mock.module('@/features/vendedor-home/hooks/useVendedorHomePage', () => ({
  useVendedorHomePage: () => ({
    metrics: { meta: 10, vendasMes: 6, projecao: 8 },
  }),
}))

mock.module('@/hooks/useGoals', () => ({
  useStoreMetaRules: () => ({
    metaRules: { bench_lead_agd: 18, bench_agd_visita: 55, bench_visita_vnd: 16, projection_mode: 'calendar' },
  }),
}))

mock.module('@/features/crm/hooks/useOportunidades', () => ({
  useOportunidades: () => ({
    oportunidades: oportunidadesMock,
    error: oportunidadesErrorMock,
    refetch: () => {},
  }),
}))

mock.module('@/features/crm/hooks/useClientes', () => ({
  useClientes: () => ({
    clientes: clientesMock,
    loading: false,
    error: null,
    refetch: () => {},
  }),
}))

mock.module('@/features/crm/hooks/useAgendamentos', () => ({
  useAgendamentos: () => ({
    agendamentos: agendamentosMock,
  }),
}))

const { FunilVendedor } = await import('./FunilVendedor.container')

afterEach(() => {
  cleanup()
  oportunidadesMock = []
  agendamentosMock = []
  clientesMock = []
  oportunidadesErrorMock = null
})

describe('FunilVendedor', () => {
  it('organiza o funil como tela operacional com diagnostico, canais compactos e acoes', () => {
    oportunidadesMock = [
      ...Array.from({ length: 4 }, (_, index) => makeOpportunity({
        canal: 'porta',
        etapa: 'apresentacao',
        closed_at: null,
        created_at: dateDaysAgo(index + 1),
        updated_at: dateDaysAgo(index + 1),
      })),
      makeOpportunity({ canal: 'porta', etapa: 'ganho', closed_at: dateDaysAgo(1) }),
      makeOpportunity({ canal: 'porta', etapa: 'ganho', closed_at: dateDaysAgo(2) }),
      ...Array.from({ length: 5 }, (_, index) => makeOpportunity({
        canal: 'internet',
        etapa: 'prospeccao',
        closed_at: null,
        created_at: dateDaysAgo(index + 1),
        updated_at: dateDaysAgo(index + 1),
      })),
      makeOpportunity({ canal: 'internet', etapa: 'qualificacao', closed_at: null }),
      makeOpportunity({ canal: 'internet', etapa: 'qualificacao', closed_at: null }),
      makeOpportunity({ canal: 'internet', etapa: 'apresentacao', closed_at: null }),
      makeOpportunity({ canal: 'internet', etapa: 'apresentacao', closed_at: null }),
      makeOpportunity({ canal: 'internet', etapa: 'ganho', closed_at: dateDaysAgo(1) }),
      ...Array.from({ length: 3 }, () => makeOpportunity({ canal: 'carteira', etapa: 'qualificacao', closed_at: null })),
      makeOpportunity({ canal: 'carteira', etapa: 'apresentacao', closed_at: null }),
      makeOpportunity({ canal: 'carteira', etapa: 'apresentacao', closed_at: null }),
      makeOpportunity({ canal: 'carteira', etapa: 'ganho', closed_at: dateDaysAgo(1) }),
    ]
    agendamentosMock = [
      ...Array.from({ length: 4 }, () => makeAgendamento({ canal: 'internet' })),
      ...Array.from({ length: 3 }, () => makeAgendamento({ canal: 'carteira' })),
    ]

    render(<MemoryRouter><FunilVendedor /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: /Funil de Vendas/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Meta (do )?mês/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Esforço necessário meta')).toBeInTheDocument()
    expect(screen.getByText('Eficiência por canal')).toBeInTheDocument()
    expect(screen.getByText('Base estatística')).toBeInTheDocument()
    expect(screen.getByText('Atendimento Comercial -> Venda')).toBeInTheDocument()
    expect(screen.getByText('Oportunidades -> Qualificados -> Agendamento -> Atendimento Comercial -> Venda')).toBeInTheDocument()
    expect(screen.getByText('Qualificados -> Agendamento -> Atendimento Comercial -> Venda')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Evolução dos últimos 6 meses/i })).toBeInTheDocument()
  })

  it('usa clientes reais da carteira como qualificados de Internet e Carteira sem criar etapa para Showroom', () => {
    clientesMock = [
      makeCliente({ id: 'cliente-roberto', canal_origem: 'Internet' }),
      makeCliente({ id: 'cliente-paola', canal_origem: 'Carteira' }),
      makeCliente({ id: 'cliente-beatriz', canal_origem: 'Porta' }),
      makeCliente({ id: 'cliente-inativo', canal_origem: 'Internet', status: 'inativo' }),
    ]

    render(<MemoryRouter><FunilVendedor /></MemoryRouter>)

    expect(screen.getAllByText('Qualificados')).toHaveLength(2)
    expect(screen.getByText('Atendimento Comercial -> Venda')).toBeInTheDocument()
  })

  it('exibe mensagem de erro com botao tentar novamente quando dados falham', () => {
    oportunidadesErrorMock = 'Falha ao carregar oportunidades'

    render(<MemoryRouter><FunilVendedor /></MemoryRouter>)

    expect(screen.getByText('Erro ao carregar dados do funil.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument()
  })
})

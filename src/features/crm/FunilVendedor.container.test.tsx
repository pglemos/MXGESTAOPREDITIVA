import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

type OportunidadeMock = {
  etapa: string
  canal: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
  valor_negociado?: number
}

const makeOpportunity = (partial: Partial<OportunidadeMock>): OportunidadeMock => ({
  etapa: 'ganho',
  canal: 'internet',
  created_at: dateMonthsAgo(1),
  updated_at: dateMonthsAgo(1),
  closed_at: dateMonthsAgo(1),
  valor_negociado: 100000,
  ...partial,
})

function dateDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

function dateMonthsAgo(months: number) {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  return date.toISOString()
}

let oportunidadesMock: OportunidadeMock[] = []
let perfilMixMock = {
  mix_canal_internet_pct: null as number | null,
  mix_canal_carteira_pct: null as number | null,
  mix_canal_porta_pct: null as number | null,
}

mock.module('@/features/vendedor-home/hooks/useVendedorHomePage', () => ({
  useVendedorHomePage: () => ({
    metrics: { meta: 10, vendasMes: 5, projecao: 8 },
    remuneracaoResumo: {
      realizado: { disponivel: true, total: 2500 },
      projetado: { disponivel: true, total: 5000 },
    },
  }),
}))

mock.module('@/hooks/useGoals', () => ({
  useStoreMetaRules: () => ({
    metaRules: { bench_lead_agd: 20, bench_agd_visita: 60, bench_visita_vnd: 33, projection_mode: 'calendar' },
  }),
}))

mock.module('@/features/crm/hooks/useOportunidades', () => ({
  useOportunidades: () => ({
    oportunidades: oportunidadesMock,
  }),
}))

mock.module('@/features/crm/hooks/useAgendamentos', () => ({
  useAgendamentos: () => ({
    agendamentos: [],
  }),
}))

mock.module('@/features/crm/hooks/useVendedorPerfil', () => ({
  useVendedorPerfil: () => ({
    perfil: perfilMixMock,
  }),
}))

const { FunilVendedor } = await import('./FunilVendedor.container')

afterEach(() => {
  cleanup()
  oportunidadesMock = []
  perfilMixMock = {
    mix_canal_internet_pct: null,
    mix_canal_carteira_pct: null,
    mix_canal_porta_pct: null,
  }
})

describe('FunilVendedor', () => {
  it('renderiza apenas canais ativos pelo historico real dos ultimos tres meses', () => {
    oportunidadesMock = [
      makeOpportunity({ canal: 'internet', closed_at: dateDaysAgo(2) }),
      makeOpportunity({ canal: 'internet', closed_at: dateDaysAgo(3) }),
      makeOpportunity({ canal: 'internet', closed_at: dateDaysAgo(4) }),
      makeOpportunity({ canal: 'carteira', closed_at: dateDaysAgo(5) }),
      makeOpportunity({ canal: 'porta', closed_at: dateMonthsAgo(4) }),
    ]

    render(<MemoryRouter><FunilVendedor /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: /internet/i })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: /^carteira$/i }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('heading', { name: /porta\/showroom/i })).not.toBeInTheDocument()
    expect(screen.getByText(/Mix real 3 meses: 75%/i)).toBeInTheDocument()
    expect(screen.getByText(/Priorize Internet/i)).toBeInTheDocument()
  })

  it('usa mix manual do perfil antes do historico', () => {
    perfilMixMock = {
      mix_canal_internet_pct: 70,
      mix_canal_carteira_pct: 30,
      mix_canal_porta_pct: 0,
    }
    oportunidadesMock = [
      makeOpportunity({ canal: 'porta', closed_at: dateDaysAgo(2) }),
      makeOpportunity({ canal: 'porta', closed_at: dateDaysAgo(3) }),
    ]

    render(<MemoryRouter><FunilVendedor /></MemoryRouter>)

    expect(screen.getByText(/Mix manual: 70%/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^internet$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^carteira$/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /porta\/showroom/i })).not.toBeInTheDocument()
  })
})

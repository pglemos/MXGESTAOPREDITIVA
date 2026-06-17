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
    metrics: { meta: 10, vendasMes: 6, projecao: 8 },
    remuneracaoResumo: {
      realizado: { disponivel: true, total: 8450 },
      projetado: { disponivel: true, total: 12000 },
    },
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
  it('mantem todos os canais visiveis e orienta canais sem dados recentes', () => {
    oportunidadesMock = [
      makeOpportunity({ canal: 'internet', closed_at: dateDaysAgo(2) }),
      makeOpportunity({ canal: 'internet', closed_at: dateDaysAgo(3) }),
      makeOpportunity({ canal: 'internet', closed_at: dateDaysAgo(4) }),
      makeOpportunity({ canal: 'carteira', closed_at: dateDaysAgo(5) }),
      makeOpportunity({ canal: 'porta', closed_at: dateMonthsAgo(4) }),
    ]

    render(<MemoryRouter><FunilVendedor /></MemoryRouter>)

    expect(screen.getByText('60% da meta alcançada')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*8\.450/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*12\.000/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*3\.550/)).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: /^internet$/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('heading', { name: /^carteira$/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('heading', { name: /^porta$/i }).length).toBeGreaterThan(0)
    expect(screen.getByText(/Plano para bater sua meta/i)).toBeInTheDocument()
    expect(screen.getByText(/Gargalo principal/i)).toBeInTheDocument()
    expect(screen.getByText(/Gerar plano na Central de Execução/i)).toBeInTheDocument()
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('13')).toBeInTheDocument()
    expect(screen.getAllByText('7').length).toBeGreaterThan(0)
    expect(screen.getByText('Canal prioritário do mês')).toBeInTheDocument()
    expect(screen.getAllByText('18%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('55%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('16%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('11,9%').length).toBeGreaterThan(0)
  })

  it('mantem a referencia visual mesmo quando o mix manual diverge', () => {
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

    expect(screen.getByText('42%')).toBeInTheDocument()
    expect(screen.getByText('57%')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: /^internet$/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('heading', { name: /^carteira$/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('heading', { name: /^porta$/i }).length).toBeGreaterThan(0)
  })
})

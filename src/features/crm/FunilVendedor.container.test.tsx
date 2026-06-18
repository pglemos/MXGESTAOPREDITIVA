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
let oportunidadesErrorMock: string | null = null
const refreshSnapshotMock = mock(() => Promise.resolve({ error: null }))
let snapshotMock: unknown = null
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
  buildOportunidadePayload: (input: any, context: any, nowIso = () => new Date().toISOString()) => {
    const isTerminal = input.etapa === 'ganho' || input.etapa === 'perdido'
    return {
      cliente_id: input.cliente_id,
      loja_id: context.loja_id,
      seller_user_id: context.seller_user_id,
      veiculo_interesse: input.veiculo_interesse?.trim() || null,
      tipo_veiculo: input.tipo_veiculo || null,
      valor_negociado: input.valor_negociado ?? 0,
      etapa: input.etapa || 'prospeccao',
      canal: input.canal || null,
      sinal: input.sinal ?? 0,
      financiamento: input.financiamento || 'nao_aplica',
      carro_avaliado: input.carro_avaliado ?? false,
      motivo_perda: input.etapa === 'perdido' ? (input.motivo_perda?.trim() || null) : null,
      closed_at: isTerminal ? (input.closed_at || nowIso()) : null,
    }
  },
  useOportunidades: () => ({
    oportunidades: oportunidadesMock,
    error: oportunidadesErrorMock,
    refetch: () => {},
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

mock.module('@/features/crm/hooks/useFunnelMetricsSnapshot', () => ({
 useFunnelMetricsSnapshot: () => ({
 snapshot: snapshotMock,
 loading: false,
 saving: false,
 error: null,
 refetch: () => Promise.resolve(),
 refreshSnapshot: refreshSnapshotMock,
 }),
}))

const { FunilVendedor } = await import('./FunilVendedor.container')

afterEach(() => {
  cleanup()
 oportunidadesMock = []
 oportunidadesErrorMock = null
 snapshotMock = null
 refreshSnapshotMock.mockClear()
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

 it('exibe snapshot historico salvo do funil', () => {
 snapshotMock = {
 id: 'snapshot-1',
 loja_id: 'loja-1',
 seller_user_id: 'seller-1',
 period_start: '2026-04-01',
 period_end: '2026-06-17',
 period_key: '90',
 meta: null,
 vendas_realizadas: 7,
 vendas_faltantes: null,
 atingimento: null,
 totals: { oportunidades_total: 12, ganhos: 7, perdidos: 2 },
 channels: { internet: {}, carteira: {} },
 source: 'rpc_snapshot',
 created_at: '2026-06-17T12:00:00Z',
 updated_at: '2026-06-17T12:00:00Z',
 }

 render(<MemoryRouter><FunilVendedor /></MemoryRouter>)

 expect(screen.getByText('Snapshot historico')).toBeInTheDocument()
 expect(screen.getByText(/Atualizado em/i)).toBeInTheDocument()
 expect(screen.getByText('Oportunidades')).toBeInTheDocument()
 expect(screen.getByText('Ganhos')).toBeInTheDocument()
 expect(screen.getByText('Canais')).toBeInTheDocument()
 expect(screen.getByText('Registrar snapshot')).toBeInTheDocument()
 })

 it('exibe mensagem de erro com botao tentar novamente quando dados falham', () => {
 oportunidadesErrorMock = 'Falha ao carregar oportunidades'

    render(<MemoryRouter><FunilVendedor /></MemoryRouter>)

    expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
  })
})

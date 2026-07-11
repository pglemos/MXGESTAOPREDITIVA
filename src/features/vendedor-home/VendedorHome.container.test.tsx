import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
// P0-05b (auditoria 2026-07-10): ver RelatoriosVendedor.container.test.tsx —
// reusa a implementação real em vez de manter uma cópia hand-rolled que fica
// obsoleta e mascara bugs reais (ex.: P1-05/P0-05a).
import { buildOportunidadePayload } from '@/features/crm/hooks/useOportunidades'
// Idem — useAgendamentos.test.ts resolve o mesmo path e quebraria se o mock
// abaixo não expuser eventoDeCriacaoParaTipo (2.2.4, auditoria 2026-07-10).
import { eventoDeCriacaoParaTipo } from '@/features/crm/hooks/useAgendamentos'

mock.module('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: {
      id: 'seller-1',
      name: 'Vendedor MX Consultoria 1',
      avatar_url: null,
    },
  }),
}))

mock.module('@/hooks/useNotifications', () => ({
 useNotifications: () => ({
 unreadCount: 0,
 }),
}))

let mockScoreState: { score: any; loading: boolean } = {
 score: {
 value: 40,
 band: 'critical',
 dimDisciplina: 0,
 dimResultado: 100,
 dimProcesso: 0,
 period: '2026-06',
 },
 loading: false,
}

mock.module('@/features/vendedor-home/hooks/useVendedorHomePage', () => ({
 useVendedorHomePage: () => ({
 remuneration: null,
    remuneracaoEstimada: {
      disponivel: true,
      cargo: 'Vendedor',
      salarioFixo: 0,
      salarioVariavel: 0,
      beneficios: 0,
      base: 0,
      comissaoPorVenda: 0,
      comissao: 4800,
      bonus: 0,
      total: 4800,
      vendasConsideradas: 5,
      meta: 8,
      atingimentoPercentual: 63,
      regraComissaoAplicada: null,
      regraBonusAplicada: null,
      bonusPatamares: [],
      regrasAplicadas: [],
      regrasNaoAtingidas: [],
      formulaItens: [],
    },
    discipline: { percentage: 0 },
    devolutivas: [],
    treinamentos: [
      { id: 'training-1', title: 'História, valores e cultura da MX', watched: false, progress_percent: 60 },
      { id: 'training-2', title: 'Funil comercial e conversões', watched: false, progress_percent: 45 },
 ],
 checkins: [],
 todayCheckin: null,
 ranking: [],
 metrics: { meta: 8, vendasMes: 5, projecao: 7, atingimento: 63, faltaX: 3 },
 isLoading: false,
 }),
}))

mock.module('@/features/crm/hooks/useMeuScore', () => ({
  BAND_LABEL: {
    elite: 'Elite MX',
    excellent: 'Excelente',
    good: 'Bom',
    attention: 'Atenção',
    critical: 'Crítico',
  },
  NEXT_BAND: {
    critical: 'Atenção',
    attention: 'Bom',
    good: 'Excelente',
    excellent: 'Elite MX',
    elite: 'Elite MX',
  },
 useMeuScore: () => ({
 ...mockScoreState,
 bandLabel: { critical: 'Crítico' },
 nextBand: { critical: 'Atenção' },
 }),
}))

mock.module('@/features/crm/hooks/useAgendamentos', () => ({
  eventoDeCriacaoParaTipo,
  useAgendamentos: () => ({
    agendamentos: [],
    metrics: {
      agendamentosHoje: 0,
      confirmados: 0,
      aguardando: 0,
    },
  }),
}))

mock.module('@/features/crm/hooks/useOportunidades', () => ({
  buildOportunidadePayload,
  useOportunidades: () => ({
    oportunidades: [],
  }),
}))

const { VendedorHome, EstimatedSalaryCard } = await import('./VendedorHome.container')

afterEach(() => {
 mockScoreState = {
 score: {
 value: 40,
 band: 'critical',
 dimDisciplina: 0,
 dimResultado: 100,
 dimProcesso: 0,
 period: '2026-06',
 },
 loading: false,
 }
 cleanup()
})

describe('VendedorHome', () => {
  it('mantem a estrutura da home e orienta os estados vazios do vendedor', () => {
    render(
      <MemoryRouter>
        <VendedorHome />
      </MemoryRouter>,
    )

expect(screen.getByRole('heading', { name: /bom dia, vendedor!/i })).toBeInTheDocument()
    expect(screen.getByText(/crítico/i)).toBeInTheDocument()
    expect(screen.getByText(/400 \/ 1000 pts/i)).toBeInTheDocument()
    expect(screen.getAllByText(/nenhuma atividade executada ainda/i).length).toBeGreaterThan(0)
 expect(screen.getAllByText(/comece pela central de execução/i).length).toBeGreaterThan(0)
 expect(screen.getByText(/plano de ataque de hoje/i)).toBeInTheDocument()
 expect(screen.getByText(/criar novos agendamentos na central/i)).toBeInTheDocument()
 expect(screen.getByText(/priorizar 3 vendas restantes para a meta/i)).toBeInTheDocument()
 expect(screen.getByText(/atualizar status dos clientes movimentados/i)).toBeInTheDocument()
 expect(screen.getByRole('link', { name: /abrir central de execução/i })).toBeInTheDocument()
    expect(screen.queryByText(/próxima melhor ação/i)).not.toBeInTheDocument()
expect(screen.getByRole('link', { name: /^abrir fechamento diário$/i })).toBeInTheDocument()
    expect(screen.getByText(/história, valores e cultura da mx/i)).toBeInTheDocument()
    expect(screen.getAllByText(/nenhum feedback recebido ainda/i)).toHaveLength(1)
    expect(screen.getByText(/ação vinculada, prazo, status e confirmação de leitura/i)).toBeInTheDocument()

 const topCards = screen.getByText(/minha meta/i).closest('section')
 expect(topCards).not.toBeNull()
 expect(within(topCards as HTMLElement).getByText(/comissão estimada/i)).toBeInTheDocument()
 expect(within(topCards as HTMLElement).getByText(/agendamentos hoje/i)).toBeInTheDocument()
 expect(within(topCards as HTMLElement).getByText(/atividades hoje/i)).toBeInTheDocument()
 expect(within(topCards as HTMLElement).getByText(/meu score mx/i)).toBeInTheDocument()
 })

 it('nao apresenta score critico falso quando nao ha calculo recente', () => {
 mockScoreState = { score: null, loading: false }

 render(
 <MemoryRouter>
 <VendedorHome />
 </MemoryRouter>,
 )

 expect(screen.getByText(/indisponível/i)).toBeInTheDocument()
 expect(screen.getByText(/sem cálculo recente/i)).toBeInTheDocument()
 expect(screen.queryByText(/400 \/ 1000 pts/i)).not.toBeInTheDocument()
 expect(screen.getAllByRole('link', { name: /abrir fechamento diário/i }).length).toBeGreaterThan(0)
 })
})

describe('EstimatedSalaryCard', () => {
  it('navega para o cálculo detalhado mesmo quando remuneração está pendente', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route
            path="*"
            element={(
              <>
                <EstimatedSalaryCard
                  estimativa={{
                    disponivel: false,
                    cargo: null,
                    salarioFixo: 0,
                    salarioVariavel: 0,
                    beneficios: 0,
                    base: 0,
                    comissaoPorVenda: 0,
                    comissao: 0,
                    bonus: 0,
                    total: 0,
                    vendasConsideradas: 0,
                    meta: 0,
                    atingimentoPercentual: 0,
                    regraComissaoAplicada: null,
                    regraBonusAplicada: null,
                    bonusPatamares: [],
                    regrasAplicadas: [],
                    regrasNaoAtingidas: [],
                    formulaItens: [],
                  }}
                />
                <CurrentPath />
              </>
            )}
          />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('link', { name: /salário estimado/i }))

    expect(screen.getByTestId('current-path').textContent).toBe('/minha-remuneracao')
  })
})

function CurrentPath() {
  return <span data-testid="current-path">{useLocation().pathname}</span>
}

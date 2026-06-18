import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

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
    score: {
      value: 40,
      band: 'critical',
      dimDisciplina: 0,
      dimResultado: 100,
      dimProcesso: 0,
      period: '2026-06',
    },
    bandLabel: { critical: 'Crítico' },
    nextBand: { critical: 'Atenção' },
  }),
}))

mock.module('@/features/crm/hooks/useAgendamentos', () => ({
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
    oportunidades: [],
  }),
}))

const { VendedorHome, EstimatedSalaryCard } = await import('./VendedorHome.container')

afterEach(() => {
  cleanup()
})

describe('VendedorHome', () => {
  it('mantem a estrutura da home e orienta os estados vazios do vendedor', () => {
    render(
      <MemoryRouter>
        <VendedorHome />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /bom dia, consultor!/i })).toBeInTheDocument()
    expect(screen.getByText(/crítico/i)).toBeInTheDocument()
    expect(screen.getByText(/400 \/ 1000 pts/i)).toBeInTheDocument()
    expect(screen.getAllByText(/nenhuma atividade executada ainda/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/comece pela central de execução/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/plano de ataque de hoje/i)).toBeInTheDocument()
    expect(screen.getByText(/5 retornos de carteira/i)).toBeInTheDocument()
    expect(screen.getByText(/3 novos agendamentos/i)).toBeInTheDocument()
    expect(screen.getByText(/2 prospecções/i)).toBeInTheDocument()
    expect(screen.queryByText(/próxima melhor ação/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^fechar meu dia$/i })).toBeInTheDocument()
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

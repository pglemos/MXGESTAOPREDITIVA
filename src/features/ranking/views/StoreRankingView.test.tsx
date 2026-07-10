import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'

const setPeriodo = mock(() => {})
const setUnidade = mock((value: string) => {
  storeRankingData.unidade = value
  storeRankingData.vendedores = allVendedores.filter(v => value === 'todas' || v.unidade === value)
  storeRankingData.top3 = storeRankingData.vendedores.slice(0, 3)
  storeRankingData.totalVendedores = storeRankingData.vendedores.length
})

const allVendedores = [
  { id: 'seller-1', nome: 'Lucas Vendedor', foto: null, unidade: 'Centro', vendas: 18, meta: 30 },
  { id: 'seller-2', nome: 'Ana Loja Norte', foto: null, unidade: 'Norte', vendas: 12, meta: 30 },
  { id: 'seller-3', nome: 'Bruno Centro', foto: null, unidade: 'Centro', vendas: 9, meta: 30 },
]

let storeRankingData = {
  loading: false,
  error: null as string | null,
  periodo: 'Mensal' as const,
  setPeriodo,
  unidade: 'todas',
  setUnidade,
  unidades: ['Centro', 'Norte'],
  isRefetching: false,
  handleRefresh: mock(async () => {}),
  vendedores: allVendedores,
  top3: allVendedores.slice(0, 3),
  posicao: 1,
  totalVendedores: allVendedores.length,
  atingimento: 60,
  faltamValor: null as number | null,
  euVendedor: allVendedores[0],
  metaPeriodo: 30,
  meuId: 'seller-1',
  profile: { id: 'seller-1', name: 'Lucas Vendedor' },
}

mock.module('@/features/ranking/hooks/useStoreRankingPageData', () => ({
  RANKING_PERIODOS: ['Mensal', 'Trimestral', 'Semestral', 'Anual'],
  useStoreRankingPageData: () => storeRankingData,
}))

const { StoreRankingView } = await import('./StoreRankingView')

afterEach(() => {
  cleanup()
  setPeriodo.mockClear()
  setUnidade.mockClear()
  storeRankingData = {
    ...storeRankingData,
    unidade: 'todas',
    vendedores: allVendedores,
    top3: allVendedores.slice(0, 3),
    totalVendedores: allVendedores.length,
  }
})

describe('StoreRankingView', () => {
  it('renders the Base44 ranking contract with period tabs, unit filter, criterion notice and sections', () => {
    render(<StoreRankingView />)

    expect(screen.getByRole('heading', { name: 'Ranking' })).toBeInTheDocument()
    expect(screen.queryByText('Acompanhe sua posição, a corrida do período e as bonificações da loja.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mensal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trimestral' })).toBeInTheDocument()
    expect(screen.getByLabelText('Unidade')).toBeInTheDocument()
    expect(screen.getByText(/Critério configurado pela loja:/i)).toBeInTheDocument()
    expect(screen.getByText(/Volume de vendas/i)).toBeInTheDocument()
    expect(screen.getByText('Pódio do Período')).toBeInTheDocument()
    expect(screen.getByText('Sua posição')).toBeInTheDocument()
    expect(screen.getByText('Corrida do Período')).toBeInTheDocument()
    expect(screen.getByText('Bonificação do Período')).toBeInTheDocument()
  })

  it('filters the ranking table by unit', () => {
    const { rerender } = render(<StoreRankingView />)

    const table = screen.getByRole('table')
    expect(within(table).getByText('Ana Loja Norte')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Unidade'), { target: { value: 'Centro' } })
    rerender(<StoreRankingView />)

    expect(setUnidade).toHaveBeenCalledWith('Centro')
    expect(within(screen.getByRole('table')).getByText('Lucas Vendedor')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Bruno Centro')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).queryByText('Ana Loja Norte')).toBeNull()
  })
})

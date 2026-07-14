import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ManagerTeamPerformance } from './ManagerTeamPerformance'

afterEach(() => cleanup())

function dashboardData(loading: boolean) {
  return {
    loading,
    referenceDate: '2026-07-14',
    startDate: '2026-07-01',
    endDate: '2026-07-14',
    setViewMode: vi.fn(),
    setStartDate: vi.fn(),
    setEndDate: vi.fn(),
    selectedStoreId: 'store-1',
    metrics: { ranking: [] },
  } as never
}

describe('ManagerTeamPerformance loading state', () => {
  test('não exibe vazio de vendedores enquanto as consultas ainda carregam', () => {
    render(
      <MemoryRouter>
        <ManagerTeamPerformance data={dashboardData(true)} storeName="Matriz" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('region', { name: 'Performance da equipe' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('region', { name: 'Carregando coluna Críticos' })).toBeTruthy()
    expect(screen.queryByText('Nenhum vendedor vinculado a este gerente.')).toBeNull()
  })

  test('mantém o estado vazio explícito quando a consulta terminou sem vendedores', () => {
    render(
      <MemoryRouter>
        <ManagerTeamPerformance data={dashboardData(false)} storeName="Matriz" />
      </MemoryRouter>,
    )

    expect(screen.getByText('Nenhum vendedor vinculado a este gerente.')).toBeTruthy()
  })
})

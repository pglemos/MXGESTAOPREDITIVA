import React from 'react'
import { describe, expect, it } from 'bun:test'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { EstimatedSalaryCard } from './VendedorHome.container'

describe('EstimatedSalaryCard', () => {
  it('navega para o cálculo detalhado mesmo quando a remuneração está pendente', () => {
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

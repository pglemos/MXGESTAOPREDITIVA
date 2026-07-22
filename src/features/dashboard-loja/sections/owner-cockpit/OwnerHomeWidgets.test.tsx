import React from 'react'
import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { OwnerActionPlanSummary } from './OwnerHomeWidgets'
import type { ActionRow } from './types'

afterEach(cleanup)

function action(id: string, status: string): ActionRow {
  return {
    id,
    priority: 'Atenção',
    department: 'Comercial',
    indicator: 'Conversão',
    problem: 'Problema registrado',
    recommendation: 'Ação registrada',
    action: 'Executar ação',
    how: 'Conforme plano',
    owner: 'Responsável',
    origin: 'Manual',
    due: '22/07/2026',
    status,
    efficacy: 'Pendente',
    evidence: 'Sem evidência',
    tone: 'warning',
  }
}

describe('OwnerActionPlanSummary', () => {
  test('classifica cada ação em uma única categoria e mantém o total em 100%', () => {
    render(
      <MemoryRouter>
        <OwnerActionPlanSummary actions={[action('done', 'Concluída'), action('doing', 'Em andamento')]} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Eficazes').parentElement).toHaveTextContent('50%')
    expect(screen.getByText('Parcialmente eficazes').parentElement).toHaveTextContent('50%')
    expect(screen.getByText('Ineficazes').parentElement).toHaveTextContent('0%')
  })
})

import { describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import InternalMxPageFrame from './InternalMxPageFrame'

describe('InternalMxPageFrame', () => {
  test('apresenta metadados canônicos sem interferir no conteúdo da rota', () => {
    render(
      <InternalMxPageFrame pathname="/agenda" roleLabel="Consultor MX">
        <main id="main-content">Conteúdo preservado</main>
      </InternalMxPageFrame>,
    )

    expect(screen.getByRole('heading', { name: 'Agenda Central MX' })).toBeInTheDocument()
    expect(screen.getByText('Consultor MX')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo preservado')).toBeInTheDocument()
  })
})

import React from 'react'
import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { VendedorDesenvolvimentoShell } from './VendedorDesenvolvimento'

const FeedbackPage = () => <section aria-label="Tela Feedback">Feedback vendedor</section>
const PDIPage = () => <section aria-label="Tela PDI">PDI vendedor</section>

afterEach(() => cleanup())

describe('VendedorDesenvolvimento', () => {
  it('renders Base44 development shell with Feedback as the default tab', () => {
    render(
      <MemoryRouter initialEntries={['/desenvolvimento']}>
        <VendedorDesenvolvimentoShell FeedbackPage={FeedbackPage} PDIPage={PDIPage} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Desenvolvimento' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Feedback' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'PDI' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByLabelText('Tela Feedback')).toBeInTheDocument()
  })

  it('switches to the PDI tab', () => {
    render(
      <MemoryRouter initialEntries={['/desenvolvimento']}>
        <VendedorDesenvolvimentoShell FeedbackPage={FeedbackPage} PDIPage={PDIPage} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('tab', { name: 'PDI' }))

    expect(screen.getByRole('tab', { name: 'PDI' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Tela PDI')).toBeInTheDocument()
  })

  it('opens PDI from the query alias used by legacy routes', () => {
    render(
      <MemoryRouter initialEntries={['/desenvolvimento?tab=pdi']}>
        <VendedorDesenvolvimentoShell FeedbackPage={FeedbackPage} PDIPage={PDIPage} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('tab', { name: 'Feedback' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tab', { name: 'PDI' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Tela PDI')).toBeInTheDocument()
  })
})

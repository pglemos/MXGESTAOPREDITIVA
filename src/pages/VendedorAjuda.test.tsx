import React from 'react'
import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import VendedorAjuda from './VendedorAjuda'

function renderPage() {
  return render(
    <MemoryRouter>
      <VendedorAjuda />
    </MemoryRouter>,
  )
}

describe('VendedorAjuda', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the main heading', () => {
    renderPage()
    expect(screen.getByText('Precisa destravar algo hoje?')).toBeTruthy()
  })

  it('renders the page subtitle', () => {
    renderPage()
    expect(screen.getByText('Suporte operacional para o vendedor')).toBeTruthy()
  })

  it('renders all four help action cards', () => {
    renderPage()
    expect(screen.getByText('Fechamento Diário')).toBeTruthy()
    expect(screen.getByText('Corrigir um dia')).toBeTruthy()
    expect(screen.getByText('Alertas pendentes')).toBeTruthy()
    expect(screen.getByText('Feedback')).toBeTruthy()
  })

  it('renders help card descriptions', () => {
    renderPage()
    expect(screen.getByText('Preencher ou revisar produção D-1 e Central de Execução de hoje.')).toBeTruthy()
    expect(screen.getByText('Ajustar um lançamento anterior com motivo.')).toBeTruthy()
    expect(screen.getByText('Ver cobranças, feedback e avisos obrigatórios.')).toBeTruthy()
    expect(screen.getByText('Confirmar ciência e ver próximos passos do gestor.')).toBeTruthy()
  })

  it('renders navigation links with correct destinations', () => {
    renderPage()
    const links = screen.getAllByRole('link')
    const hrefs = links.map(l => l.getAttribute('href'))
  expect(hrefs).toContain('/vendedor/terminal-mx')
    expect(hrefs).toContain('/notificacoes')
    expect(hrefs).toContain('/devolutivas')
  })

  it('renders the support escalation section', () => {
    renderPage()
    expect(screen.getByText('Escala de suporte')).toBeTruthy()
    expect(screen.getByText('1. Gerente da unidade')).toBeTruthy()
    expect(screen.getByText('2. Admin MX')).toBeTruthy()
  })
})

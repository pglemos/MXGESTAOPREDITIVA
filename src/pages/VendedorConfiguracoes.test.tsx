import React from 'react'
import { describe, expect, it, mock } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

mock.module('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { name: 'Ana Vendedora' },
    role: 'vendedor',
    membership: { store: { name: 'MX Teste' } },
  }),
}))

const { default: VendedorConfiguracoes } = await import('./VendedorConfiguracoes')

describe('VendedorConfiguracoes', () => {
  it('renderiza atalhos operacionais do vendedor sem expor configuracao administrativa', () => {
    render(
      <MemoryRouter>
        <VendedorConfiguracoes />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Configurações' })).toBeInTheDocument()
    expect(screen.getByText('Ana Vendedora')).toBeInTheDocument()
    expect(screen.getByText('MX Teste')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Abrir Meu Perfil' })).toHaveAttribute('href', '/perfil')
    expect(screen.getByRole('link', { name: 'Ver notificações' })).toHaveAttribute('href', '/notificacoes')
    expect(screen.getByRole('link', { name: 'Abrir treinamento' })).toHaveAttribute('href', '/universidade-mx')
    expect(screen.getByRole('link', { name: 'Abrir ajuda' })).toHaveAttribute('href', '/ajuda')
    expect(screen.getByText(/Configurações administrativas seguem restritas/i)).toBeInTheDocument()
  })
})

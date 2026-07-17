import React from 'react'
import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QualificadoStatusHelp } from './NovoRegistroModal'

afterEach(cleanup)

// MX-22.4 (AC-5/AC-6; Spec §9.2 "Não usar tooltip genérico"): substituiu o
// atributo HTML `title` (só hover, inacessível em touch) por um popover
// acionável por clique. Componente não recebe props/hooks externos —
// testável isolado, sem mockar useAuth/useClientes/useOportunidades como
// o NovoRegistroModal inteiro exigiria.
describe('QualificadoStatusHelp (MX-22.4)', () => {
  it('não exibe a ajuda por padrão — só aparece após clique/toque, nunca hover', () => {
    render(<QualificadoStatusHelp />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('abre ao clicar no botão de ajuda (acionável por clique/toque, não depende de :hover)', () => {
    render(<QualificadoStatusHelp />)
    fireEvent.click(screen.getByRole('button', { name: /Ajuda sobre os passos da oportunidade/i }))
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('mostra os 6 status individualmente, não como bloco único concatenado', () => {
    render(<QualificadoStatusHelp />)
    fireEvent.click(screen.getByRole('button', { name: /Ajuda sobre os passos da oportunidade/i }))
    for (const status of ['Nova', 'Validação', 'Construção', 'Compromisso', 'Decisão', 'Recuperação']) {
      expect(screen.getByText(status)).toBeTruthy()
    }
  })

  it('preserva o conteúdo literal de cada status (Mentor Comercial, Próxima ação, etc.)', () => {
    render(<QualificadoStatusHelp />)
    fireEvent.click(screen.getByRole('button', { name: /Ajuda sobre os passos da oportunidade/i }))
    expect(screen.getByText(/Mentor Comercial: inicia a cadência/)).toBeTruthy()
  })

  it('fecha ao clicar novamente (toggle)', () => {
    render(<QualificadoStatusHelp />)
    const button = screen.getByRole('button', { name: /Ajuda sobre os passos da oportunidade/i })
    fireEvent.click(button)
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.click(button)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

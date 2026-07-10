import React from 'react'
import { describe, expect, it } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach } from 'bun:test'
import { FluxoFechamento } from './FluxoFechamento'

afterEach(cleanup)

describe('FluxoFechamento', () => {
  it('não aumenta o progresso ao apenas confirmar uma etapa sem informar dados', () => {
    render(
      <FluxoFechamento
        readValue={() => 0}
        updateField={() => {}}
        disabled={false}
        agdCartAtivos={0}
        agdNetAtivos={0}
        temClientesCadastrados={false}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Confirmar Showroom/i }))

    expect(screen.getByText('0%')).toBeTruthy()
  })
})

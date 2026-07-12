import React from 'react'
import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { CalendarDays } from 'lucide-react'
import { ManagerMetricCard, ManagerStatusGauge } from './ManagerVisualPrimitives'

afterEach(cleanup)

describe('ManagerVisualPrimitives', () => {
  it('expõe a métrica, contexto e ação com a hierarquia visual do vendedor', () => {
    render(
      <ManagerMetricCard
        title="Agendamentos"
        value="12"
        detail="Bom"
        icon={CalendarDays}
        actionLabel="Ver Agenda D+1"
        onAction={() => undefined}
        tone="success"
      />,
    )

    expect(screen.getByRole('heading', { name: 'Agendamentos' })).toBeTruthy()
    expect(screen.getByText('12')).toBeTruthy()
    expect(screen.getByText('Bom')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ver Agenda D+1' })).toBeTruthy()
  })

  it('representa disciplina por valor, texto e progressbar acessível', () => {
    render(<ManagerStatusGauge value={86} label="Muito boa" ariaLabel="Disciplina média da equipe" />)

    const gauge = screen.getByRole('progressbar', { name: 'Disciplina média da equipe' })
    expect(gauge.getAttribute('aria-valuenow')).toBe('86')
    expect(screen.getByText('86%')).toBeTruthy()
    expect(screen.getByText('Muito boa')).toBeTruthy()
  })
})

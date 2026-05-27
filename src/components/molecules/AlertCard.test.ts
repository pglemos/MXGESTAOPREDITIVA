import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import { AlertCard } from './AlertCard'

afterEach(() => cleanup())

describe('AlertCard', () => {
  const baseProps = {
    problem: 'Conversão abaixo da meta',
    impact: '−18% vs ano anterior',
    recommendation: 'Revisar funil semanal com gerente',
  }

  it('renderiza estrutura obrigatória do PRD §4.6 (problema/impacto/recomendação)', () => {
    render(React.createElement(AlertCard, { type: 'critical', ...baseProps }))
    expect(screen.getByText(baseProps.problem)).toBeInTheDocument()
    expect(screen.getByText(baseProps.impact)).toBeInTheDocument()
    expect(screen.getByText(baseProps.recommendation)).toBeInTheDocument()
  })

  it('usa role=alert + aria-live=assertive para critical', () => {
    render(React.createElement(AlertCard, { type: 'critical', ...baseProps }))
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive')
  })

  it('usa role=status + aria-live=polite para warning', () => {
    render(React.createElement(AlertCard, { type: 'warning', ...baseProps }))
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })

  it('usa role=status + aria-live=polite para positive', () => {
    render(React.createElement(AlertCard, { type: 'positive', ...baseProps }))
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })

  it('usa role=status + aria-live=polite para consultive', () => {
    render(React.createElement(AlertCard, { type: 'consultive', ...baseProps }))
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })

  it('renderiza CTA como botão quando onQuickAction é fornecida', () => {
    let clicked = false
    render(
      React.createElement(AlertCard, {
        type: 'consultive',
        ...baseProps,
        quickActionLabel: 'Ver detalhes',
        onQuickAction: () => {
          clicked = true
        },
      })
    )
    const btn = screen.getByRole('button', { name: /ver detalhes/i })
    expect(btn).toBeInTheDocument()
    btn.click()
    expect(clicked).toBe(true)
  })

  it('renderiza CTA como span quando onQuickAction é omitido', () => {
    render(
      React.createElement(AlertCard, {
        type: 'positive',
        ...baseProps,
        quickActionLabel: 'Apenas informativo',
      })
    )
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText(/apenas informativo/i)).toBeInTheDocument()
  })

  it('exibe título "Crítico" para type=critical', () => {
    render(React.createElement(AlertCard, { type: 'critical', ...baseProps }))
    expect(screen.getByText('Crítico')).toBeInTheDocument()
  })

  it('exibe título "Atenção" para type=warning', () => {
    render(React.createElement(AlertCard, { type: 'warning', ...baseProps }))
    expect(screen.getByText('Atenção')).toBeInTheDocument()
  })

  it('exibe título "Positivo" para type=positive', () => {
    render(React.createElement(AlertCard, { type: 'positive', ...baseProps }))
    expect(screen.getByText('Positivo')).toBeInTheDocument()
  })

  it('exibe título "Consultivo" para type=consultive', () => {
    render(React.createElement(AlertCard, { type: 'consultive', ...baseProps }))
    expect(screen.getByText('Consultivo')).toBeInTheDocument()
  })
})

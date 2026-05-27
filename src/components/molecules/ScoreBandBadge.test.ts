import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import { ScoreBandBadge } from './ScoreBandBadge'

afterEach(() => cleanup())

describe('ScoreBandBadge', () => {
  it('classifica score=95 como Elite', () => {
    render(React.createElement(ScoreBandBadge, { score: 95 }))
    expect(screen.getByText('Elite')).toBeInTheDocument()
  })

  it('classifica score=85 como Excelente', () => {
    render(React.createElement(ScoreBandBadge, { score: 85 }))
    expect(screen.getByText('Excelente')).toBeInTheDocument()
  })

  it('classifica score=72 como Bom', () => {
    render(React.createElement(ScoreBandBadge, { score: 72 }))
    expect(screen.getByText('Bom')).toBeInTheDocument()
  })

  it('classifica score=63 como Atenção', () => {
    render(React.createElement(ScoreBandBadge, { score: 63 }))
    expect(screen.getByText('Atenção')).toBeInTheDocument()
  })

  it('classifica score=45 como Crítico', () => {
    render(React.createElement(ScoreBandBadge, { score: 45 }))
    expect(screen.getByText('Crítico')).toBeInTheDocument()
  })

  it('aceita band explícito (ignora score)', () => {
    render(React.createElement(ScoreBandBadge, { score: 10, band: 'elite' }))
    expect(screen.getByText('Elite')).toBeInTheDocument()
  })

  it('mostra valor numérico quando showScore=true', () => {
    render(React.createElement(ScoreBandBadge, { score: 95, showScore: true }))
    expect(screen.getByText('95')).toBeInTheDocument()
  })

  it('mostra range quando showRange=true', () => {
    render(React.createElement(ScoreBandBadge, { band: 'elite', showRange: true }))
    expect(screen.getByText('(90–100)')).toBeInTheDocument()
  })

  it('tem role=status com aria-label correto', () => {
    render(React.createElement(ScoreBandBadge, { score: 80 }))
    const badge = screen.getByRole('status')
    expect(badge).toHaveAttribute('aria-label', 'MX Score 80 — faixa Excelente')
  })

  it('defensive para NaN → Crítico', () => {
    render(React.createElement(ScoreBandBadge, { score: NaN }))
    expect(screen.getByText('Crítico')).toBeInTheDocument()
  })
})

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ManagerSellerProfileModal } from './ManagerSellerProfileModal'
import { buildManagerTeamCard } from './manager-team-kanban'
import type { RankingEntry } from '@/types/database'

beforeEach(() => {
  cleanup()
  document.body.replaceChildren()
  document.body.removeAttribute('aria-hidden')
  document.body.removeAttribute('data-scroll-locked')
  document.body.style.pointerEvents = ''
})

afterEach(() => cleanup())

function seller(overrides: Partial<RankingEntry> = {}): RankingEntry {
  return {
    user_id: 'seller-1',
    user_name: 'Álvaro Souza',
    is_venda_loja: false,
    vnd_total: 0,
    leads: 12,
    agd_total: 3,
    visitas: 1,
    meta: 10,
    atingimento: 0,
    projecao: 0,
    ritmo: 1,
    efficiency: 0,
    status: { label: '', color: '' },
    gap: 10,
    position: 1,
    routine_execution: null,
    discipline_score: null,
    ...overrides,
  }
}

function renderProfile(overrides: Partial<RankingEntry> = {}) {
  const row = seller(overrides)
  const onClose = vi.fn()
  const onOpenFeedback = vi.fn()
  const onOpenRoutine = vi.fn()
  const onOpenTraining = vi.fn()

  render(<ManagerSellerProfileModal open seller={row} card={buildManagerTeamCard(row)} storeName="Matriz" onClose={onClose} onOpenFeedback={onOpenFeedback} onOpenRoutine={onOpenRoutine} onOpenTraining={onOpenTraining} />)
  return { onClose, onOpenFeedback, onOpenRoutine, onOpenTraining }
}

describe('ManagerSellerProfileModal Base44 parity', () => {
  test('reproduz cabeçalho, cinco abas e estado de diagnóstico sem fabricar dados', () => {
    renderProfile()

    expect(document.querySelector('[aria-label="Perfil de Álvaro Souza"]')).toBeTruthy()
    expect(screen.getByText('Álvaro Souza')).toBeTruthy()
    expect(screen.getByText('Composição do Status')).toBeTruthy()
    expect(screen.getByText('Consistência parcial — aguardando fechamentos oficiais.')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Visão Geral' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Performance' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Rotina' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Feedbacks' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Treinamentos' })).toBeTruthy()
    expect(screen.getByText('Data da última venda')).toBeTruthy()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  test('alterna abas e mantém as ações contextuais do vendedor', () => {
    const actions = renderProfile({ vnd_total: 2, routine_execution: 80, discipline_score: 70 })

    fireEvent.click(screen.getByRole('tab', { name: 'Performance' }))
    expect(screen.getByText('Vendas por canal')).toBeTruthy()
    expect(screen.getByText('Atendimento anterior / Sem canal confirmado')).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: 'Rotina' }))
    expect(screen.getByText('Rotina do período')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Rotina da Equipe' }))
    expect(actions.onOpenRoutine).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('tab', { name: 'Feedbacks' }))
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Feedbacks' }))
    expect(actions.onOpenFeedback).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Registrar feedback' }))
    expect(actions.onOpenFeedback).toHaveBeenCalledTimes(2)
  })
})

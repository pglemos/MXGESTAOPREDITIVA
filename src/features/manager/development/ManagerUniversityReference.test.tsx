import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import type { TrainingWithProgress } from '@/hooks/useTrainings'
import {
  AssignTrainingDialog,
  CatalogTrackDialog,
  OfficialTrainingGrid,
  buildTeamRows,
  getSafeTrainingMaterialUrl,
} from './ManagerUniversityReference'

globalThis.getComputedStyle ||= window.getComputedStyle.bind(window)
globalThis.MutationObserver ||= window.MutationObserver

afterEach(cleanup)

function training(overrides: Partial<TrainingWithProgress> = {}): TrainingWithProgress {
  return {
    id: 'training-1',
    title: 'Liderança aplicada',
    description: 'Conteúdo oficial da Universidade MX.',
    type: 'institucional',
    video_url: 'https://example.com/material',
    target_audience: 'gerente',
    active: true,
    created_at: '2026-07-13T00:00:00.000Z',
    watched: false,
    user_rating: null,
    user_comment: null,
    average_rating: 0,
    rating_count: 0,
    needs_review: false,
    ...overrides,
  }
}

function AssignmentDialogHarness() {
  const [assigningTo, setAssigningTo] = useState<string | null>(null)

  return (
    <>
      <button type="button" onClick={() => setAssigningTo('seller-1')}>Abrir atribuição</button>
      <AssignTrainingDialog
        assigningTo={assigningTo}
        allTrainings={[training()]}
        isAssigning={false}
        onClose={() => setAssigningTo(null)}
        onAssignTraining={async () => undefined}
      />
    </>
  )
}

function CatalogDialogHarness() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Abrir catálogo</button>
      <CatalogTrackDialog
        track={open ? {
          id: 'lideranca-comercial',
          title: 'Liderança Comercial',
          description: 'Desenvolva habilidades de liderança.',
          lessons: 8,
        } : null}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

describe('ManagerUniversityReference dialogs', () => {
  test('mantém o foco no diálogo de atribuição e o restaura ao gatilho', async () => {
    render(<AssignmentDialogHarness />)
    const trigger = screen.getByRole('button', { name: 'Abrir atribuição' })
    trigger.focus()
    fireEvent.click(trigger)

    await screen.findByRole('dialog', { name: 'Atribuir treinamento' })
    const focusScope = screen.getByTestId('assign-training-focus-scope')
    const trainingButton = screen.getByRole('button', { name: 'Liderança aplicada' })
    const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
    await waitFor(() => expect(document.activeElement === trainingButton).toBe(true))

    cancelButton.focus()
    fireEvent.keyDown(cancelButton, { key: 'Tab' })
    expect(document.activeElement === trainingButton).toBe(true)
    trainingButton.focus()
    fireEvent.keyDown(trainingButton, { key: 'Tab', shiftKey: true })
    expect(document.activeElement === cancelButton).toBe(true)
    expect(focusScope.contains(document.activeElement)).toBe(true)

    fireEvent.click(cancelButton)
    await waitFor(() => expect(document.activeElement === trigger).toBe(true))
  })

  test('inicia foco no diálogo de catálogo e o devolve ao gatilho ao fechar', async () => {
    render(<CatalogDialogHarness />)
    const trigger = screen.getByRole('button', { name: 'Abrir catálogo' })
    trigger.focus()
    fireEvent.click(trigger)

    await screen.findByRole('dialog', { name: 'Liderança Comercial' })
    const closeButton = screen.getByRole('button', { name: 'Fechar' })
    await waitFor(() => expect(document.activeElement === closeButton).toBe(true))

    fireEvent.click(closeButton)
    await waitFor(() => expect(document.activeElement === trigger).toBe(true))
  })
})

describe('OfficialTrainingGrid', () => {
  test('só habilita a conclusão depois que o material seguro é aberto', () => {
    const onMarkWatched = mock(async () => undefined)
    render(<OfficialTrainingGrid trainings={[training()]} onMarkWatched={onMarkWatched} />)

    const lockedButton = screen.getByRole('button', { name: 'Abra o conteúdo para concluir' })
    expect(lockedButton).toBeDisabled()

    const materialLink = screen.getByRole('link', { name: 'Abrir conteúdo' })
    expect(materialLink).toHaveAttribute('href', 'https://example.com/material')
    expect(materialLink).toHaveAttribute('target', '_blank')
    expect(materialLink).toHaveAttribute('rel', 'noopener noreferrer')
    fireEvent.click(materialLink)

    const enabledButton = screen.getByRole('button', { name: 'Marcar como concluído' })
    expect(enabledButton).toBeEnabled()
    fireEvent.click(enabledButton)
    expect(onMarkWatched).toHaveBeenCalledWith('training-1')
  })

  test('mantém conclusão indisponível quando não há material publicado', () => {
    const onMarkWatched = mock(async () => undefined)
    render(
      <OfficialTrainingGrid
        trainings={[training({ id: 'training-without-material', video_url: '' })]}
        onMarkWatched={onMarkWatched}
      />,
    )

    expect(screen.queryByRole('link', { name: 'Abrir conteúdo' })).toBeNull()
    expect(screen.getByText('Material indisponível')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Conclusão indisponível' })).toBeDisabled()
    expect(onMarkWatched).not.toHaveBeenCalled()
  })

  test('rejeita protocolos inseguros no link publicado', () => {
    expect(getSafeTrainingMaterialUrl('javascript:alert(1)')).toBeNull()
    expect(getSafeTrainingMaterialUrl('data:text/html,unsafe')).toBeNull()
    expect(getSafeTrainingMaterialUrl('https://example.com/aula')).toBe('https://example.com/aula')
  })
})

describe('buildTeamRows', () => {
  test('limita o progresso a 100% quando existem IDs assistidos obsoletos', () => {
    const [member] = buildTeamRows([{
      seller_id: 'seller-1',
      seller_name: 'Ana',
      avatar_url: null,
      watched: ['training-current', 'training-stale'],
      total_trainings: 1,
      percentage: 200,
      current_gap: null,
      gap_training_completed: true,
    }], 1)

    expect(member.progress).toBe(100)
  })
})

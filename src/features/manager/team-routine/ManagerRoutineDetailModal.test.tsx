import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { ManagerRoutineDetailModal } from './ManagerRoutineDetailModal'

globalThis.getComputedStyle ||= (() => ({ animationName: 'none' })) as typeof getComputedStyle
globalThis.MutationObserver ||= class { observe() {}; disconnect() {}; takeRecords() { return [] } } as unknown as typeof MutationObserver

describe('ManagerRoutineDetailModal', () => {
  afterEach(() => cleanup())

  test('reproduz o estado vazio do Base44 sem inventar ações', () => {
    render(<ManagerRoutineDetailModal open sellerName="Ana" date="2026-07-11" actions={[]} appointments={0} execution={0} onClose={() => undefined} />)

    expect(screen.getByText('Nenhuma rotina registrada para este vendedor nesta data.')).toBeTruthy()
    expect(screen.queryByText('Atividades da Central de Execução')).toBeNull()
  })
})

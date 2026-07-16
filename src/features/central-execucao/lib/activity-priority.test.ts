import { describe, expect, test } from 'bun:test'
import { sortCentralActions } from './activity-priority'

interface PriorityFixture {
  id: string
  due_at: string
  priority_rank: number
  status: 'pendente' | 'em_andamento' | 'reagendada'
}

function action(overrides: Partial<PriorityFixture> & Pick<PriorityFixture, 'id'>): PriorityFixture {
  return {
    id: overrides.id,
    due_at: overrides.due_at ?? '2026-07-16T15:00:00-03:00',
    priority_rank: overrides.priority_rank ?? 5,
    status: overrides.status ?? 'pendente',
  }
}

describe('sortCentralActions', () => {
  test('ordena vencidas antes das futuras e desempata por prioridade e horário', () => {
    const now = new Date('2026-07-16T12:00:00-03:00')
    const result = sortCentralActions(
      [
        action({ id: 'future', due_at: '2026-07-16T16:00:00-03:00', priority_rank: 1 }),
        action({ id: 'late-low', due_at: '2026-07-16T10:00:00-03:00', priority_rank: 5 }),
        action({ id: 'late-high', due_at: '2026-07-16T11:00:00-03:00', priority_rank: 1 }),
      ],
      now,
    )

    expect(result.map(item => item.id)).toEqual(['late-high', 'late-low', 'future'])
  })

  test('não altera a lista recebida', () => {
    const input = [
      action({ id: 'later', due_at: '2026-07-16T16:00:00-03:00' }),
      action({ id: 'earlier', due_at: '2026-07-16T14:00:00-03:00' }),
    ]
    const snapshot = input.map(item => item.id)

    sortCentralActions(input, new Date('2026-07-16T12:00:00-03:00'))

    expect(input.map(item => item.id)).toEqual(snapshot)
  })

  test('mantém ordenação determinística para datas inválidas', () => {
    const result = sortCentralActions(
      [
        action({ id: 'invalid-b', due_at: 'invalid-date', priority_rank: 2 }),
        action({ id: 'valid', due_at: '2026-07-16T14:00:00-03:00', priority_rank: 3 }),
        action({ id: 'invalid-a', due_at: 'invalid-date', priority_rank: 1 }),
      ],
      new Date('2026-07-16T12:00:00-03:00'),
    )

    expect(result.map(item => item.id)).toEqual(['invalid-a', 'invalid-b', 'valid'])
  })
})

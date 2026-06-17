import { describe, expect, test } from 'bun:test'
import {
  FEEDBACK_ACTION_CATALOG_VERSION,
  FEEDBACK_ACTIONS_CATALOG,
  applyFeedbackActionTemplate,
  findFeedbackActionTemplate,
} from './feedback-action-catalog'

describe('feedback action catalog', () => {
  test('keeps a versioned catalog with mandatory operational actions', () => {
    expect(FEEDBACK_ACTION_CATALOG_VERSION).toBe(1)
    expect(FEEDBACK_ACTIONS_CATALOG.length).toBeGreaterThanOrEqual(4)
    expect(FEEDBACK_ACTIONS_CATALOG.map(action => action.id)).toEqual(
      expect.arrayContaining([
        'retornos_qualificados_diarios',
        'confirmacao_visita',
        'argumentacao_financiamento',
        'retomar_clientes_parados',
      ]),
    )
    for (const action of FEEDBACK_ACTIONS_CATALOG) {
      expect(action.version).toBe(FEEDBACK_ACTION_CATALOG_VERSION)
      expect(action.title.length).toBeGreaterThan(4)
      expect(action.actionTemplate).toContain('{{sellerName}}')
      expect(action.actionTemplate).toContain('{{weekReference}}')
      expect(action.suggestedTime).toMatch(/^\d{2}:\d{2}$/)
    }
  })

  test('applies selected template into concrete feedback action text', () => {
    const text = applyFeedbackActionTemplate('confirmacao_visita', {
      sellerName: 'Ana',
      weekReference: '2026-06-15',
    })

    expect(text).toContain('Ana')
    expect(text).toContain('2026-06-15')
    expect(text).toContain('08:30')
    expect(text).toContain('confirmar')
  })

  test('returns null for unknown action id', () => {
    expect(findFeedbackActionTemplate('desconhecida')).toBeNull()
    expect(applyFeedbackActionTemplate('desconhecida', {
      sellerName: 'Ana',
      weekReference: '2026-06-15',
    })).toBeNull()
  })
})

import { describe, expect, test } from 'bun:test'
import { getResultOptions, isResultAllowedForActivity } from './activity-results'

describe('getResultOptions', () => {
  test('retorno possui resultados próprios e escalonamento gerencial', () => {
    expect(getResultOptions('retorno').map(item => item.code)).toEqual([
      'contacted',
      'no_answer',
      'no_response',
      'reschedule',
      'advanced',
      'manager_required',
    ])
  })

  test('entrega, garantia e pós-venda não reutilizam um catálogo genérico', () => {
    expect(getResultOptions('entrega').map(item => item.code)).toContain('delivery_completed')
    expect(getResultOptions('entrega').map(item => item.code)).toContain('documentation_pending')
    expect(getResultOptions('garantia').map(item => item.code)).toContain('waiting_part')
    expect(getResultOptions('garantia').map(item => item.code)).toContain('warranty_resolved')
    expect(getResultOptions('pos_venda').map(item => item.code)).toContain('repurchase')
    expect(getResultOptions('pos_venda').map(item => item.code)).toContain('referral')
  })

  test('valida resultado contra o tipo sem aceitar códigos de outro fluxo', () => {
    expect(isResultAllowedForActivity('entrega', 'delivery_completed')).toBe(true)
    expect(isResultAllowedForActivity('retorno', 'delivery_completed')).toBe(false)
    expect(isResultAllowedForActivity('garantia', 'waiting_part')).toBe(true)
  })

  test('retorna lista vazia para tipo desconhecido em dados legados', () => {
    expect(getResultOptions('legacy_unknown' as never)).toEqual([])
  })
})

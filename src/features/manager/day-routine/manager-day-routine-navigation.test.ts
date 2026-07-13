import { describe, expect, test } from 'bun:test'

describe('manager day routine navigation context', () => {
  test('serializa e restaura somente contexto canônico da Rotina do Dia', async () => {
    const module = await import('./manager-day-routine-navigation').catch(() => ({})) as Record<string, unknown>
    const buildManagerRoutineNavigationContext = module.buildManagerRoutineNavigationContext
    const parseManagerRoutineNavigationContext = module.parseManagerRoutineNavigationContext

    expect(typeof buildManagerRoutineNavigationContext).toBe('function')
    expect(typeof parseManagerRoutineNavigationContext).toBe('function')
    if (typeof buildManagerRoutineNavigationContext !== 'function' || typeof parseManagerRoutineNavigationContext !== 'function') return

    const context = buildManagerRoutineNavigationContext({
      taskId: 'meta_hoje_2026-07-13',
      date: '2026-07-13',
      module: 'meta_loja',
      filter: 'resultado',
      sort: 'horario',
    })
    expect(context).toEqual({
      origemNavegacao: 'ROTINA_DO_DIA_GERENTE',
      tarefaId: 'meta_hoje_2026-07-13',
      data: '2026-07-13',
      modulo: 'meta_loja',
      filtros: { filtro: 'resultado', ordenacao: 'horario' },
    })
    expect(parseManagerRoutineNavigationContext(JSON.stringify(context))).toEqual({
      filter: 'resultado',
      sort: 'horario',
    })
    expect(parseManagerRoutineNavigationContext('{"origemNavegacao":"OUTRA_TELA"}')).toBeNull()
    expect(parseManagerRoutineNavigationContext('inválido')).toBeNull()
  })
})

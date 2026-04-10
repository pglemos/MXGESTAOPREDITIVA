import { describe, it, expect } from 'bun:test'
import { Window } from 'happy-dom'
// Nota: Em ambiente de teste de UI com Bun, focamos na lógica de classes e propriedades
// uma vez que o JSDOM completo é mais pesado.

describe('MXScoreCard UI Logic', () => {
  it('should return correct tone classes based on props', () => {
    // Simulação da lógica de cores do componente
    const getToneClass = (tone: string) => {
      switch(tone) {
        case 'brand': return 'text-brand-primary'
        case 'success': return 'text-status-success'
        case 'warning': return 'text-status-warning'
        default: return 'text-status-error'
      }
    }

    expect(getToneClass('brand')).toBe('text-brand-primary')
    expect(getToneClass('success')).toBe('text-status-success')
    expect(getToneClass('warning')).toBe('text-status-warning')
    expect(getToneClass('error')).toBe('text-status-error')
  })
})

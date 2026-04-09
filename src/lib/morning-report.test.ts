import { describe, it, expect } from 'bun:test'
import { formatWhatsAppMorningReport } from './calculations'

describe('Morning Report Logic', () => {
  const mockMetrics = {
    currentSales: 10,
    teamGoal: 100,
    projection: 20,
    reaching: 10,
    gap: 90,
    checkedInCount: 5,
    pendingSellers: ['João', 'Maria']
  }

  const mockRanking = [
    { user_name: 'Vendedor 1', vnd_total: 5, atingimento: 50, position: 1, agd_total: 2 },
    { user_name: 'Vendedor 2', vnd_total: 3, atingimento: 30, position: 2, agd_total: 1 }
  ]

  it('should format WhatsApp message correctly with standard data', () => {
    const message = formatWhatsAppMorningReport('Unidade Teste', '10/05/2025', mockMetrics, mockRanking as any)
    const normalized = message.toUpperCase().replace(/\*/g, '')
    
    expect(normalized).toContain('UNIDADE TESTE')
    expect(message).toContain('10/05/2025')
    expect(normalized).toContain('REALIZADO: 10')
    expect(normalized).toContain('VENDEDOR 1')
  })

  it('should handle empty ranking gracefully', () => {
    const message = formatWhatsAppMorningReport('Unidade Vazia', '10/05/2025', mockMetrics, [])
    const normalized = message.toUpperCase().replace(/\*/g, '')
    
    expect(normalized).toContain('UNIDADE VAZIA')
    expect(normalized).toContain('REALIZADO: 10')
  })

  it('should list pending sellers correctly', () => {
    const message = formatWhatsAppMorningReport('Unidade Teste', '10/05/2025', mockMetrics, mockRanking as any)
    expect(message).toContain('João, Maria')
  })

  it('should handle zero metrics without division errors', () => {
    const zeroMetrics = { ...mockMetrics, currentSales: 0, reaching: 0, projection: 0 }
    const message = formatWhatsAppMorningReport('Unidade Zero', '10/05/2025', zeroMetrics, [])
    const normalized = message.toUpperCase().replace(/\*/g, '')
    
    expect(normalized).toContain('REALIZADO: 0 (0%)')
  })
})

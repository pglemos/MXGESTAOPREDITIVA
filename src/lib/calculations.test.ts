import { describe, it, expect } from 'bun:test'
import { calcularAtingimento, gerarDiagnosticoMX } from './calculations'
import type { FunnelData } from '@/types/database'

describe('calcularAtingimento', () => {
  it('should calculate standard attainment percentage', () => {
    expect(calcularAtingimento(50, 100)).toBe(50)
    expect(calcularAtingimento(25, 100)).toBe(25)
  })

  it('should round to 1 decimal place', () => {
    // 1 / 3 = 0.3333... -> 33.333...% -> rounded to 33.3
    expect(calcularAtingimento(1, 3)).toBe(33.3)
    // 2 / 3 = 0.6666... -> 66.666...% -> rounded to 66.7
    expect(calcularAtingimento(2, 3)).toBe(66.7)
  })

  it('should handle overachievement (sales > target)', () => {
    expect(calcularAtingimento(150, 100)).toBe(150)
    expect(calcularAtingimento(200, 100)).toBe(200)
  })

  it('should return 0 when sales are 0', () => {
    expect(calcularAtingimento(0, 100)).toBe(0)
  })

  it('should return 0 when target is 0 (prevent division by zero)', () => {
    expect(calcularAtingimento(50, 0)).toBe(0)
  })

  it('should return 0 when target is negative', () => {
    expect(calcularAtingimento(50, -10)).toBe(0)
  })
})

describe('gerarDiagnosticoMX', () => {
  const defaultFunnel: FunnelData = {
    leads: 100, agd_total: 20, visitas: 12, vnd_total: 4,
    tx_lead_agd: 20, tx_agd_visita: 60, tx_visita_vnd: 33
  }

  it('should return system message if isVendaLoja is true', () => {
    const result = gerarDiagnosticoMX(defaultFunnel, true)
    expect(result.gargalo).toBe('SISTEMICO')
    expect(result.diagnostico).toContain('Registro de Venda Loja')
  })

  it('should detect LEAD_AGD bottleneck when tx_lead_agd is below benchmark', () => {
    const funnel: FunnelData = { ...defaultFunnel, tx_lead_agd: 19 } // Below 20
    const result = gerarDiagnosticoMX(funnel)
    expect(result.gargalo).toBe('LEAD_AGD')
    expect(result.diagnostico).toContain('Baixa conversão de Leads para Agendamentos')
  })

  it('should detect AGD_VISITA bottleneck when tx_agd_visita is below benchmark', () => {
    // tx_lead_agd is passing (>= 20)
    const funnel: FunnelData = { ...defaultFunnel, tx_lead_agd: 20, tx_agd_visita: 59 } // Below 60
    const result = gerarDiagnosticoMX(funnel)
    expect(result.gargalo).toBe('AGD_VISITA')
    expect(result.diagnostico).toContain('Baixa taxa de comparecimento')
  })

  it('should detect VISITA_VND bottleneck when tx_visita_vnd is below benchmark', () => {
    // Both lead_agd and agd_visita are passing
    const funnel: FunnelData = { ...defaultFunnel, tx_lead_agd: 20, tx_agd_visita: 60, tx_visita_vnd: 32 } // Below 33
    const result = gerarDiagnosticoMX(funnel)
    expect(result.gargalo).toBe('VISITA_VND')
    expect(result.diagnostico).toContain('Baixo fechamento em loja')
  })

  it('should return no bottleneck for a healthy funnel (meets exact benchmarks)', () => {
    // Exact benchmarks: 20, 60, 33
    const funnel: FunnelData = { ...defaultFunnel, tx_lead_agd: 20, tx_agd_visita: 60, tx_visita_vnd: 33 }
    const result = gerarDiagnosticoMX(funnel)
    expect(result.gargalo).toBeNull()
    expect(result.diagnostico).toContain('Funil equilibrado')
  })

  it('should return no bottleneck for a healthy funnel (exceeds benchmarks)', () => {
    const funnel: FunnelData = { ...defaultFunnel, tx_lead_agd: 25, tx_agd_visita: 65, tx_visita_vnd: 40 }
    const result = gerarDiagnosticoMX(funnel)
    expect(result.gargalo).toBeNull()
    expect(result.diagnostico).toContain('Funil equilibrado')
  })

  it('should use custom StoreMetaRules overrides for benchmarks', () => {
    // Custom benchmarks are significantly lower
    const customRules = {
      bench_lead_agd: 10,
      bench_agd_visita: 30,
      bench_visita_vnd: 20
    }

    // A funnel that would normally fail LEAD_AGD (15 < 20)
    const funnelWithCustomRules: FunnelData = { ...defaultFunnel, tx_lead_agd: 15, tx_agd_visita: 40, tx_visita_vnd: 25 }

    const result = gerarDiagnosticoMX(funnelWithCustomRules, false, customRules as any)

    // It should now pass everything because 15 >= 10, 40 >= 30, 25 >= 20
    expect(result.gargalo).toBeNull()
    expect(result.diagnostico).toContain('Funil equilibrado')

    // Test that it fails if it's below the custom rules
    const failingFunnel: FunnelData = { ...defaultFunnel, tx_lead_agd: 9, tx_agd_visita: 40, tx_visita_vnd: 25 }
    const resultFailing = gerarDiagnosticoMX(failingFunnel, false, customRules as any)
    expect(resultFailing.gargalo).toBe('LEAD_AGD')
  })
})

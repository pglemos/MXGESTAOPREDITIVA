import { describe, it, expect } from 'bun:test'
import {
  calcularTotais,
  calcularFunil,
  calcularAtingimento,
  calcularFaltaX,
  calcularProjecao,
  calcularRitmo,
  somarVendas,
  calcularScoreMX
} from './calculations'
import type { DailyCheckin } from '@/types/database'

// ... (testes anteriores mantidos) ...

describe('calcularScoreMX', () => {
  const funilBase = {
    leads: 100,
    agd_total: 20,
    visitas: 10,
    vnd_total: 3,
    tx_lead_agd: 20,
    tx_agd_visita: 50,
    tx_visita_vnd: 30
  }

  it('should calculate a high score for high performers with perfect discipline', () => {
    // 10 sales, 10 target, funil ok, 20 checkins in 20 days
    const score = calcularScoreMX(10, 10, funilBase, 20, 20)
    expect(score).toBeGreaterThan(800)
  })

  it('should penalize low discipline', () => {
    const perfectScore = calcularScoreMX(10, 10, funilBase, 20, 20)
    const lowDisciplineScore = calcularScoreMX(10, 10, funilBase, 10, 20)
    expect(lowDisciplineScore).toBeLessThan(perfectScore)
  })

  it('should handle zero sales or targets gracefully', () => {
    const score = calcularScoreMX(0, 10, funilBase, 20, 20)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

describe('Cenários de Venda Loja e Metas', () => {
  it('should calculate attainment correctly for Venda Loja when goal is present', () => {
    const attainment = calcularAtingimento(5, 10)
    expect(attainment).toBe(50)
  })

  it('should handle projection for Venda Loja (linear)', () => {
    const proj = calcularProjecao(10, 15, 30) // 10 sales in 15 days of a 30-day month
    expect(proj).toBe(20)
  })
})


describe('calcularTotais', () => {
  describe('when using CheckinFormData (has leads property)', () => {
    it('should calculate totals correctly with all values present', () => {
      const data = {
        leads: 10,
        agd_cart: 2,
        agd_net: 3,
        vnd_porta: 1,
        vnd_cart: 2,
        vnd_net: 1
      };
      const result = calcularTotais(data as any);
      expect(result).toEqual({
        agd_total: 5,
        vnd_total: 4
      });
    });

    it('should handle missing or undefined values by defaulting to 0', () => {
      const data = {
        leads: 5,
        agd_cart: 2
        // missing other fields
      };
      const result = calcularTotais(data as any);
      expect(result).toEqual({
        agd_total: 2,
        vnd_total: 0
      });
    });
  });

  describe('when using DailyCheckin (does not have leads property)', () => {
    it('should calculate totals correctly with all values present', () => {
      const data = {
        agd_cart_today: 4,
        agd_net_today: 2,
        vnd_porta_prev_day: 1,
        vnd_cart_prev_day: 1,
        vnd_net_prev_day: 1
      };
      const result = calcularTotais(data as any);
      expect(result).toEqual({
        agd_total: 6,
        vnd_total: 3
      });
    });

    it('should handle missing or undefined values by defaulting to 0', () => {
      const data = {
        agd_cart_today: 3
        // missing other fields
      };
      const result = calcularTotais(data as any);
      expect(result).toEqual({
        agd_total: 3,
        vnd_total: 0
      });
    });
  });
});

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

describe('calcularFaltaX', () => {
  it('should calculate remaining amount when sales < target', () => {
    expect(calcularFaltaX(100, 80)).toBe(20)
    expect(calcularFaltaX(10, 3)).toBe(7)
  })

  it('should return 0 when sales == target', () => {
    expect(calcularFaltaX(100, 100)).toBe(0)
  })

  it('should return 0 when sales > target', () => {
    expect(calcularFaltaX(100, 120)).toBe(0)
  })

  it('should return 0 when target is 0', () => {
    expect(calcularFaltaX(0, 50)).toBe(0)
    expect(calcularFaltaX(0, 0)).toBe(0)
  })
})

describe('calcularProjecao', () => {
  it('should calculate projection correctly', () => {
    // 10 sales / 5 days * 30 total days = 60
    expect(calcularProjecao(10, 5, 30)).toBe(60)
    // 5 sales / 10 days * 30 total days = 15
    expect(calcularProjecao(5, 10, 30)).toBe(15)
  })

  it('should round to nearest integer', () => {
    // 1 sale / 3 days * 31 total days = 10.333 -> 10
    expect(calcularProjecao(1, 3, 31)).toBe(10)
    // 2 sales / 3 days * 31 total days = 20.666 -> 21
    expect(calcularProjecao(2, 3, 31)).toBe(21)
  })

  it('should return 0 when days elapsed is 0', () => {
    expect(calcularProjecao(10, 0, 30)).toBe(0)
  })

  it('should return 0 when sales are 0', () => {
    expect(calcularProjecao(0, 10, 30)).toBe(0)
  })

  it('should return 0 when diasDecorridos is negative', () => {
    expect(calcularProjecao(10, -5, 30)).toBe(0)
  })

  it('should handle negative sales correctly (e.g. returns negative projection)', () => {
    expect(calcularProjecao(-10, 5, 30)).toBe(-60)
  })

  it('should handle negative totalDias correctly (e.g. returns negative projection)', () => {
    expect(calcularProjecao(10, 5, -30)).toBe(-60)
  })

  it('should calculate projection even if diasDecorridos > totalDias', () => {
    // 10 sales / 40 days elapsed * 30 total days = 7.5 -> 8
    expect(calcularProjecao(10, 40, 30)).toBe(8)
  })

  it('should handle fractional inputs correctly', () => {
    expect(calcularProjecao(10.5, 5.5, 30.5)).toBe(58)
  })

  it('should handle large numbers without precision issues', () => {
    expect(calcularProjecao(1000000, 15, 30)).toBe(2000000)
  })
})

describe('calcularRitmo', () => {
  it('should calculate required daily rhythm', () => {
    // (100 - 50) / 10 = 5.0
    expect(calcularRitmo(100, 50, 10)).toBe(5)
    // (100 - 90) / 4 = 2.5
    expect(calcularRitmo(100, 90, 4)).toBe(2.5)
  })

  it('should round to 1 decimal place', () => {
    // (100 - 50) / 3 = 16.666... -> 16.7
    expect(calcularRitmo(100, 50, 3)).toBe(16.7)
  })

  it('should return 0 when days remaining is 0 or negative', () => {
    expect(calcularRitmo(100, 50, 0)).toBe(0)
    expect(calcularRitmo(100, 50, -1)).toBe(0)
  })

  it('should return 0 when target is already reached', () => {
    expect(calcularRitmo(100, 100, 10)).toBe(0)
    expect(calcularRitmo(100, 120, 10)).toBe(0)
  })
})

describe('somarVendas', () => {
  it('should return 0 for an empty array', () => {
    expect(somarVendas([])).toBe(0)
  })

  it('should sum all sales channels from multiple check-ins', () => {
    const checkins = [
      {
        vnd_porta_prev_day: 1,
        vnd_cart_prev_day: 2,
        vnd_net_prev_day: 3
      },
      {
        vnd_porta_prev_day: 10,
        vnd_cart_prev_day: 0,
        vnd_net_prev_day: 5
      }
    ] as Partial<DailyCheckin>[]

    // (1+2+3) + (10+0+5) = 6 + 15 = 21
    expect(somarVendas(checkins as DailyCheckin[])).toBe(21)
  })

  it('should handle missing values (undefined/null)', () => {
    const checkins = [
      {
        vnd_porta_prev_day: 1,
        // missing other fields
      },
      {
        vnd_cart_prev_day: 5,
        vnd_net_prev_day: undefined
      }
    ] as Partial<DailyCheckin>[]

    expect(somarVendas(checkins as DailyCheckin[])).toBe(6)
  })
})

describe('calcularFunil', () => {
  it('should return all zeros for an empty array', () => {
    const result = calcularFunil([])
    expect(result).toEqual({
      leads: 0,
      agd_total: 0,
      visitas: 0,
      vnd_total: 0,
      tx_lead_agd: 0,
      tx_agd_visita: 0,
      tx_visita_vnd: 0,
    })
  })

  it('should calculate funnel totals and rates correctly', () => {
    const checkins = [
      {
        leads_prev_day: 10,
        agd_cart_prev_day: 1,
        agd_net_prev_day: 2,
        visit_prev_day: 2,
        vnd_porta_prev_day: 1,
        vnd_cart_prev_day: 0,
        vnd_net_prev_day: 0,
      },
      {
        leads_prev_day: 10,
        agd_cart_prev_day: 0,
        agd_net_prev_day: 1,
        visit_prev_day: 1,
        vnd_porta_prev_day: 0,
        vnd_cart_prev_day: 0,
        vnd_net_prev_day: 1,
      }
    ] as Partial<DailyCheckin>[]

    // totals:
    // leads = 20
    // agd_total = (1+2) + (0+1) = 4
    // visitas = 2 + 1 = 3
    // vnd_total = (1+0+0) + (0+0+1) = 2
    // tx_lead_agd = (4 / 20) * 100 = 20
    // tx_agd_visita = (3 / 4) * 100 = 75
    // tx_visita_vnd = (2 / 3) * 100 = 66.666... -> 67

    const result = calcularFunil(checkins as DailyCheckin[])
    expect(result).toEqual({
      leads: 20,
      agd_total: 4,
      visitas: 3,
      vnd_total: 2,
      tx_lead_agd: 20,
      tx_agd_visita: 75,
      tx_visita_vnd: 67,
    })
  })

  it('should handle undefined or null fields gracefully', () => {
    const checkins = [
      {
        leads_prev_day: undefined,
        agd_cart_prev_day: 5,
        // missing agd_net_prev_day
        visit_prev_day: null,
        vnd_porta_prev_day: undefined,
        vnd_cart_prev_day: null,
        vnd_net_prev_day: 2,
      }
    ] as unknown as DailyCheckin[]

    const result = calcularFunil(checkins)
    expect(result).toEqual({
      leads: 0,
      agd_total: 5,
      visitas: 0,
      vnd_total: 2,
      tx_lead_agd: 0,   // leads = 0
      tx_agd_visita: 0, // agd_total = 5, but visitas = 0
      tx_visita_vnd: 0, // visitas = 0
    })
  })

  it('should not divide by zero for rates', () => {
    const checkins = [
      {
        leads_prev_day: 0,
        agd_cart_prev_day: 5,
        agd_net_prev_day: 0,
        visit_prev_day: 2,
        vnd_porta_prev_day: 1,
        vnd_cart_prev_day: 0,
        vnd_net_prev_day: 0,
      }
    ] as Partial<DailyCheckin>[]

    const result = calcularFunil(checkins as DailyCheckin[])
    
    // leads = 0 -> tx_lead_agd should be 0
    expect(result.tx_lead_agd).toBe(0)
    
    // agd = 5 -> tx_agd_visita = (2 / 5) * 100 = 40
    expect(result.tx_agd_visita).toBe(40)
    
    // visitas = 2 -> tx_visita_vnd = (1 / 2) * 100 = 50
    expect(result.tx_visita_vnd).toBe(50)
  })
})

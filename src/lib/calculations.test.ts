import { describe, it, expect } from 'bun:test'
import { calcularAtingimento, calcularFunil } from './calculations'

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

describe('calcularFunil', () => {
  it('should calculate funnel data correctly with typical inputs', () => {
    // We import DailyCheckin locally if needed or just use type assertion
    const checkins: any[] = [
      {
        leads_prev_day: 10,
        agd_cart_prev_day: 2,
        agd_net_prev_day: 3,
        visit_prev_day: 3,
        vnd_porta_prev_day: 1,
        vnd_cart_prev_day: 0,
        vnd_net_prev_day: 1,
      },
      {
        leads_prev_day: 20,
        agd_cart_prev_day: 3,
        agd_net_prev_day: 2,
        visit_prev_day: 5,
        vnd_porta_prev_day: 0,
        vnd_cart_prev_day: 1,
        vnd_net_prev_day: 0,
      }
    ];

    const result = calcularFunil(checkins);

    expect(result.leads).toBe(30);
    expect(result.agd_total).toBe(10); // 2+3 + 3+2
    expect(result.visitas).toBe(8); // 3+5
    expect(result.vnd_total).toBe(3); // 1+0+1 + 0+1+0

    // Rates
    // tx_lead_agd = 10 / 30 = 33.33% -> 33
    expect(result.tx_lead_agd).toBe(33);
    // tx_agd_visita = 8 / 10 = 80% -> 80
    expect(result.tx_agd_visita).toBe(80);
    // tx_visita_vnd = 3 / 8 = 37.5% -> 38
    expect(result.tx_visita_vnd).toBe(38);
  });

  it('should handle empty input array', () => {
    const result = calcularFunil([]);
    expect(result).toEqual({
      leads: 0,
      agd_total: 0,
      visitas: 0,
      vnd_total: 0,
      tx_lead_agd: 0,
      tx_agd_visita: 0,
      tx_visita_vnd: 0,
    });
  });

  it('should treat undefined or null values as 0', () => {
    const checkins: any[] = [
      {
        leads_prev_day: undefined,
        agd_cart_prev_day: null,
        agd_net_prev_day: 5,
        visit_prev_day: undefined,
        vnd_porta_prev_day: null,
        vnd_cart_prev_day: null,
        vnd_net_prev_day: null,
      }
    ];

    const result = calcularFunil(checkins);

    expect(result.leads).toBe(0);
    expect(result.agd_total).toBe(5);
    expect(result.visitas).toBe(0);
    expect(result.vnd_total).toBe(0);
  });

  it('should prevent division by zero when calculating rates', () => {
    const checkins: any[] = [
      {
        leads_prev_day: 0,
        agd_cart_prev_day: 0,
        agd_net_prev_day: 0,
        visit_prev_day: 0,
        vnd_porta_prev_day: 0,
        vnd_cart_prev_day: 0,
        vnd_net_prev_day: 0,
      }
    ];

    const result = calcularFunil(checkins);

    expect(result.tx_lead_agd).toBe(0);
    expect(result.tx_agd_visita).toBe(0);
    expect(result.tx_visita_vnd).toBe(0);
  });
});

import { describe, expect, it } from 'bun:test'
import { addDaysDateOnly, deriveCrmDerivedTotals, getSaoPauloDayRange } from './crm-derived-totals'

describe('crm-derived-totals', () => {
  it('deriva o formulario D-1 a partir de clientes, oportunidades, atendimentos e agenda D0 do CRM', () => {
    const totals = deriveCrmDerivedTotals({
      referenceDate: '2026-06-16',
      clientes: [
        { created_at: '2026-06-16T12:00:00.000Z', canal_origem: 'carteira' },
        { created_at: '2026-06-16T23:30:00-03:00', canal_origem: 'internet' },
        { created_at: '2026-06-15T23:30:00-03:00', canal_origem: 'internet' },
      ],
      oportunidades: [
        { etapa: 'ganho', canal: 'porta', closed_at: '2026-06-16T10:00:00-03:00' },
        { etapa: 'ganho', canal: 'showroom', closed_at: '2026-06-16T11:00:00-03:00' },
        { etapa: 'ganho', canal: 'carteira', closed_at: '2026-06-16T12:00:00-03:00' },
        { etapa: 'ganho', canal: 'internet', closed_at: '2026-06-16T13:00:00-03:00' },
        { etapa: 'perdido', canal: 'internet', closed_at: '2026-06-16T14:00:00-03:00' },
        { etapa: 'ganho', canal: 'internet', closed_at: '2026-06-17T09:00:00-03:00' },
      ],
      atendimentos: [
        { data: '2026-06-16', canal: 'porta' },
        { data: '2026-06-16', canal: 'carteira' },
        { data: '2026-06-17', canal: 'internet' },
      ],
      agendamentos: [
        { canal: 'carteira', data_hora: '2026-06-17T09:00:00-03:00' },
        { canal: 'carteira', data_hora: '2026-06-17T15:00:00-03:00' },
        { canal: 'internet', data_hora: '2026-06-17T16:00:00-03:00' },
        { canal: 'internet', data_hora: '2026-06-16T16:00:00-03:00' },
        { canal: 'porta', data_hora: '2026-06-17T17:00:00-03:00' },
      ],
    })

    expect(totals).toEqual({
      leads: 2,
      leads_cart: 1,
      leads_net: 1,
      vnd_porta: 2,
      vnd_cart: 1,
      vnd_net: 1,
      visitas: 2,
      visitas_porta: 1,
      visitas_cart: 1,
      visitas_net: 0,
      agd_cart: 2,
      agd_net: 1,
      hasCrmData: true,
    })
  })

  it('calcula D0 como o dia seguinte ao D-1 e monta a janela operacional de Sao Paulo', () => {
    expect(addDaysDateOnly('2026-06-16', 1)).toBe('2026-06-17')
    expect(getSaoPauloDayRange('2026-06-16')).toEqual({
      startIso: '2026-06-16T03:00:00.000Z',
      endIso: '2026-06-17T03:00:00.000Z',
    })
  })
})

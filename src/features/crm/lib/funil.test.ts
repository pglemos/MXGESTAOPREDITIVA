import { describe, expect, it } from 'bun:test'
import {
  calcularDistribuicaoVendasPorCanal,
  calcularPlanoFunilPonderado,
  normalizarCanalEstrategia,
  type FunilOportunidadeLike,
} from './funil'

const baseOpportunity = (partial: Partial<FunilOportunidadeLike>): FunilOportunidadeLike => ({
  etapa: 'ganho',
  canal: 'internet',
  created_at: '2026-06-01T10:00:00.000Z',
  updated_at: '2026-06-01T10:00:00.000Z',
  closed_at: '2026-06-01T10:00:00.000Z',
  ...partial,
})

describe('funil ponderado por canal', () => {
  it('normaliza showroom como porta para estrategia comercial', () => {
    expect(normalizarCanalEstrategia('internet')).toBe('internet')
    expect(normalizarCanalEstrategia('carteira')).toBe('carteira')
    expect(normalizarCanalEstrategia('porta')).toBe('porta')
    expect(normalizarCanalEstrategia('showroom')).toBe('porta')
    expect(normalizarCanalEstrategia(null)).toBe(null)
  })

  it('calcula distribuicao por vendas ganhas dos ultimos tres meses', () => {
    const distribuicao = calcularDistribuicaoVendasPorCanal([
      baseOpportunity({ canal: 'internet', closed_at: '2026-06-10T12:00:00.000Z' }),
      baseOpportunity({ canal: 'internet', closed_at: '2026-05-10T12:00:00.000Z' }),
      baseOpportunity({ canal: 'carteira', closed_at: '2026-04-10T12:00:00.000Z' }),
      baseOpportunity({ canal: 'showroom', closed_at: '2026-06-12T12:00:00.000Z' }),
      baseOpportunity({ canal: 'porta', closed_at: '2026-03-15T12:00:00.000Z' }),
      baseOpportunity({ canal: 'internet', etapa: 'perdido', closed_at: '2026-06-13T12:00:00.000Z' }),
    ], new Date('2026-06-16T12:00:00-03:00'))

    expect(distribuicao.totalVendas).toBe(4)
    expect(distribuicao.canais).toEqual([
      { canal: 'internet', vendas: 2, percentual: 50, ativo: true },
      { canal: 'carteira', vendas: 1, percentual: 25, ativo: true },
      { canal: 'porta', vendas: 1, percentual: 25, ativo: true },
    ])
  })

  it('usa mix manual do perfil antes do historico e oculta canais zerados', () => {
    const plano = calcularPlanoFunilPonderado({
      faltaX: 10,
      metaRules: { bench_lead_agd: 20, bench_agd_visita: 60, bench_visita_vnd: 33, projection_mode: 'calendar' },
      oportunidades: [
        baseOpportunity({ canal: 'porta', closed_at: '2026-06-10T12:00:00.000Z' }),
        baseOpportunity({ canal: 'porta', closed_at: '2026-06-11T12:00:00.000Z' }),
      ],
      mixManual: { internet: 70, carteira: 30, porta: 0 },
      referenceDate: new Date('2026-06-16T12:00:00-03:00'),
    })

    expect(plano.fonte).toBe('manual')
    expect(plano.canais.map(canal => canal.canal)).toEqual(['internet', 'carteira'])
    expect(plano.canais.map(canal => canal.vendasPlanejadas)).toEqual([7, 3])
    expect(plano.canais[0].necessidade).toBe(177)
    expect(plano.canais[1].necessidade).toBe(16)
  })

  it('pondera o que falta pelo historico real quando nao ha mix manual', () => {
    const plano = calcularPlanoFunilPonderado({
      faltaX: 5,
      metaRules: { bench_lead_agd: 20, bench_agd_visita: 60, bench_visita_vnd: 33, projection_mode: 'calendar' },
      oportunidades: [
        baseOpportunity({ canal: 'internet', closed_at: '2026-06-10T12:00:00.000Z' }),
        baseOpportunity({ canal: 'internet', closed_at: '2026-06-11T12:00:00.000Z' }),
        baseOpportunity({ canal: 'internet', closed_at: '2026-06-12T12:00:00.000Z' }),
        baseOpportunity({ canal: 'carteira', closed_at: '2026-06-13T12:00:00.000Z' }),
      ],
      referenceDate: new Date('2026-06-16T12:00:00-03:00'),
    })

    expect(plano.fonte).toBe('historico')
    expect(plano.canais.map(canal => canal.canal)).toEqual(['internet', 'carteira'])
    expect(plano.canais.map(canal => canal.percentual)).toEqual([75, 25])
    expect(plano.canais.map(canal => canal.vendasPlanejadas)).toEqual([4, 1])
  })

  it('mantem fallback com todos os canais quando nao existe mix real nem manual', () => {
    const plano = calcularPlanoFunilPonderado({
      faltaX: 4,
      metaRules: { bench_lead_agd: 20, bench_agd_visita: 60, bench_visita_vnd: 33, projection_mode: 'calendar' },
      oportunidades: [],
      referenceDate: new Date('2026-06-16T12:00:00-03:00'),
    })

    expect(plano.fonte).toBe('fallback')
    expect(plano.canais.map(canal => canal.canal)).toEqual(['internet', 'carteira', 'porta'])
    expect(plano.canais.map(canal => canal.vendasPlanejadas)).toEqual([4, 4, 4])
    expect(plano.canais.map(canal => canal.necessidade)).toEqual([102, 21, 13])
  })
})

import { describe, expect, test } from 'bun:test'
import { buildCadenciaAnalytics, type CadenciaAnalyticsEstado, type CadenciaAnalyticsOportunidade } from './cadencia-analytics'

describe('buildCadenciaAnalytics', () => {
  test('aggregates bottlenecks by current cadence stage', () => {
    const analytics = buildCadenciaAnalytics({
      estados: [
        estado({ id: 'e1', etapa_atual: 'agendamento', status: 'ativo', last_result: 'nao_feito', reagendamentos_sem_sucesso: 2 }),
        estado({ id: 'e2', etapa_atual: 'agendamento', status: 'ativo', last_result: 'aguardando', reagendamentos_sem_sucesso: 1 }),
        estado({ id: 'e3', etapa_atual: 'visita', status: 'cancelado', last_result: 'nao_feito', reagendamentos_sem_sucesso: 3 }),
      ],
      oportunidades: [],
    })

    expect(analytics.gargalos[0]).toMatchObject({
      etapa: 'agendamento',
      total: 2,
      pendentes: 2,
      semSucesso: 1,
      aguardando: 1,
      reagendamentosSemSucesso: 3,
    })
    expect(analytics.gargalos[1]).toMatchObject({
      etapa: 'visita',
      total: 1,
      cancelados: 1,
      semSucesso: 1,
    })
  })

  test('aggregates vehicle demand from opportunities', () => {
    const analytics = buildCadenciaAnalytics({
      estados: [],
      oportunidades: [
        oportunidade({ tipo_veiculo: 'carro', valor_negociado: 100000 }),
        oportunidade({ tipo_veiculo: 'moto', valor_negociado: 30000 }),
        oportunidade({ tipo_veiculo: 'carro', valor_negociado: 90000 }),
        oportunidade({ tipo_veiculo: null, valor_negociado: 50000 }),
      ],
    })

    expect(analytics.demandaVeiculos).toEqual([
      { tipo_veiculo: 'carro', quantidade: 2, valorTotal: 190000 },
      { tipo_veiculo: 'moto', quantidade: 1, valorTotal: 30000 },
      { tipo_veiculo: 'nao_informado', quantidade: 1, valorTotal: 50000 },
    ])
  })

  test('computes conversion by cadence flow and version using won opportunities', () => {
    const analytics = buildCadenciaAnalytics({
      estados: [
        estado({ id: 'e1', cliente_id: 'c1', fluxo_id: 'fluxo-internet', fluxo_version: 1, status: 'ativo' }),
        estado({ id: 'e2', cliente_id: 'c2', fluxo_id: 'fluxo-internet', fluxo_version: 1, status: 'ativo' }),
        estado({ id: 'e3', cliente_id: 'c3', fluxo_id: 'fluxo-carteira', fluxo_version: 2, status: 'ativo' }),
      ],
      oportunidades: [
        oportunidade({ cliente_id: 'c1', etapa: 'ganho', valor_negociado: 120000 }),
        oportunidade({ cliente_id: 'c2', etapa: 'perdido', valor_negociado: 80000 }),
        oportunidade({ cliente_id: 'c3', etapa: 'ganho', valor_negociado: 70000 }),
      ],
    })

    expect(analytics.conversaoPorFluxo).toEqual([
      {
        fluxo_id: 'fluxo-carteira',
        fluxo_version: 2,
        totalClientes: 1,
        ganhos: 1,
        taxaConversao: 100,
        valorGanho: 70000,
      },
      {
        fluxo_id: 'fluxo-internet',
        fluxo_version: 1,
        totalClientes: 2,
        ganhos: 1,
        taxaConversao: 50,
        valorGanho: 120000,
      },
    ])
  })
})

function estado(overrides: Partial<CadenciaAnalyticsEstado> = {}): CadenciaAnalyticsEstado {
  return {
    id: 'estado-1',
    cliente_id: 'cliente-1',
    loja_id: 'loja-1',
    seller_user_id: 'seller-1',
    fluxo_id: 'fluxo-1',
    fluxo_version: 1,
    etapa_atual: 'lead',
    passo_atual_key: 'internet_mensagem_1',
    status: 'ativo',
    last_result: null,
    tentativas_passo: 0,
    tentativa_limite: 1,
    reagendamentos_sem_sucesso: 0,
    historico: [],
    created_at: '2026-06-16T09:00:00Z',
    updated_at: '2026-06-16T09:00:00Z',
    ...overrides,
  }
}

function oportunidade(overrides: Partial<CadenciaAnalyticsOportunidade> = {}): CadenciaAnalyticsOportunidade {
  return {
    id: 'opp-1',
    cliente_id: 'cliente-1',
    loja_id: 'loja-1',
    etapa: 'negociacao',
    tipo_veiculo: 'carro',
    valor_negociado: 0,
    ...overrides,
  }
}

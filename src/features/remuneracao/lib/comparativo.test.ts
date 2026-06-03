import { describe, test, expect } from 'bun:test'
import {
  calcularRemuneracaoEstimada,
  totalPlano,
  montarComparativo,
  type RemuneracaoPlano,
  type RemuneracaoBenchmark,
  type RemuneracaoRegra,
} from './comparativo'

function plano(cargo: string, fixo: number, variavel: number, beneficios: number): RemuneracaoPlano {
  return {
    id: `id-${cargo}`, loja_id: 'loja-1', cargo,
    salario_fixo: fixo, salario_variavel: variavel, beneficios,
    moeda: 'BRL', vigencia_inicio: '2026-01-01', observacoes: null,
    created_by: null, created_at: '2026-01-01', updated_at: '2026-01-01',
  } as RemuneracaoPlano
}

function bench(cargo: string, min: number, mediana: number, max: number): RemuneracaoBenchmark {
  return {
    id: `b-${cargo}`, cargo, regiao: 'Sudeste', faixa_tamanho: 'media', meta: null,
    faixa_min: min, faixa_mediana: mediana, faixa_max: max,
    fonte: 'pesquisa', data_referencia: '2026-01-01', created_at: '2026-01-01',
  } as RemuneracaoBenchmark
}

function regra(
  tipo: RemuneracaoRegra['tipo'],
  overrides: Partial<RemuneracaoRegra> = {},
): RemuneracaoRegra {
  return {
    id: `r-${tipo}`,
    loja_id: 'loja-1',
    cargo: 'Vendedor',
    tipo,
    valor: 0,
    percentual_meta_min: null,
    ativo: true,
    vigencia_inicio: '2026-01-01',
    observacoes: null,
    created_by: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  } as RemuneracaoRegra
}

describe('totalPlano', () => {
  test('soma fixo + variável + benefícios', () => {
    expect(totalPlano(plano('Vendedor', 2000, 1500, 500))).toBe(4000)
  })
  test('trata nulos/zeros', () => {
    expect(totalPlano({ salario_fixo: 1000, salario_variavel: 0, beneficios: 0 })).toBe(1000)
  })
})

describe('montarComparativo', () => {
  const benchmark = [bench('Vendedor', 3000, 4000, 5000)]

  test('classifica abaixo quando total < faixa_min', () => {
    const [linha] = montarComparativo([plano('Vendedor', 2000, 0, 0)], benchmark)
    expect(linha.classificacao).toBe('abaixo')
    expect(linha.total).toBe(2000)
  })

  test('classifica dentro quando total entre min e max', () => {
    const [linha] = montarComparativo([plano('Vendedor', 3000, 1000, 0)], benchmark)
    expect(linha.classificacao).toBe('dentro')
    expect(linha.faixa?.fonte).toBe('pesquisa')
  })

  test('classifica acima quando total > faixa_max', () => {
    const [linha] = montarComparativo([plano('Vendedor', 5000, 1000, 500)], benchmark)
    expect(linha.classificacao).toBe('acima')
  })

  test('marca sem_referencia quando não há benchmark do cargo', () => {
    const [linha] = montarComparativo([plano('Gerente', 8000, 0, 0)], benchmark)
    expect(linha.classificacao).toBe('sem_referencia')
    expect(linha.faixa).toBeUndefined()
  })

  test('limites inclusivos: total == min é dentro', () => {
    const [linha] = montarComparativo([plano('Vendedor', 3000, 0, 0)], benchmark)
    expect(linha.classificacao).toBe('dentro')
  })
})

describe('calcularRemuneracaoEstimada', () => {
  test('soma fixo, variável, benefícios, comissão por venda e bônus por meta projetada', () => {
    const resultado = calcularRemuneracaoEstimada({
      plano: plano('Vendedor', 2200, 300, 500),
      regras: [
        regra('comissao_por_venda', { valor: 150 }),
        regra('bonus_meta', { valor: 800, percentual_meta_min: 100 }),
      ],
      vendasConsideradas: 12,
      meta: 10,
    })

    expect(resultado.disponivel).toBe(true)
    expect(resultado.base).toBe(3000)
    expect(resultado.comissao).toBe(1800)
    expect(resultado.bonus).toBe(800)
    expect(resultado.total).toBe(5600)
    expect(resultado.atingimentoPercentual).toBe(120)
  })

  test('retorna pendente quando não há plano cadastrado', () => {
    const resultado = calcularRemuneracaoEstimada({
      plano: null,
      regras: [regra('comissao_por_venda', { valor: 100 })],
      vendasConsideradas: 5,
      meta: 10,
    })

    expect(resultado.disponivel).toBe(false)
    expect(resultado.total).toBe(0)
  })
})

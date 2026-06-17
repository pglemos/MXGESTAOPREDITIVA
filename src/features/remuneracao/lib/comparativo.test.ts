import { describe, test, expect } from 'bun:test'
import {
  calcularRemuneracaoEstimada,
  calcularResumoRemuneracaoVendedor,
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

  test('usa somente a comissão ativa com vigência mais recente', () => {
    const resultado = calcularRemuneracaoEstimada({
      plano: plano('Vendedor', 2000, 0, 0),
      regras: [
        regra('comissao_por_venda', { id: 'comissao-antiga', valor: 500, vigencia_inicio: '2026-01-01' }),
        regra('comissao_por_venda', { id: 'comissao-atual', valor: 800, vigencia_inicio: '2026-05-01' }),
      ],
      vendasConsideradas: 10,
      meta: 10,
    })

    expect(resultado.comissaoPorVenda).toBe(800)
    expect(resultado.comissao).toBe(8000)
    expect(resultado.regraComissaoAplicada?.id).toBe('comissao-atual')
  })

  test('aplica somente o maior patamar de bônus atingido', () => {
    const resultado = calcularRemuneracaoEstimada({
      plano: plano('Vendedor', 2000, 0, 0),
      regras: [
        regra('bonus_meta', { id: 'bonus-80', valor: 1000, percentual_meta_min: 80 }),
        regra('bonus_meta', { id: 'bonus-100', valor: 2500, percentual_meta_min: 100 }),
        regra('bonus_meta', { id: 'bonus-120', valor: 5000, percentual_meta_min: 120 }),
      ],
      vendasConsideradas: 10,
      meta: 10,
    })

    expect(resultado.bonus).toBe(2500)
    expect(resultado.regraBonusAplicada?.id).toBe('bonus-100')
    expect(resultado.regrasNaoAtingidas.map(item => item.id)).toEqual(['bonus-120'])
  })

  test('usa somente a regra mais recente quando o patamar de bônus se repete', () => {
    const resultado = calcularRemuneracaoEstimada({
      plano: plano('Vendedor', 2000, 0, 0),
      regras: [
        regra('bonus_meta', { id: 'bonus-100-antigo', valor: 1000, percentual_meta_min: 100, vigencia_inicio: '2026-01-01' }),
        regra('bonus_meta', { id: 'bonus-100-atual', valor: 2500, percentual_meta_min: 100, vigencia_inicio: '2026-05-01' }),
      ],
      vendasConsideradas: 10,
      meta: 10,
    })

    expect(resultado.bonus).toBe(2500)
    expect(resultado.bonusPatamares).toHaveLength(1)
    expect(resultado.regraBonusAplicada?.id).toBe('bonus-100-atual')
  })

  test('não aplica bônus quando a meta não é válida', () => {
    const resultado = calcularRemuneracaoEstimada({
      plano: plano('Vendedor', 2000, 0, 0),
      regras: [regra('bonus_meta', { id: 'bonus-0', valor: 1000, percentual_meta_min: 0 })],
      vendasConsideradas: 10,
      meta: 0,
    })

    expect(resultado.bonus).toBe(0)
    expect(resultado.regraBonusAplicada).toBeNull()
    expect(resultado.bonusPatamares[0]?.atingido).toBe(false)
  })

  test('mantém apenas a base quando não há regras cadastradas', () => {
    const resultado = calcularRemuneracaoEstimada({
      plano: plano('Vendedor', 2000, 300, 500),
      regras: [],
      vendasConsideradas: 10,
      meta: 10,
    })

    expect(resultado.total).toBe(2800)
    expect(resultado.comissao).toBe(0)
    expect(resultado.bonus).toBe(0)
    expect(resultado.regraComissaoAplicada).toBeNull()
    expect(resultado.bonusPatamares).toEqual([])
  })

  test('calcula zero de comissão quando não há vendas', () => {
    const resultado = calcularRemuneracaoEstimada({
      plano: plano('Vendedor', 2000, 0, 0),
      regras: [regra('comissao_por_venda', { valor: 500 })],
      vendasConsideradas: 0,
      meta: 10,
    })

    expect(resultado.vendasConsideradas).toBe(0)
    expect(resultado.comissao).toBe(0)
    expect(resultado.total).toBe(2000)
  })

  test('calcula percentual sobre faturamento das vendas', () => {
    const resultado = calcularRemuneracaoEstimada({
      plano: plano('Vendedor', 2000, 0, 0),
      regras: [regra('percentual_faturamento' as unknown as RemuneracaoRegra['tipo'], { valor: 2.5 })],
      vendasConsideradas: 2,
      meta: 10,
      vendasDetalhadas: [
        { valor: 100000, tipo_veiculo: 'carro' },
        { valor: 50000, tipo_veiculo: 'moto' },
      ],
    })

    expect(resultado.faturamentoConsiderado).toBe(150000)
    expect(resultado.comissaoPercentual).toBe(3750)
    expect(resultado.comissao).toBe(3750)
    expect(resultado.total).toBe(5750)
  })

  test('calcula comissão por categoria de veículo usando tipo_veiculo da venda', () => {
    const resultado = calcularRemuneracaoEstimada({
      plano: plano('Vendedor', 2000, 0, 0),
      regras: [
        regra('comissao_categoria' as unknown as RemuneracaoRegra['tipo'], { id: 'cat-carro', valor: 300, tipo_veiculo: 'carro' }),
        regra('comissao_categoria' as unknown as RemuneracaoRegra['tipo'], { id: 'cat-moto', valor: 100, tipo_veiculo: 'moto' }),
      ],
      vendasConsideradas: 3,
      meta: 10,
      vendasDetalhadas: [
        { valor: 100000, tipo_veiculo: 'carro' },
        { valor: 25000, tipo_veiculo: 'moto' },
        { valor: 200000, tipo_veiculo: 'caminhao' },
      ],
    })

    expect(resultado.comissaoCategoria).toBe(400)
    expect(resultado.comissao).toBe(400)
    expect(resultado.regrasComissaoAplicadas.map(item => item.id)).toEqual(['cat-carro', 'cat-moto'])
  })

  test('aplica comissão de equipe apenas para vendedor de loja', () => {
    const regraEquipe = regra('comissao_equipe' as unknown as RemuneracaoRegra['tipo'], { id: 'equipe-100', valor: 700, percentual_meta_min: 100 })

    const loja = calcularRemuneracaoEstimada({
      plano: plano('Vendedor', 2000, 0, 0),
      regras: [regraEquipe],
      vendasConsideradas: 4,
      meta: 10,
      vinculoTipo: 'loja',
      atingimentoLojaPercentual: 110,
    })
    const autonomo = calcularRemuneracaoEstimada({
      plano: plano('Vendedor', 2000, 0, 0),
      regras: [regraEquipe],
      vendasConsideradas: 4,
      meta: 10,
      vinculoTipo: 'autonomo',
      atingimentoLojaPercentual: 110,
    })

    expect(loja.comissaoEquipe).toBe(700)
    expect(loja.comissao).toBe(700)
    expect(autonomo.comissaoEquipe).toBe(0)
    expect(autonomo.comissao).toBe(0)
  })
})

describe('calcularResumoRemuneracaoVendedor', () => {
  test('calcula realizado e projeção com a mesma fonte de regras', () => {
    const resumo = calcularResumoRemuneracaoVendedor({
      plano: plano('Vendedor', 2000, 0, 0),
      regras: [regra('comissao_por_venda', { valor: 1000 })],
      vendasRealizadas: 4,
      vendasProjetadas: 9,
      meta: 10,
    })

    expect(resumo.realizado.vendasConsideradas).toBe(4)
    expect(resumo.realizado.comissao).toBe(4000)
    expect(resumo.projetado.vendasConsideradas).toBe(9)
    expect(resumo.projetado.comissao).toBe(9000)
  })

  test('nunca projeta menos vendas que o realizado', () => {
    const resumo = calcularResumoRemuneracaoVendedor({
      plano: plano('Vendedor', 2000, 0, 0),
      regras: [],
      vendasRealizadas: 7,
      vendasProjetadas: 3,
      meta: 10,
    })

    expect(resumo.projetado.vendasConsideradas).toBe(7)
  })
})

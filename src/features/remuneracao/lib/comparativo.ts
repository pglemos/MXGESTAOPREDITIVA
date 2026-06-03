import type { Database } from '@/types/database.generated'

export type RemuneracaoPlano = Database['public']['Tables']['remuneracao_planos']['Row']
export type RemuneracaoPlanoInsert = Database['public']['Tables']['remuneracao_planos']['Insert']
export type RemuneracaoBenchmark = Database['public']['Tables']['remuneracao_benchmark']['Row']
export type RemuneracaoRegra = Database['public']['Tables']['remuneracao_regras']['Row']
export type RemuneracaoRegraInsert = Database['public']['Tables']['remuneracao_regras']['Insert']
export type RemuneracaoRegraTipo = Database['public']['Enums']['remuneracao_regra_tipo']

export type Classificacao = 'abaixo' | 'dentro' | 'acima' | 'sem_referencia'

export interface ComparativoLinha {
  cargo: string
  total: number
  classificacao: Classificacao
  faixa?: { min: number; mediana: number; max: number; fonte: string; data: string }
}

export interface RemuneracaoEstimadaInput {
  plano: RemuneracaoPlano | null
  regras: RemuneracaoRegra[]
  vendasConsideradas: number
  meta: number
}

export interface RemuneracaoBonusPatamarDetalhe {
  regra: RemuneracaoRegra
  percentualMetaMin: number
  valor: number
  atingido: boolean
  aplicado: boolean
}

export interface RemuneracaoFormulaItem {
  chave: 'salario_fixo' | 'salario_variavel' | 'beneficios' | 'comissao' | 'bonus'
  label: string
  descricao: string
  valor: number
}

export interface RemuneracaoEstimadaResultado {
  disponivel: boolean
  cargo: string | null
  salarioFixo: number
  salarioVariavel: number
  beneficios: number
  base: number
  comissaoPorVenda: number
  comissao: number
  bonus: number
  total: number
  vendasConsideradas: number
  meta: number
  atingimentoPercentual: number
  regraComissaoAplicada: RemuneracaoRegra | null
  regraBonusAplicada: RemuneracaoRegra | null
  bonusPatamares: RemuneracaoBonusPatamarDetalhe[]
  regrasAplicadas: RemuneracaoRegra[]
  regrasNaoAtingidas: RemuneracaoRegra[]
  formulaItens: RemuneracaoFormulaItem[]
}

export interface RemuneracaoResumoVendedorInput {
  plano: RemuneracaoPlano | null
  regras: RemuneracaoRegra[]
  vendasRealizadas: number
  vendasProjetadas: number
  meta: number
}

export interface RemuneracaoResumoVendedor {
  realizado: RemuneracaoEstimadaResultado
  projetado: RemuneracaoEstimadaResultado
}

/** Total mensal de um plano (fixo + variável + benefícios). */
export function totalPlano(p: Pick<RemuneracaoPlano, 'salario_fixo' | 'salario_variavel' | 'beneficios'>): number {
  return Number(p.salario_fixo || 0) + Number(p.salario_variavel || 0) + Number(p.beneficios || 0)
}

/** Classifica cada plano contra a faixa de mercado do seu cargo. */
export function montarComparativo(
  planos: RemuneracaoPlano[],
  benchmark: RemuneracaoBenchmark[],
): ComparativoLinha[] {
  const porCargo = new Map<string, RemuneracaoBenchmark>()
  for (const b of benchmark) porCargo.set(b.cargo, b)

  return planos.map((p) => {
    const total = totalPlano(p)
    const b = porCargo.get(p.cargo)
    if (!b) return { cargo: p.cargo, total, classificacao: 'sem_referencia' as const }
    const min = Number(b.faixa_min), max = Number(b.faixa_max), mediana = Number(b.faixa_mediana)
    const classificacao: Classificacao = total < min ? 'abaixo' : total > max ? 'acima' : 'dentro'
    return {
      cargo: p.cargo,
      total,
      classificacao,
      faixa: { min, mediana, max, fonte: b.fonte, data: b.data_referencia },
    }
  })
}

export function calcularRemuneracaoEstimada({
  plano,
  regras,
  vendasConsideradas,
  meta,
}: RemuneracaoEstimadaInput): RemuneracaoEstimadaResultado {
  const vendas = Math.max(Number(vendasConsideradas || 0), 0)
  const metaMensal = Math.max(Number(meta || 0), 0)
  const atingimentoPercentual = metaMensal > 0 ? Math.round((vendas / metaMensal) * 100) : 0

  if (!plano) {
    return {
      disponivel: false,
      cargo: null,
      salarioFixo: 0,
      salarioVariavel: 0,
      beneficios: 0,
      base: 0,
      comissaoPorVenda: 0,
      comissao: 0,
      bonus: 0,
      total: 0,
      vendasConsideradas: vendas,
      meta: metaMensal,
      atingimentoPercentual,
      regraComissaoAplicada: null,
      regraBonusAplicada: null,
      bonusPatamares: [],
      regrasAplicadas: [],
      regrasNaoAtingidas: [],
      formulaItens: [],
    }
  }

  const regrasAtivas = regras.filter((regra) => regra.ativo !== false)
  const salarioFixo = Number(plano.salario_fixo || 0)
  const salarioVariavel = Number(plano.salario_variavel || 0)
  const beneficios = Number(plano.beneficios || 0)
  const base = salarioFixo + salarioVariavel + beneficios

  const regraComissaoAplicada = selecionarRegraMaisRecente(
    regrasAtivas.filter((regra) => regra.tipo === 'comissao_por_venda'),
  )
  const comissaoPorVenda = Number(regraComissaoAplicada?.valor || 0)
  const comissao = vendas * comissaoPorVenda

  const bonusPorPatamar = selecionarBonusMaisRecentePorPatamar(
    regrasAtivas.filter((regra) => regra.tipo === 'bonus_meta'),
  )
  const metaValida = metaMensal > 0
  const regraBonusAplicada = metaValida
    ? [...bonusPorPatamar]
        .filter((regra) => atingimentoPercentual >= percentualMinimo(regra))
        .sort((a, b) => percentualMinimo(b) - percentualMinimo(a))[0] || null
    : null
  const bonus = Number(regraBonusAplicada?.valor || 0)
  const bonusPatamares = bonusPorPatamar.map((regra) => {
    const atingido = metaValida && atingimentoPercentual >= percentualMinimo(regra)
    return {
      regra,
      percentualMetaMin: percentualMinimo(regra),
      valor: Number(regra.valor || 0),
      atingido,
      aplicado: regra.id === regraBonusAplicada?.id,
    }
  })
  const total = base + comissao + bonus
  const regrasAplicadas = [regraComissaoAplicada, regraBonusAplicada].filter(
    (regra): regra is RemuneracaoRegra => Boolean(regra),
  )
  const regrasNaoAtingidas = bonusPatamares.filter((patamar) => !patamar.atingido).map((patamar) => patamar.regra)
  const formulaItens: RemuneracaoFormulaItem[] = [
    {
      chave: 'salario_fixo',
      label: 'Salário fixo',
      descricao: 'Valor fixo mensal cadastrado no plano.',
      valor: salarioFixo,
    },
    {
      chave: 'salario_variavel',
      label: 'Variável do plano',
      descricao: 'Valor variável mensal cadastrado no plano.',
      valor: salarioVariavel,
    },
    {
      chave: 'beneficios',
      label: 'Benefícios',
      descricao: 'Benefícios mensais cadastrados no plano.',
      valor: beneficios,
    },
    {
      chave: 'comissao',
      label: 'Comissão por vendas',
      descricao: regraComissaoAplicada
        ? `${vendas} venda(s) consideradas multiplicadas pelo valor por venda.`
        : 'Nenhuma regra ativa de comissão por venda.',
      valor: comissao,
    },
    {
      chave: 'bonus',
      label: 'Bônus de meta',
      descricao: regraBonusAplicada
        ? `Maior patamar atingido: ${percentualMinimo(regraBonusAplicada)}% da meta.`
        : metaValida
          ? 'Nenhum patamar de bônus foi atingido.'
          : 'Bônus não aplicado porque a meta mensal não está cadastrada.',
      valor: bonus,
    },
  ]

  return {
    disponivel: true,
    cargo: plano.cargo,
    salarioFixo,
    salarioVariavel,
    beneficios,
    base,
    comissaoPorVenda,
    comissao,
    bonus,
    total,
    vendasConsideradas: vendas,
    meta: metaMensal,
    atingimentoPercentual,
    regraComissaoAplicada,
    regraBonusAplicada,
    bonusPatamares,
    regrasAplicadas,
    regrasNaoAtingidas,
    formulaItens,
  }
}

export function calcularResumoRemuneracaoVendedor({
  plano,
  regras,
  vendasRealizadas,
  vendasProjetadas,
  meta,
}: RemuneracaoResumoVendedorInput): RemuneracaoResumoVendedor {
  const realizadas = Math.max(Number(vendasRealizadas || 0), 0)
  const projetadas = Math.max(Number(vendasProjetadas || 0), realizadas)

  return {
    realizado: calcularRemuneracaoEstimada({
      plano,
      regras,
      vendasConsideradas: realizadas,
      meta,
    }),
    projetado: calcularRemuneracaoEstimada({
      plano,
      regras,
      vendasConsideradas: projetadas,
      meta,
    }),
  }
}

function selecionarRegraMaisRecente(regras: RemuneracaoRegra[]): RemuneracaoRegra | null {
  return [...regras].sort(compararRegraMaisRecente)[0] || null
}

function selecionarBonusMaisRecentePorPatamar(regras: RemuneracaoRegra[]): RemuneracaoRegra[] {
  const porPatamar = new Map<number, RemuneracaoRegra>()
  for (const regra of [...regras].sort(compararRegraMaisRecente)) {
    const patamar = percentualMinimo(regra)
    if (!porPatamar.has(patamar)) porPatamar.set(patamar, regra)
  }
  return [...porPatamar.values()].sort((a, b) => percentualMinimo(a) - percentualMinimo(b))
}

function compararRegraMaisRecente(a: RemuneracaoRegra, b: RemuneracaoRegra): number {
  return (
    b.vigencia_inicio.localeCompare(a.vigencia_inicio) ||
    b.updated_at.localeCompare(a.updated_at) ||
    b.id.localeCompare(a.id)
  )
}

function percentualMinimo(regra: RemuneracaoRegra): number {
  return Math.max(Number(regra.percentual_meta_min || 0), 0)
}

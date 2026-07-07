import type { Database } from '@/types/database.generated'

export type RemuneracaoPlano = Database['public']['Tables']['remuneracao_planos']['Row']
export type RemuneracaoPlanoInsert = Database['public']['Tables']['remuneracao_planos']['Insert']
export type RemuneracaoBenchmark = Database['public']['Tables']['remuneracao_benchmark']['Row']
export type RemuneracaoRegra = Database['public']['Tables']['remuneracao_regras']['Row']
export type RemuneracaoRegraInsert = Database['public']['Tables']['remuneracao_regras']['Insert']
export type RemuneracaoRegraTipo = Database['public']['Enums']['remuneracao_regra_tipo']
export type RemuneracaoTipoVeiculo = 'carro' | 'moto' | 'caminhao'
export type RemuneracaoVinculoTipo = 'loja' | 'autonomo'

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
  vendasDetalhadas?: RemuneracaoVenda[]
  faturamentoConsiderado?: number
  vinculoTipo?: RemuneracaoVinculoTipo
  atingimentoLojaPercentual?: number
  carrosVendidosLoja?: number
  nivelCarreira?: 'junior' | 'pleno' | 'lider'
}

export interface RemuneracaoVenda {
  valor: number
  tipo_veiculo?: RemuneracaoTipoVeiculo | string | null
}

export interface RemuneracaoBonusPatamarDetalhe {
  regra: RemuneracaoRegra
  percentualMetaMin: number
  valor: number
  atingido: boolean
  aplicado: boolean
}

export interface RemuneracaoFormulaItem {
  chave: 'salario_fixo' | 'salario_variavel' | 'beneficios' | 'comissao' | 'bonus' | 'bonus_carreira'
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
  comissaoFixa: number
  comissaoPercentual: number
  comissaoCategoria: number
  comissaoEquipe: number
  comissao: number
  bonus: number
  bonusCarreira: number
  total: number
  vendasConsideradas: number
  faturamentoConsiderado: number
  meta: number
  atingimentoPercentual: number
  regraComissaoAplicada: RemuneracaoRegra | null
  regrasComissaoAplicadas: RemuneracaoRegra[]
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
  vendasDetalhadasRealizadas?: RemuneracaoVenda[]
  faturamentoProjetado?: number
  vinculoTipo?: RemuneracaoVinculoTipo
  atingimentoLojaPercentual?: number
  carrosVendidosLoja?: number
  nivelCarreira?: 'junior' | 'pleno' | 'lider'
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
  vendasDetalhadas = [],
  faturamentoConsiderado,
  vinculoTipo = 'loja',
  atingimentoLojaPercentual,
  carrosVendidosLoja,
  nivelCarreira,
}: RemuneracaoEstimadaInput): RemuneracaoEstimadaResultado {
  const vendas = Math.max(Number(vendasConsideradas || 0), 0)
  const metaMensal = Math.max(Number(meta || 0), 0)
  const atingimentoPercentual = metaMensal > 0 ? Math.round((vendas / metaMensal) * 100) : 0
  const vendasValidas = vendasDetalhadas.filter(venda => Number.isFinite(Number(venda.valor)))
  const faturamento = Math.max(
    Number(faturamentoConsiderado ?? vendasValidas.reduce((acc, venda) => acc + Number(venda.valor || 0), 0)),
    0,
  )

  if (!plano) {
    return {
      disponivel: false,
      cargo: null,
      salarioFixo: 0,
      salarioVariavel: 0,
      beneficios: 0,
      base: 0,
      comissaoPorVenda: 0,
      comissaoFixa: 0,
      comissaoPercentual: 0,
      comissaoCategoria: 0,
      comissaoEquipe: 0,
      comissao: 0,
      bonus: 0,
      bonusCarreira: 0,
      total: 0,
      vendasConsideradas: vendas,
      faturamentoConsiderado: faturamento,
      meta: metaMensal,
      atingimentoPercentual,
      regraComissaoAplicada: null,
      regrasComissaoAplicadas: [],
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
  const comissaoFixa = vendas * comissaoPorVenda

  const regraPercentualAplicada = selecionarRegraMaisRecente(
    regrasAtivas.filter((regra) => regra.tipo === 'percentual_faturamento'),
  )
  const comissaoPercentual = faturamento * (Number(regraPercentualAplicada?.valor || 0) / 100)

  const regrasCategoria = selecionarRegraMaisRecentePorTipoVeiculo(
    regrasAtivas.filter((regra) => regra.tipo === 'comissao_categoria'),
  )
  const comissaoCategoria = vendasValidas.reduce((acc, venda) => {
    const regraCategoria = venda.tipo_veiculo ? regrasCategoria.get(venda.tipo_veiculo) : null
    return acc + Number(regraCategoria?.valor || 0)
  }, 0)

  // Bônus individual (bonus_meta) calculado ANTES de comissao_equipe porque
  // requer_bonus_individual precisa saber se o vendedor já bateu o próprio mínimo.
  const bonusPorPatamar = selecionarBonusMaisRecentePorPatamar(
    regrasAtivas.filter((regra) => regra.tipo === 'bonus_meta'),
  )
  const regraBonusAplicada = [...bonusPorPatamar]
    .filter((regra) => atingiuPatamarIndividual(regra, { vendas, metaValida: metaMensal > 0, atingimentoPercentual }))
    .sort((a, b) => patamarChave(b) - patamarChave(a))[0] || null
  const valorBonusIndividual = Number(regraBonusAplicada?.valor || 0)
  const bonusPatamares = bonusPorPatamar.map((regra) => {
    const atingido = atingiuPatamarIndividual(regra, { vendas, metaValida: metaMensal > 0, atingimentoPercentual })
    return {
      regra,
      percentualMetaMin: percentualMinimo(regra),
      valor: Number(regra.valor || 0),
      atingido,
      aplicado: regra.id === regraBonusAplicada?.id,
    }
  })

  const regrasEquipePorPatamar = selecionarBonusMaisRecentePorPatamar(
    regrasAtivas.filter((regra) => regra.tipo === 'comissao_equipe'),
  )
  const individualAtingiu = regraBonusAplicada !== null
  const regrasEquipeElegiveis = vinculoTipo === 'loja'
    ? regrasEquipePorPatamar.filter((regra) => atingiuPatamarEquipe(regra, {
        carrosVendidosLoja, atingimentoLojaPercentual, individualAtingiu,
      }))
    : []
  const regrasEquipeCumulativas = regrasEquipeElegiveis.filter((regra) => regra.cumulativo)
  const regrasEquipeNaoCumulativas = regrasEquipeElegiveis.filter((regra) => !regra.cumulativo)
  const melhorNaoCumulativa = [...regrasEquipeNaoCumulativas].sort((a, b) => patamarChave(b) - patamarChave(a))[0] || null
  const regrasEquipeAplicadas = melhorNaoCumulativa
    ? [...regrasEquipeCumulativas, melhorNaoCumulativa]
    : regrasEquipeCumulativas
  const comissaoEquipe = regrasEquipeAplicadas.reduce(
    (acc, regra) => acc + (regra.valor_por_unidade ? Number(regra.valor || 0) * vendas : Number(regra.valor || 0)),
    0,
  )

  const comissao = comissaoFixa + comissaoPercentual + comissaoCategoria + comissaoEquipe
  const regrasComissaoAplicadas = [
    regraComissaoAplicada,
    regraPercentualAplicada,
    ...Array.from(new Set(vendasValidas.map(venda => venda.tipo_veiculo).filter(Boolean)))
      .map(tipoVeiculo => regrasCategoria.get(String(tipoVeiculo)))
      .filter((regra): regra is RemuneracaoRegra => Boolean(regra)),
    ...regrasEquipeAplicadas,
  ].filter((regra): regra is RemuneracaoRegra => Boolean(regra))

  const regrasCarreira = selecionarRegraMaisRecentePorNivelCarreira(
    regrasAtivas.filter((regra) => regra.tipo === 'bonus_carreira'),
  )
  const regraCarreiraAplicada = nivelCarreira ? regrasCarreira.get(nivelCarreira) || null : null
  const bonusCarreira = Number(regraCarreiraAplicada?.valor || 0)

  const bonus = valorBonusIndividual + bonusCarreira
  const total = base + comissao + bonus
  const regrasAplicadas = [...regrasComissaoAplicadas, regraBonusAplicada, regraCarreiraAplicada].filter(
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
      descricao: regrasComissaoAplicadas.length > 0
        ? `Comissão calculada com ${vendas} venda(s) e ${formatCurrency(faturamento)} de faturamento.`
        : 'Nenhuma regra ativa de comissão.',
      valor: comissao,
    },
    {
      chave: 'bonus',
      label: 'Bônus de meta',
      descricao: regraBonusAplicada
        ? (regraBonusAplicada.unidade_meta_min != null
            ? `Mínimo individual atingido: ${regraBonusAplicada.unidade_meta_min} carro(s).`
            : `Maior patamar atingido: ${percentualMinimo(regraBonusAplicada)}% da meta.`)
        : 'Nenhum patamar de bônus foi atingido.',
      valor: valorBonusIndividual,
    },
    {
      chave: 'bonus_carreira',
      label: 'Bônus de carreira',
      descricao: regraCarreiraAplicada
        ? `Nível de carreira: ${nivelCarreira}.`
        : 'Nenhum nível de carreira atribuído.',
      valor: bonusCarreira,
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
    comissaoFixa,
    comissaoPercentual,
    comissaoCategoria,
    comissaoEquipe,
    comissao,
    bonus,
    bonusCarreira,
    total,
    vendasConsideradas: vendas,
    faturamentoConsiderado: faturamento,
    meta: metaMensal,
    atingimentoPercentual,
    regraComissaoAplicada: regrasComissaoAplicadas[0] || null,
    regrasComissaoAplicadas,
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
  vendasDetalhadasRealizadas = [],
  faturamentoProjetado,
  vinculoTipo,
  atingimentoLojaPercentual,
  carrosVendidosLoja,
  nivelCarreira,
}: RemuneracaoResumoVendedorInput): RemuneracaoResumoVendedor {
  const realizadas = Math.max(Number(vendasRealizadas || 0), 0)
  const projetadas = Math.max(Number(vendasProjetadas || 0), realizadas)
  const faturamentoRealizado = vendasDetalhadasRealizadas.reduce((acc, venda) => acc + Number(venda.valor || 0), 0)
  const ticketMedio = realizadas > 0 ? faturamentoRealizado / realizadas : 0

  return {
    realizado: calcularRemuneracaoEstimada({
      plano,
      regras,
      vendasConsideradas: realizadas,
      meta,
      vendasDetalhadas: vendasDetalhadasRealizadas,
      vinculoTipo,
      atingimentoLojaPercentual,
      carrosVendidosLoja,
      nivelCarreira,
    }),
    projetado: calcularRemuneracaoEstimada({
      plano,
      regras,
      vendasConsideradas: projetadas,
      meta,
      vendasDetalhadas: vendasDetalhadasRealizadas,
      faturamentoConsiderado: faturamentoProjetado ?? ticketMedio * projetadas,
      vinculoTipo,
      atingimentoLojaPercentual,
      carrosVendidosLoja,
      nivelCarreira,
    }),
  }
}

function selecionarRegraMaisRecente(regras: RemuneracaoRegra[]): RemuneracaoRegra | null {
  return [...regras].sort(compararRegraMaisRecente)[0] || null
}

/** Chave de patamar: usa unidade_meta_min quando preenchido, senão percentual_meta_min. */
function patamarChave(regra: RemuneracaoRegra): number {
  return regra.unidade_meta_min != null ? Number(regra.unidade_meta_min) : percentualMinimo(regra)
}

function selecionarBonusMaisRecentePorPatamar(regras: RemuneracaoRegra[]): RemuneracaoRegra[] {
  const porPatamar = new Map<number, RemuneracaoRegra>()
  for (const regra of [...regras].sort(compararRegraMaisRecente)) {
    const patamar = patamarChave(regra)
    if (!porPatamar.has(patamar)) porPatamar.set(patamar, regra)
  }
  return [...porPatamar.values()].sort((a, b) => patamarChave(a) - patamarChave(b))
}

function selecionarRegraMaisRecentePorTipoVeiculo(regras: RemuneracaoRegra[]): Map<string, RemuneracaoRegra> {
  const porTipo = new Map<string, RemuneracaoRegra>()
  for (const regra of [...regras].sort(compararRegraMaisRecente)) {
    const tipoVeiculo = regra.tipo_veiculo
    if (tipoVeiculo && !porTipo.has(tipoVeiculo)) porTipo.set(tipoVeiculo, regra)
  }
  return porTipo
}

function selecionarRegraMaisRecentePorNivelCarreira(regras: RemuneracaoRegra[]): Map<string, RemuneracaoRegra> {
  const porNivel = new Map<string, RemuneracaoRegra>()
  for (const regra of [...regras].sort(compararRegraMaisRecente)) {
    const nivel = regra.nivel_carreira
    if (nivel && !porNivel.has(nivel)) porNivel.set(nivel, regra)
  }
  return porNivel
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

/** bonus_meta: unidade_meta_min compara contra vendas do próprio vendedor; senão, percentual contra a meta em R$. */
function atingiuPatamarIndividual(
  regra: RemuneracaoRegra,
  { vendas, metaValida, atingimentoPercentual }: { vendas: number; metaValida: boolean; atingimentoPercentual: number },
): boolean {
  if (regra.unidade_meta_min != null) return vendas >= Number(regra.unidade_meta_min)
  return metaValida && atingimentoPercentual >= percentualMinimo(regra)
}

/** comissao_equipe: unidade_meta_min compara contra carros da loja; senão, percentual contra atingimento da loja. Trava por requer_bonus_individual. */
function atingiuPatamarEquipe(
  regra: RemuneracaoRegra,
  { carrosVendidosLoja, atingimentoLojaPercentual, individualAtingiu }: {
    carrosVendidosLoja?: number
    atingimentoLojaPercentual?: number
    individualAtingiu: boolean
  },
): boolean {
  if (regra.requer_bonus_individual && !individualAtingiu) return false
  if (regra.unidade_meta_min != null) {
    return carrosVendidosLoja != null && Number(carrosVendidosLoja) >= Number(regra.unidade_meta_min)
  }
  return atingimentoLojaPercentual != null && Number(atingimentoLojaPercentual) >= percentualMinimo(regra)
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

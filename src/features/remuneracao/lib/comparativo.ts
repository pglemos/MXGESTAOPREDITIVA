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

export interface RemuneracaoEstimadaResultado {
  disponivel: boolean
  cargo: string | null
  base: number
  comissao: number
  bonus: number
  total: number
  vendasConsideradas: number
  atingimentoPercentual: number
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
      base: 0,
      comissao: 0,
      bonus: 0,
      total: 0,
      vendasConsideradas: vendas,
      atingimentoPercentual,
    }
  }

  const regrasAtivas = regras.filter((regra) => regra.ativo !== false)
  const base = totalPlano(plano)
  const comissao = regrasAtivas
    .filter((regra) => regra.tipo === 'comissao_por_venda')
    .reduce((acc, regra) => acc + vendas * Number(regra.valor || 0), 0)
  const bonus = regrasAtivas
    .filter((regra) => regra.tipo === 'bonus_meta')
    .filter((regra) => atingimentoPercentual >= Number(regra.percentual_meta_min || 0))
    .reduce((acc, regra) => acc + Number(regra.valor || 0), 0)
  const total = base + comissao + bonus

  return {
    disponivel: true,
    cargo: plano.cargo,
    base,
    comissao,
    bonus,
    total,
    vendasConsideradas: vendas,
    atingimentoPercentual,
  }
}

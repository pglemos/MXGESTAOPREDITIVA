import type { Database } from '@/types/database.generated'

export type RemuneracaoPlano = Database['public']['Tables']['remuneracao_planos']['Row']
export type RemuneracaoPlanoInsert = Database['public']['Tables']['remuneracao_planos']['Insert']
export type RemuneracaoBenchmark = Database['public']['Tables']['remuneracao_benchmark']['Row']

export type Classificacao = 'abaixo' | 'dentro' | 'acima' | 'sem_referencia'

export interface ComparativoLinha {
  cargo: string
  total: number
  classificacao: Classificacao
  faixa?: { min: number; mediana: number; max: number; fonte: string; data: string }
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

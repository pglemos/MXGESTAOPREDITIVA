import type { Database } from '@/types/database.generated'

export type Questao = Database['public']['Tables']['comportamental_questoes']['Row']
export type QuestaoInsert = Database['public']['Tables']['comportamental_questoes']['Insert']
export type BancoTalento = Database['public']['Tables']['banco_talentos']['Row']
export type BancoTalentoInsert = Database['public']['Tables']['banco_talentos']['Insert']

export interface RespostaInput {
  questaoId: string
  dimensao: string
  valor: number
}

/** Calcula o perfil (média por dimensão) a partir das respostas. */
export function calcularPerfil(respostas: RespostaInput[]): Record<string, number> {
  const acc = new Map<string, { soma: number; n: number }>()
  for (const r of respostas) {
    const cur = acc.get(r.dimensao) ?? { soma: 0, n: 0 }
    cur.soma += r.valor
    cur.n += 1
    acc.set(r.dimensao, cur)
  }
  const perfil: Record<string, number> = {}
  for (const [dim, { soma, n }] of acc) perfil[dim] = Number((soma / n).toFixed(2))
  return perfil
}

export function dimensoesDe(questoes: Questao[]): string[] {
  return [...new Set(questoes.map(q => q.dimensao))].sort()
}

export function perfilEntries(perfil: BancoTalento['perfil_agregado']): [string, number][] {
  if (!perfil || typeof perfil !== 'object') return []
  return Object.entries(perfil as Record<string, unknown>).map(([k, v]) => [k, Number(v) || 0])
}

export const PDI_ORIGEM_NOTA = {
  GESTOR: 'gestor',
  AUTOAVALIACAO: 'autoavaliacao',
} as const

export type PDIOrigemNota = typeof PDI_ORIGEM_NOTA[keyof typeof PDI_ORIGEM_NOTA]

export interface PDICompetenciaAutoavaliacao {
  id: string
  alvo: number
}

export interface BuildPDISelfAssessmentPayloadInput {
  sellerId: string
  cargoId: string
  lojaId?: string | null
  proximaRevisaoData: string
  competencias: PDICompetenciaAutoavaliacao[]
  avaliacoes: Record<string, number>
}

export function buildPDISelfAssessmentPayload(input: BuildPDISelfAssessmentPayloadInput) {
  if (!input.sellerId) throw new Error('Sessao invalida.')
  if (!input.cargoId) throw new Error('Selecione o cargo do PDI.')
  if (!input.proximaRevisaoData) throw new Error('Informe a data da proxima revisao.')
  if (!input.competencias.length) throw new Error('Competencias do PDI nao carregadas.')

  const avaliacoes = input.competencias.map(competencia => {
    const nota = input.avaliacoes[competencia.id]
    if (!Number.isFinite(nota)) {
      throw new Error('Informe a nota de todas as competencias.')
    }

    return {
      competencia_id: competencia.id,
      nota_atribuida: nota,
      alvo: competencia.alvo || 10,
      origem_nota: PDI_ORIGEM_NOTA.AUTOAVALIACAO,
    }
  })

  return {
    colaborador_id: input.sellerId,
    loja_id: input.lojaId || null,
    cargo_id: input.cargoId,
    proxima_revisao_data: input.proximaRevisaoData,
    metas: [],
    plano_acao: [],
    avaliacoes,
  }
}

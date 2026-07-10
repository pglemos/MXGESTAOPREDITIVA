// UNIV-4 (auditoria 2026-07-10): motor de recomendação explicável da Universidade MX.
// Substitui o "Recomendado para Você" fabricado do protótipo Base44 (primeiros 4 da
// lista). Cada recomendação carrega motivos legíveis; sem sinal real, não recomenda.

export type NivelMaturidade = 'N1' | 'N2' | 'N3' | 'N4'

export type EtapaFunilAberta = 'prospeccao' | 'qualificacao' | 'apresentacao' | 'negociacao' | 'fechamento'

export type CompetenciaPdi =
    | 'comp_prospeccao'
    | 'comp_abordagem'
    | 'comp_demonstracao'
    | 'comp_negociacao'
    | 'comp_fechamento'
    | 'comp_crm'
    | 'comp_digital'
    | 'comp_produto'
    | 'comp_organizacao'
    | 'comp_disciplina'

export type SinaisRecomendacao = {
    /** Oportunidades abertas do vendedor por etapa do funil. */
    etapasAbertas: Partial<Record<EtapaFunilAberta, number>>
    /** Ações de devolutiva com status pendente. */
    devolutivaAcoesPendentes: number
    /** Notas do PDI mais recente (0–10); null quando o vendedor não tem PDI. */
    competenciasPdi: Partial<Record<CompetenciaPdi, number>> | null
    nivelMaturidade: NivelMaturidade
}

export type TreinamentoRecomendavel = {
    id: string
    title: string
    category: string
    level: string
    completed: boolean
}

export type Recomendacao = {
    id: string
    motivos: string[]
    score: number
}

const ETAPA_LABEL: Record<EtapaFunilAberta, string> = {
    prospeccao: 'Prospecção',
    qualificacao: 'Qualificação',
    apresentacao: 'Apresentação',
    negociacao: 'Negociação',
    fechamento: 'Fechamento',
}

const ETAPA_CATEGORIA: Record<EtapaFunilAberta, string> = {
    prospeccao: 'Prospecção',
    qualificacao: 'Atendimento',
    apresentacao: 'Atendimento',
    negociacao: 'Negociação',
    fechamento: 'Fechamento',
}

const COMPETENCIA_CATEGORIA: Record<CompetenciaPdi, string> = {
    comp_prospeccao: 'Prospecção',
    comp_abordagem: 'Atendimento',
    comp_demonstracao: 'Atendimento',
    comp_negociacao: 'Negociação',
    comp_fechamento: 'Fechamento',
    comp_crm: 'Carteira',
    comp_digital: 'WhatsApp',
    comp_produto: 'Atendimento',
    comp_organizacao: 'Mentalidade',
    comp_disciplina: 'Mentalidade',
}

const COMPETENCIA_LABEL: Record<CompetenciaPdi, string> = {
    comp_prospeccao: 'Prospecção',
    comp_abordagem: 'Abordagem',
    comp_demonstracao: 'Demonstração',
    comp_negociacao: 'Negociação',
    comp_fechamento: 'Fechamento',
    comp_crm: 'Carteira/CRM',
    comp_digital: 'Atendimento digital',
    comp_produto: 'Conhecimento de produto',
    comp_organizacao: 'Organização',
    comp_disciplina: 'Disciplina',
}

/**
 * Nota do PDI abaixo disso é tratada como lacuna de competência.
 * A escala é 0–10 e o default histórico da tabela é 6 — um PDI preenchido
 * com defaults não deve virar lacuna em tudo, por isso o corte é < 6.
 */
const NOTA_PDI_LACUNA = 6
/** Oportunidades paradas numa etapa a partir das quais ela vira gargalo. */
const MIN_OPORTUNIDADES_GARGALO = 3

type MotivoPorCategoria = { categoria: string; peso: number; motivo: string }

function motivosDosSinais(sinais: SinaisRecomendacao): MotivoPorCategoria[] {
    const motivos: MotivoPorCategoria[] = []

    if (sinais.competenciasPdi) {
        for (const [competencia, nota] of Object.entries(sinais.competenciasPdi) as [CompetenciaPdi, number][]) {
            if (typeof nota !== 'number' || nota >= NOTA_PDI_LACUNA) continue
            motivos.push({
                categoria: COMPETENCIA_CATEGORIA[competencia],
                peso: 3,
                motivo: `${COMPETENCIA_LABEL[competencia]} está em ${nota}/10 no seu PDI`,
            })
        }
    }

    const gargalo = (Object.entries(sinais.etapasAbertas) as [EtapaFunilAberta, number][])
        .filter(([, quantidade]) => quantidade >= MIN_OPORTUNIDADES_GARGALO)
        .sort((a, b) => b[1] - a[1])[0]
    if (gargalo) {
        motivos.push({
            categoria: ETAPA_CATEGORIA[gargalo[0]],
            peso: 2,
            motivo: `${gargalo[1]} oportunidades paradas em ${ETAPA_LABEL[gargalo[0]]}`,
        })
    }

    if (sinais.devolutivaAcoesPendentes > 0) {
        motivos.push({
            categoria: 'Mentalidade',
            peso: 2,
            motivo: `${sinais.devolutivaAcoesPendentes} ação(ões) de devolutiva pendente(s)`,
        })
    }

    return motivos
}

export function recomendarTreinamentos(
    trainings: TreinamentoRecomendavel[],
    sinais: SinaisRecomendacao,
    limite = 4,
): Recomendacao[] {
    const sinaisPorCategoria = motivosDosSinais(sinais)
    if (sinaisPorCategoria.length === 0) return []

    const recomendacoes: Recomendacao[] = []
    for (const training of trainings) {
        if (training.completed) continue
        const aplicaveis = sinaisPorCategoria.filter(s => s.categoria === training.category)
        if (aplicaveis.length === 0) continue

        let score = aplicaveis.reduce((total, s) => total + s.peso, 0)
        const motivos = aplicaveis.map(s => s.motivo)
        // Maturidade só desempata entre treinamentos já recomendados por sinal real.
        if (training.level.startsWith(sinais.nivelMaturidade)) {
            score += 1
            motivos.push(`Alinhado à sua trilha ${sinais.nivelMaturidade}`)
        }
        recomendacoes.push({ id: training.id, motivos, score })
    }

    return recomendacoes
        .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
        .slice(0, limite)
}

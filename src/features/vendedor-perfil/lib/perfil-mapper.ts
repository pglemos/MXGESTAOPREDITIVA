// Helpers puros do Meu Perfil do vendedor (migração P0-04: fora do shim
// base44Client, que fabricava monthly_goal=10 e devolvia birth_date/brand vazios).

export type PlanoRemuneracaoRow = {
    id: string
    cargo: string | null
    salario_fixo: number | null
    salario_variavel: number | null
    beneficios: number | null
}

export type PlanoDisponivel = {
    id: string
    cargo: string | null
    label: string
    salary_goal: number
    commission_per_unit: number
}

export function montarPlanosDisponiveis(planos: PlanoRemuneracaoRow[]): PlanoDisponivel[] {
    return planos.map(plano => ({
        id: plano.id,
        cargo: plano.cargo,
        label: `${plano.cargo} - R$ ${Number(plano.salario_fixo || 0).toLocaleString('pt-BR')} fixo`,
        salary_goal: Number(plano.salario_fixo || 0) + Number(plano.salario_variavel || 0) + Number(plano.beneficios || 0),
        commission_per_unit: Number(plano.salario_variavel || 0),
    }))
}

export function selecionarPlano(
    planos: PlanoDisponivel[],
    remuneracaoPlanoId: string | null,
    cargoAtual: string | null,
): PlanoDisponivel | null {
    return planos.find(plano => plano.id === remuneracaoPlanoId)
        ?? planos.find(plano => plano.cargo?.toLowerCase() === cargoAtual?.toLowerCase())
        ?? (planos.length === 1 ? planos[0] : null)
}

export type JornadaRow = { hora_entrada: string | null; hora_saida: string | null }
export type JornadaOption = { id: string; label: string; work_start: string; work_end: string }

export function montarOpcoesJornada(jornadas: JornadaRow[], horaEntradaAtual: string, horaSaidaAtual: string): JornadaOption[] {
    const porChave = new Map<string, JornadaOption>()
    const todas = [...jornadas, { hora_entrada: horaEntradaAtual, hora_saida: horaSaidaAtual }]
    for (const jornada of todas) {
        const start = jornada.hora_entrada ? jornada.hora_entrada.slice(0, 5) : ''
        const end = jornada.hora_saida ? jornada.hora_saida.slice(0, 5) : ''
        if (!start || !end) continue
        porChave.set(`${start}-${end}`, { id: `${start}-${end}`, label: `${start} - ${end}`, work_start: start, work_end: end })
    }
    return Array.from(porChave.values())
}

export type CarreiraInteresse = 'disponivel' | 'confidencial' | 'nao'
export type CarreiraInteresseLabel = 'Disponível para o mercado' | 'Confidencial' | 'Não'

export function carreiraInteresseToLabel(valor: string | null | undefined): CarreiraInteresseLabel {
    if (valor === 'disponivel') return 'Disponível para o mercado'
    if (valor === 'confidencial') return 'Confidencial'
    return 'Não'
}

export function carreiraInteresseFromLabel(label: string): CarreiraInteresse {
    if (label === 'Disponível para o mercado') return 'disponivel'
    if (label === 'Confidencial') return 'confidencial'
    return 'nao'
}

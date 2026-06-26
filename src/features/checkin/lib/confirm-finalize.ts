// Especificação Funcional — Tela Fechamento Diário, §20. Decide se o clique em
// "Finalizar Fechamento do Dia" deve abrir o modal "Deseja finalizar mesmo
// assim?" em vez de finalizar direto.
export function shouldConfirmBeforeFinalizar({
    totalAgendamentosD1,
    creditosValidos,
}: {
    totalAgendamentosD1: number
    creditosValidos: number
}): boolean {
    return totalAgendamentosD1 > creditosValidos
}

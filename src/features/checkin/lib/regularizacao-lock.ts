// Especificação Funcional — Tela Fechamento Diário, §22 / EV-1.9. Um item
// "Pendente de Fechamento" no Histórico só fica editável depois que o
// gerente liberar (mesma fonte de `fechamento_liberacoes` que o fluxo
// principal usa) — um dia já finalizado não precisa de liberação.
export function isRegularizacaoBloqueada({
    rowSelected,
    rowFinalized,
    liberacaoStatus,
}: {
    rowSelected: boolean
    rowFinalized: boolean
    liberacaoStatus: 'none' | 'pendente' | 'liberado'
}): boolean {
    return rowSelected && !rowFinalized && liberacaoStatus !== 'liberado'
}

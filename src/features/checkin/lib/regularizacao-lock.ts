// Bloqueio de liberação do gerente desativado por decisão de produto
// (09/07/2026, mesma decisão aplicada ao Fechamento Diário ao vivo em
// useCheckinPage.ts/CheckinForm.tsx): o vendedor pode regularizar um dia
// pendente a qualquer momento, sem depender de liberação prévia. Mantida
// a assinatura da função (parâmetros ainda usados/tipados nos chamadores)
// para não precisar tocar em todos os call sites.
export function isRegularizacaoBloqueada(_params: {
    rowSelected: boolean
    rowFinalized: boolean
    liberacaoStatus: 'none' | 'pendente' | 'liberado'
}): boolean {
    return false
}

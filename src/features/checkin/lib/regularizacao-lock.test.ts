import { describe, expect, test } from 'bun:test'
import { isRegularizacaoBloqueada } from './regularizacao-lock'

// Bloqueio de liberação desativado por decisão de produto (09/07/2026) —
// isRegularizacaoBloqueada sempre retorna false agora, em qualquer cenário.
describe('isRegularizacaoBloqueada', () => {
    test('nenhuma linha selecionada → não bloqueado', () => {
        expect(isRegularizacaoBloqueada({ rowSelected: false, rowFinalized: false, liberacaoStatus: 'none' })).toBe(false)
    })

    test('dia já finalizado (ajuste/correção) → nunca bloqueado por liberação', () => {
        expect(isRegularizacaoBloqueada({ rowSelected: true, rowFinalized: true, liberacaoStatus: 'none' })).toBe(false)
    })

    test('Pendente de Fechamento sem liberação → não bloqueado (bloqueio desativado)', () => {
        expect(isRegularizacaoBloqueada({ rowSelected: true, rowFinalized: false, liberacaoStatus: 'none' })).toBe(false)
    })

    test('Pendente de Fechamento com solicitação ainda pendente → não bloqueado (bloqueio desativado)', () => {
        expect(isRegularizacaoBloqueada({ rowSelected: true, rowFinalized: false, liberacaoStatus: 'pendente' })).toBe(false)
    })

    test('Pendente de Fechamento com liberação registrada → desbloqueado', () => {
        expect(isRegularizacaoBloqueada({ rowSelected: true, rowFinalized: false, liberacaoStatus: 'liberado' })).toBe(false)
    })
})

import { describe, expect, test } from 'bun:test'
import { isRegularizacaoBloqueada } from './regularizacao-lock'

// Especificação Funcional — Tela Fechamento Diário, §22
describe('isRegularizacaoBloqueada', () => {
    test('nenhuma linha selecionada → não bloqueado', () => {
        expect(isRegularizacaoBloqueada({ rowSelected: false, rowFinalized: false, liberacaoStatus: 'none' })).toBe(false)
    })

    test('dia já finalizado (ajuste/correção) → nunca bloqueado por liberação', () => {
        expect(isRegularizacaoBloqueada({ rowSelected: true, rowFinalized: true, liberacaoStatus: 'none' })).toBe(false)
    })

    test('Pendente de Fechamento sem liberação → bloqueado', () => {
        expect(isRegularizacaoBloqueada({ rowSelected: true, rowFinalized: false, liberacaoStatus: 'none' })).toBe(true)
    })

    test('Pendente de Fechamento com solicitação ainda pendente → continua bloqueado', () => {
        expect(isRegularizacaoBloqueada({ rowSelected: true, rowFinalized: false, liberacaoStatus: 'pendente' })).toBe(true)
    })

    test('Pendente de Fechamento com liberação registrada → desbloqueado', () => {
        expect(isRegularizacaoBloqueada({ rowSelected: true, rowFinalized: false, liberacaoStatus: 'liberado' })).toBe(false)
    })
})

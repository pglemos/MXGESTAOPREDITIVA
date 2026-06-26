import { describe, expect, test } from 'bun:test'
import { shouldConfirmBeforeFinalizar } from './confirm-finalize'

// Especificação Funcional — Tela Fechamento Diário, §20 (Teste de aceite 7)
describe('shouldConfirmBeforeFinalizar', () => {
    test('D+1 zerado não abre modal (vai direto)', () => {
        expect(shouldConfirmBeforeFinalizar({ totalAgendamentosD1: 0, creditosValidos: 0 })).toBe(false)
    })

    test('D+1 parcial (2 informados, 1 detalhado) abre modal', () => {
        expect(shouldConfirmBeforeFinalizar({ totalAgendamentosD1: 2, creditosValidos: 1 })).toBe(true)
    })

    test('D+1 totalmente detalhado não abre modal', () => {
        expect(shouldConfirmBeforeFinalizar({ totalAgendamentosD1: 2, creditosValidos: 2 })).toBe(false)
    })

    test('detalhados nunca excedem informados na prática, mas não dispara modal se igual ou maior', () => {
        expect(shouldConfirmBeforeFinalizar({ totalAgendamentosD1: 1, creditosValidos: 3 })).toBe(false)
    })
})

import { describe, expect, test, vi } from 'vitest'

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
        promise: vi.fn(),
    },
}))

import { toast as sonnerMock } from 'sonner'
import { TOAST_DURATION_MS, toast } from './toast'

describe('toast com durações canônicas (P1-09)', () => {
    test('sucesso desaparece em menos de 3s e cada tipo tem seu tempo', () => {
        expect(TOAST_DURATION_MS.success).toBeLessThanOrEqual(3000)
        expect(TOAST_DURATION_MS.info).toBe(4000)
        expect(TOAST_DURATION_MS.warning).toBe(6000)
        expect(TOAST_DURATION_MS.error).toBe(8000)

        toast.success('Salvo')
        expect(sonnerMock.success).toHaveBeenCalledWith('Salvo', { duration: TOAST_DURATION_MS.success })

        toast.error('Falhou')
        expect(sonnerMock.error).toHaveBeenCalledWith('Falhou', { duration: TOAST_DURATION_MS.error })
    })

    test('opções do chamador vencem o padrão (erro crítico pode persistir)', () => {
        toast.error('Crítico', { duration: Infinity, description: 'detalhe' })
        expect(sonnerMock.error).toHaveBeenCalledWith('Crítico', { duration: Infinity, description: 'detalhe' })
    })
})

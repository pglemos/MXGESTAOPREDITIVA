import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

const refresh = mock(async () => undefined)
const gerarSugestoes = mock(async () => undefined)

let consultorState = {
    solucoes: [],
    loading: false,
    generating: false,
    error: null,
    refresh,
    gerarSugestoes,
    counts: {
        critica: 0,
        alta: 0,
        media: 0,
        baixa: 0,
    },
}

mock.module('../hooks/useConsultorIa', () => ({
    useConsultorIa: () => consultorState,
}))

const { ConsultorIaChat } = await import('./ConsultorIaChat')

afterEach(() => {
    cleanup()
    refresh.mockClear()
    gerarSugestoes.mockClear()
    consultorState = {
        ...consultorState,
        loading: false,
        generating: false,
        error: null,
    }
})

describe('ConsultorIaChat', () => {
    it('atualiza sugestoes pelo botao de refresh', () => {
        render(<ConsultorIaChat storeId="store-1" />)

        fireEvent.click(screen.getByRole('button', { name: /atualizar sugestões/i }))

        expect(refresh).toHaveBeenCalled()
    })

    it('gera sugestoes pelo botao principal quando ha loja selecionada', () => {
        render(<ConsultorIaChat storeId="store-1" />)

        fireEvent.click(screen.getByRole('button', { name: /gerar sugestões/i }))

        expect(gerarSugestoes).toHaveBeenCalled()
    })

    it('bloqueia geracao quando nao ha loja selecionada', () => {
        render(<ConsultorIaChat storeId={null} />)

        expect(screen.getByRole('button', { name: /gerar sugestões/i })).toBeDisabled()
    })
})

import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { EscalarAtividadeModal } from './EscalarAtividadeModal'
import type { CentralExecutionAction } from '@/features/central-execucao/types/central-execucao.types'

const action = {
  id: 'action-1',
  title: 'Retorno de garantia',
  client: { id: 'client-1', nome: 'Maria Souza', telefone: null },
  snapshots: { name: null, phone: null, vehicle: null },
} as unknown as CentralExecutionAction

afterEach(() => cleanup())

describe('EscalarAtividadeModal', () => {
  it('mantém o botão de envio desabilitado sem motivo preenchido', () => {
    const onSubmit = mock(async () => ({ error: null }))
    render(<EscalarAtividadeModal action={action} open onClose={() => {}} onSubmit={onSubmit} />)

    const submitButton = screen.getByText('Pedir apoio') as HTMLButtonElement
    expect(submitButton.disabled).toBe(true)

    fireEvent.click(submitButton)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envia motivo com chave de idempotência única e fecha ao suceder', async () => {
    const onClose = mock(() => {})
    const onSubmit = mock(async () => ({ error: null }))
    render(<EscalarAtividadeModal action={action} open onClose={onClose} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Motivo do apoio'), { target: { value: 'Cliente pedindo desconto acima do alçado' } })
    fireEvent.click(screen.getByText('Pedir apoio'))

    await Promise.resolve()
    await Promise.resolve()

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const [call] = onSubmit.mock.calls
    expect(call[0].reason).toBe('Cliente pedindo desconto acima do alçado')
    expect(call[0].idempotencyKey).toStartWith('central:escalate:action-1:')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('mantém o modal aberto e mostra o erro do servidor quando a RPC falha', async () => {
    const onClose = mock(() => {})
    const onSubmit = mock(async () => ({ error: 'Sem permissao para escalar esta atividade.' }))
    render(<EscalarAtividadeModal action={action} open onClose={onClose} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Motivo do apoio'), { target: { value: 'Motivo qualquer' } })
    fireEvent.click(screen.getByText('Pedir apoio'))

    expect(await screen.findByText('Sem permissao para escalar esta atividade.')).toBeTruthy()
    expect(onClose).not.toHaveBeenCalled()
  })
})

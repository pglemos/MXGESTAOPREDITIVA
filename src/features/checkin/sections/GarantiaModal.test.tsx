import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const toastError = mock(() => {})
const toastSuccess = mock(() => {})

mock.module('sonner', () => ({
  toast: { error: toastError, success: toastSuccess },
}))

const buscarClienteExistentePorTelefone = mock(async () => null)
const createCliente = mock(async () => ({ error: null, id: 'cliente-novo-id' }))
const createAgendamento = mock(async () => ({ error: null }))

mock.module('@/features/crm/hooks/useClientes', () => ({
  useClientes: () => ({
    buscarClienteExistentePorTelefone,
    createCliente,
  }),
}))

mock.module('@/features/crm/hooks/useAgendamentos', () => ({
  useAgendamentos: () => ({
    createAgendamento,
  }),
}))

const { GarantiaModal } = await import('./GarantiaModal')

afterEach(() => {
  cleanup()
  buscarClienteExistentePorTelefone.mockClear()
  createCliente.mockClear()
  createAgendamento.mockClear()
  toastError.mockClear()
  toastSuccess.mockClear()
})

describe('GarantiaModal', () => {
  it('nao renderiza nada quando open=false', () => {
    const { container } = render(<GarantiaModal open={false} onClose={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('cadastra cliente novo (telefone nao encontrado) e registra a garantia como agendamento', async () => {
    const onSaved = mock(() => {})
    const onClose = mock(() => {})
    render(<GarantiaModal open onClose={onClose} onSaved={onSaved} defaultDate="2026-06-30T12:00" />)

    fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '(31) 99999-0000' } })
    fireEvent.change(screen.getByLabelText(/nome do cliente/i), { target: { value: 'Ana Souza' } })
    fireEvent.change(screen.getByLabelText(/veículo/i), { target: { value: 'HB20' } })
    fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: 'Barulho no motor' } })

    fireEvent.click(screen.getByRole('button', { name: /registrar garantia/i }))

    await waitFor(() => expect(createCliente).toHaveBeenCalledTimes(1))
    expect(createCliente).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Ana Souza' }))

    await waitFor(() => expect(createAgendamento).toHaveBeenCalledTimes(1))
    expect(createAgendamento).toHaveBeenCalledWith(expect.objectContaining({
      cliente_id: 'cliente-novo-id',
      tipo: 'garantia',
      data_hora: '2026-06-30T12:00',
    }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(toastSuccess).toHaveBeenCalled()
  })

  it('reusa cliente existente pelo telefone sem chamar createCliente (base unica)', async () => {
    buscarClienteExistentePorTelefone.mockImplementationOnce(async () => 'cliente-existente-id')
    render(<GarantiaModal open onClose={() => {}} defaultDate="2026-06-30T12:00" />)

    fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '(31) 99999-0000' } })
    fireEvent.click(screen.getByRole('button', { name: /registrar garantia/i }))

    await waitFor(() => expect(createAgendamento).toHaveBeenCalledTimes(1))
    expect(createCliente).not.toHaveBeenCalled()
    expect(createAgendamento).toHaveBeenCalledWith(expect.objectContaining({ cliente_id: 'cliente-existente-id' }))
  })

  it('bloqueia envio sem telefone', async () => {
    render(<GarantiaModal open onClose={() => {}} defaultDate="2026-06-30T12:00" />)
    fireEvent.click(screen.getByRole('button', { name: /registrar garantia/i }))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Informe o telefone do cliente.'))
    expect(createAgendamento).not.toHaveBeenCalled()
  })
})

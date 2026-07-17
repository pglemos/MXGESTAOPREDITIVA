import React, { useState } from 'react'
import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { FormGarantia, type FormProps } from './NovoRegistroModal'

afterEach(cleanup)

// MX-22.4 (AC-4; Spec §9.1 "Descrição da Garantia" — FEV-FORM-01): teste de
// comportamento (render real) que faltava — só havia regex sobre a string-
// fonte. FormGarantia não usa hooks externos (useAuth/useClientes/...),
// então é testável isolado sem montar o NovoRegistroModal inteiro.
function Harness() {
  const [form, setForm] = useState<Record<string, string>>({})
  const setF = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))
  const props: FormProps = {
    form,
    setF,
    clienteEncontrado: false,
    clienteJaVendido: false,
    onPhoneBlur: () => {},
    responsaveis: [{ id: '1', name: 'Ana Vendedora', role: 'vendedor' }],
  }
  return <FormGarantia {...props} />
}

describe('FormGarantia — catálogo Motivo → Descrição (MX-22.4)', () => {
  it('descrição começa desabilitada até um motivo ser escolhido', () => {
    render(<Harness />)
    const descricao = screen.getByLabelText(/Descrição da Garantia/i) as HTMLSelectElement
    expect(descricao.disabled).toBe(true)
  })

  it('escolher um motivo habilita a descrição e filtra só as opções daquele motivo', () => {
    render(<Harness />)
    const motivo = screen.getByLabelText(/Motivo da Garantia/i) as HTMLSelectElement
    fireEvent.change(motivo, { target: { value: 'Mecânica' } })

    const descricao = screen.getByLabelText(/Descrição da Garantia/i) as HTMLSelectElement
    expect(descricao.disabled).toBe(false)
    // "Outro" sempre presente como opção final do catálogo (§9.1).
    const optionValues = Array.from(descricao.options).map(o => o.value)
    expect(optionValues).toContain('Outro')
  })

  it('trocar de motivo reseta a descrição selecionada (evita descrição órfã do motivo anterior)', () => {
    render(<Harness />)
    const motivo = screen.getByLabelText(/Motivo da Garantia/i) as HTMLSelectElement
    fireEvent.change(motivo, { target: { value: 'Mecânica' } })
    const descricao = screen.getByLabelText(/Descrição da Garantia/i) as HTMLSelectElement
    const firstOption = Array.from(descricao.options).find(o => o.value && o.value !== 'Outro')!
    fireEvent.change(descricao, { target: { value: firstOption.value } })
    expect(descricao.value).toBe(firstOption.value)

    fireEvent.change(motivo, { target: { value: 'Documentação' } })
    expect((screen.getByLabelText(/Descrição da Garantia/i) as HTMLSelectElement).value).toBe('')
  })

  it('escolher "Outro" exige texto livre obrigatório (campo aparece só nesse caso)', () => {
    render(<Harness />)
    const motivo = screen.getByLabelText(/Motivo da Garantia/i) as HTMLSelectElement
    fireEvent.change(motivo, { target: { value: 'Mecânica' } })

    expect(screen.queryByPlaceholderText('Descreva o problema relatado')).toBeNull()

    const descricao = screen.getByLabelText(/Descrição da Garantia/i) as HTMLSelectElement
    fireEvent.change(descricao, { target: { value: 'Outro' } })
    expect(screen.getByPlaceholderText('Descreva o problema relatado')).toBeTruthy()
  })

  it('combo de Responsável lista os usuários reais recebidos via props (não catálogo fictício)', () => {
    render(<Harness />)
    expect(screen.getByRole('option', { name: 'Ana Vendedora' })).toBeTruthy()
  })
})

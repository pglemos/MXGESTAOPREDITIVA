import React from 'react'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const registrarStatusCadencia = mock(async () => ({ error: null }))
const onSair = mock(() => {})
const onAbrirFicha = mock(() => {})
const toastSuccess = mock(() => {})
const toastError = mock(() => {})

globalThis.getComputedStyle ||= (() => ({ animationName: 'none' })) as unknown as typeof getComputedStyle
globalThis.MutationObserver ||= class {
  observe() {}
  disconnect() {}
  takeRecords() { return [] }
} as unknown as typeof MutationObserver
globalThis.sessionStorage ||= {
  store: {} as Record<string, string>,
  getItem(key: string) { return this.store[key] ?? null },
  setItem(key: string, value: string) { this.store[key] = value },
  removeItem(key: string) { delete this.store[key] },
  clear() { this.store = {} },
  key(index: number) { return Object.keys(this.store)[index] ?? null },
  get length() { return Object.keys(this.store).length },
} as unknown as Storage

mock.module('sonner', () => ({
  toast: {
    error: toastError,
    success: toastSuccess,
  },
}))

const cliente = {
  id: 'cliente-ataque-1',
  loja_id: 'loja-1',
  seller_user_id: 'seller-1',
  nome: 'Ana Souza',
  telefone: '(31) 99999-0000',
  empresa: 'Compass Longitude',
  canal_origem: 'internet',
  status: 'oportunidade',
  relacionamento: 'neutro',
  ultima_interacao: '2026-06-16',
  proxima_acao: 'Confirmar visita',
  proxima_acao_em: '2026-06-16',
  potencial_negocio: 0,
  observacoes: null,
  created_at: '2026-06-16T12:00:00Z',
  updated_at: '2026-06-16T12:00:00Z',
} as const

const oportunidade = {
  id: 'opp-1',
  cliente_id: cliente.id,
  loja_id: cliente.loja_id,
  seller_user_id: cliente.seller_user_id,
  veiculo_interesse: 'Compass Longitude',
  tipo_veiculo: 'carro',
  valor_negociado: 120000,
  etapa: 'qualificacao',
  canal: 'internet',
  sinal: 0,
  financiamento: 'pendente',
  carro_avaliado: false,
  motivo_perda: null,
  closed_at: null,
  cliente: { nome: cliente.nome, telefone: cliente.telefone },
  created_at: '2026-06-16T12:00:00Z',
  updated_at: '2026-06-16T12:00:00Z',
} as const

const { ModoAtaqueView } = await import('./ModoAtaqueView')

beforeEach(() => {
  sessionStorage.clear()
})

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  registrarStatusCadencia.mockClear()
  onSair.mockClear()
  onAbrirFicha.mockClear()
  toastSuccess.mockClear()
  toastError.mockClear()
})

describe('ModoAtaqueView', () => {
  it('abre com o card de oportunidade 1:1 do Base44 antes de pedir resultado', () => {
    render(
      <ModoAtaqueView
        clientes={[cliente as any]}
        oportunidadePorCliente={new Map([[cliente.id, oportunidade as any]])}
        registrarStatusCadencia={registrarStatusCadencia}
        onSair={onSair}
        onAbrirFicha={onAbrirFicha}
      />,
    )

    expect(screen.getByText('MODO ATAQUE')).toBeTruthy()
    expect(screen.getByText('Objetivo')).toBeTruthy()
    expect(screen.getByText('Próximo passo')).toBeTruthy()
    expect(screen.getByText(/Compass Longitude/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Executar próximo passo/i })).toBeTruthy()
  })

  it('registra resultado apenas depois do CTA Executar próximo passo', async () => {
    render(
      <ModoAtaqueView
        clientes={[cliente as any]}
        oportunidadePorCliente={new Map([[cliente.id, oportunidade as any]])}
        registrarStatusCadencia={registrarStatusCadencia}
        onSair={onSair}
        onAbrirFicha={onAbrirFicha}
      />,
    )

    expect(screen.queryByRole('button', { name: /Executado/i })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Executar próximo passo/i }))
    fireEvent.click(screen.getByRole('button', { name: /Executado/i }))

    await waitFor(() => {
      expect(registrarStatusCadencia).toHaveBeenCalledWith({ clienteId: cliente.id, status: 'feito' })
    })
  })
})

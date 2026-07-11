import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
// P0-05b (auditoria 2026-07-10): ver RelatoriosVendedor.container.test.tsx —
// reusa a implementação real em vez de manter uma cópia hand-rolled que fica
// obsoleta e mascara bugs reais (ex.: P1-05/P0-05a).
import { buildOportunidadePayload } from '@/features/crm/hooks/useOportunidades'
// Idem — useAgendamentos.test.ts resolve o mesmo path e quebraria se o mock
// abaixo não expuser eventoDeCriacaoParaTipo (2.2.4, auditoria 2026-07-10).
import { eventoDeCriacaoParaTipo } from '@/features/crm/hooks/useAgendamentos'

const createCliente = mock(async () => ({ error: null, id: 'cliente-1' }))
const registrarStatusCadencia = mock(async () => ({ error: null }))
const toastSuccess = mock(() => {})
const toastError = mock(() => {})

globalThis.getComputedStyle ||= (() => ({ animationName: 'none' })) as typeof getComputedStyle
globalThis.MutationObserver ||= class {
  observe() {}
  disconnect() {}
  takeRecords() { return [] }
} as unknown as typeof MutationObserver

const cliente = {
  id: 'cliente-1',
  loja_id: 'loja-1',
  seller_user_id: 'seller-1',
  nome: 'Ana Souza',
  telefone: '(31) 99999-0000',
  empresa: null,
  canal_origem: 'internet',
  status: 'aguardando_contato',
  relacionamento: 'neutro',
  ultima_interacao: '2026-06-16',
  proxima_acao: 'Enviar mensagem 1 de primeiro contato',
  proxima_acao_em: '2026-06-16',
  potencial_negocio: 0,
  observacoes: null,
  created_at: '2026-06-16T12:00:00Z',
  updated_at: '2026-06-16T12:00:00Z',
}

mock.module('sonner', () => ({
  toast: {
    error: toastError,
    success: toastSuccess,
  },
}))

mock.module('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'seller-1', name: 'Ana Vendedora' },
  }),
}))

mock.module('@/features/crm/hooks/useClientes', () => ({
  buildClientePayload: (
    input: {
      nome: string
      telefone?: string | null
      canal_origem?: string | null
      proxima_acao?: string | null
      proxima_acao_em?: string | null
    },
    context: { lojaId: string; sellerUserId: string },
    now: Date = new Date(),
  ) => {
    const proximaAcaoManual = input.proxima_acao?.trim() || null
    const dateOnly = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now)
    return {
      loja_id: context.lojaId,
      seller_user_id: context.sellerUserId,
      nome: input.nome.trim(),
      telefone: input.telefone?.trim() || null,
      canal_origem: input.canal_origem || null,
      status: 'aguardando_contato',
      relacionamento: 'neutro',
      proxima_acao: proximaAcaoManual || 'Enviar mensagem 1 de primeiro contato',
      proxima_acao_em: input.proxima_acao_em || (!proximaAcaoManual ? dateOnly : null),
      ultima_interacao: dateOnly,
    }
  },
  useClientes: () => ({
    clientes: [cliente],
    metrics: {
      total: 1,
      ativos: 0,
      oportunidades: 0,
      posVenda: 0,
      aguardando: 1,
      inativos: 0,
      potencialTotal: 0,
    },
    loading: false,
    error: null,
    createCliente,
    registrarStatusCadencia,
  }),
}))

mock.module('@/features/crm/hooks/useOportunidades', () => ({
  buildOportunidadePayload,
  useOportunidades: () => ({
    oportunidades: [],
  }),
}))

mock.module('@/features/crm/hooks/useAgendamentos', () => ({
  eventoDeCriacaoParaTipo,
  useAgendamentos: () => ({
    agendamentos: [],
  }),
}))

mock.module('@/components/organisms/Modal', () => ({
  Modal: ({ open, title, description, children, footer }: {
    open: boolean
    title: string
    description?: string
    children: React.ReactNode
    footer?: React.ReactNode
  }) => open ? (
    <section role="dialog" aria-label={title}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {children}
      {footer}
    </section>
  ) : null,
}))

const { CarteiraClientes } = await import('./CarteiraClientes.container')

afterEach(() => {
  cleanup()
  createCliente.mockClear()
  registrarStatusCadencia.mockClear()
  toastSuccess.mockClear()
  toastError.mockClear()
})

describe('CarteiraClientes', () => {
  it('abre ficha com os blocos operacionais do Base44', () => {
    render(<CarteiraClientes />)

    fireEvent.click(screen.getByRole('button', { name: /Ver cliente/i }))

    expect(screen.getAllByText('Mentor Comercial').length).toBeGreaterThan(0)
    expect(screen.getByText('O que falta para evoluir')).toBeTruthy()
    expect(screen.getByText('O que sabemos')).toBeTruthy()
  })

  it('registra status Feito da acao de cadencia sem exigir observacao', async () => {
    render(<CarteiraClientes />)

    expect(screen.getAllByText('Ana Souza').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /Ver cliente/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Feito' }))

    await waitFor(() => {
      expect(registrarStatusCadencia).toHaveBeenCalledWith({ clienteId: 'cliente-1', status: 'feito', canalContato: null })
    })
    expect(toastSuccess).toHaveBeenCalledWith('Cadência atualizada.', { duration: 3000 })
  })

  it('modal Alterar próximo passo abre sobre a ficha sem travar nenhum dos dois (planilha #5)', async () => {
    render(<CarteiraClientes />)

    fireEvent.click(screen.getByRole('button', { name: /Ver cliente/i }))
    fireEvent.click(screen.getAllByRole('button', { name: /Alterar próximo passo/i })[0])

    // modal de cima abre e é operável
    const modal = screen.getByRole('dialog', { name: 'Alterar próximo passo' })
    expect(modal).toBeTruthy()
    fireEvent.click(within(modal).getByRole('button', { name: 'Fechar' }))

    // ficha de baixo continua viva e operável após fechar o modal de cima
    expect(screen.queryByRole('dialog', { name: 'Alterar próximo passo' })).toBeNull()
    const executar = screen.getAllByRole('button', { name: /Executar próximo passo/i }).at(-1)!
    fireEvent.click(executar)
    expect(screen.getByText('Por qual canal você vai executar?')).toBeTruthy()
  })

  it('executar proximo passo pede canal e registra o canal escolhido (planilha #9)', async () => {
    render(<CarteiraClientes />)

    fireEvent.click(screen.getByRole('button', { name: /Ver cliente/i }))
    fireEvent.click(screen.getAllByRole('button', { name: /Executar próximo passo/i }).at(-1)!)

    expect(screen.getByText('Por qual canal você vai executar?')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Presencial/i }))

    await waitFor(() => {
      expect(registrarStatusCadencia).toHaveBeenCalledWith({ clienteId: 'cliente-1', status: 'feito', canalContato: 'presencial' })
    })
  })

  it('registra tentativa nao respondeu como status nao_feito', async () => {
    render(<CarteiraClientes />)

    fireEvent.click(screen.getByRole('button', { name: /Ver cliente/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Não respondeu' }))
    expect(screen.getByRole('heading', { name: 'Cliente não respondeu' })).toBeTruthy()
    expect(screen.getByText('Amanhã às 10:00 - Tentativa 2/3')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reagendamento' }))

    await waitFor(() => {
      expect(registrarStatusCadencia).toHaveBeenCalledWith({ clienteId: 'cliente-1', status: 'nao_feito', canalContato: null })
    })
    expect(toastSuccess).toHaveBeenCalledWith('Tentativa registrada e próxima ação mantida no fluxo.', { duration: 3000 })
  })

  it('formata telefone e moeda, mantendo opções de status sem duplicidade', () => {
    render(<CarteiraClientes />)

    fireEvent.click(screen.getByRole('button', { name: /Novo cliente/i }))
    const telefone = screen.getByLabelText('Telefone') as HTMLInputElement
    const valor = screen.getByLabelText('Valor previsto (R$)') as HTMLInputElement
    const status = screen.getByLabelText('Status do cliente') as HTMLSelectElement

    fireEvent.change(telefone, { target: { value: '31999990000' } })
    fireEvent.change(valor, { target: { value: '1234567' } })

    expect(telefone.value).toBe('(31) 99999-0000')
    expect(valor.value).toBe('R$ 12.345,67')
    expect(Array.from(status.options).filter(option => option.text === 'Em andamento')).toHaveLength(1)
  })

  it('abre a ficha para o vendedor escolher a ação sem abrir WhatsApp automaticamente', () => {
    const openSpy = mock(() => null)
    const previousOpen = window.open
    window.open = openSpy as typeof window.open

    render(<CarteiraClientes />)
    fireEvent.click(screen.getByRole('button', { name: /Executar próximo passo/i }))

    expect(openSpy).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Ana Souza' })).toBeTruthy()
    window.open = previousOpen
  })
})

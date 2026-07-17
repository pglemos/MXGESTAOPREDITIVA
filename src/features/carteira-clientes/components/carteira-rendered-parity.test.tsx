import React from 'react'
import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'

const cliente = {
  id: 'cliente-parity',
  vendedor_id: 'seller-parity',
  loja_id: 'loja-parity',
  nome: 'Cliente Paridade',
  whatsapp: '31999999999',
  telefone: '31999999999',
  momento: 'Novo contato',
  situacao_atual: 'Lead sem resposta',
  proximo_passo: 'Enviar primeira abordagem',
  temperatura: 'Morno',
  canal_comercial: 'Internet',
  canal_origem: 'Internet',
  veiculo_interesse: 'Onix',
}

mock.module('@/api/base44Client', () => ({
  base44: {
    integrations: {
      Core: { InvokeLLM: mock(async () => 'Script de paridade') },
    },
    entities: {
      CarteiraCliente: {
        get: mock(async () => cliente),
        create: mock(async (payload: object) => ({ ...cliente, ...payload })),
        update: mock(async (_id: string, payload: object) => ({ ...cliente, ...payload })),
      },
      CarteiraHistorico: {
        filter: mock(async () => []),
        create: mock(async () => ({})),
      },
      CarteiraMissao: { update: mock(async () => ({})) },
    },
  },
}))

mock.module('@/components/ui/use-toast', () => ({ toast: mock(() => {}) }))

function normalizeDom(html: string) {
  return html
    .replace(/radix-[^"\s]+/g, 'radix-id')
    .replace(/[«»]r\d+[«»]/g, 'react-id')
    .replace(/data-reactroot=""/g, '')
}

async function capture(component: React.ReactElement, readyText?: string) {
  render(component)
  if (readyText) await screen.findAllByText(readyText)
  await Promise.resolve()
  await Promise.resolve()
  const html = normalizeDom(document.body.innerHTML)
  cleanup()
  return html
}

afterEach(() => cleanup())

describe('Base44 rendered presentation parity', () => {
  test('integrated components render the same initial DOM as the immutable reference', async () => {
    const [runtime, reference] = await Promise.all([
      Promise.all([
        import('@/components/carteira/NovoClienteModal.jsx'),
        import('@/components/carteira/WhatsAppRoteiro.jsx'),
        import('@/components/carteira/FichaClienteSheet.jsx'),
        import('@/components/carteira/AlterarProximoPasso.jsx'),
        import('@/components/carteira/ExecucaoMissao.jsx'),
      ]),
      Promise.all([
        import('@/base44-reference/components/carteira/NovoClienteModal.jsx'),
        import('@/base44-reference/components/carteira/WhatsAppRoteiro.jsx'),
        import('@/base44-reference/components/carteira/FichaClienteSheet.jsx'),
        import('@/base44-reference/components/carteira/AlterarProximoPasso.jsx'),
        import('@/base44-reference/components/carteira/ExecucaoMissao.jsx'),
      ]),
    ])

    const mission = { id: 'missao-parity', nome: 'Retomar leads', indice_atual: 0 }
    const cases = [
      {
        runtime: React.createElement(runtime[0].default, { open: true, onClose: () => {}, onCriado: () => {}, vendedorId: 'seller-parity' }),
        reference: React.createElement(reference[0].default, { open: true, onClose: () => {}, onCriado: () => {}, vendedorId: 'seller-parity' }),
        readyText: 'Novo Cliente',
      },
      {
        runtime: React.createElement(runtime[1].default, { open: true, onClose: () => {}, cliente, onResultadoRegistrado: () => {} }),
        reference: React.createElement(reference[1].default, { open: true, onClose: () => {}, cliente, onResultadoRegistrado: () => {} }),
        readyText: 'Executar próximo passo',
      },
      {
        runtime: React.createElement(runtime[2].default, { clienteId: cliente.id, open: true, onClose: () => {}, onAtualizado: () => {}, onExecutar: () => {} }),
        reference: React.createElement(reference[2].default, { clienteId: cliente.id, open: true, onClose: () => {}, onAtualizado: () => {}, onExecutar: () => {} }),
        readyText: 'Mentor Comercial',
      },
      {
        runtime: React.createElement(runtime[3].default, { open: true, onClose: () => {}, cliente, pendencias: [], onSalvo: () => {} }),
        reference: React.createElement(reference[3].default, { open: true, onClose: () => {}, cliente, pendencias: [], onSalvo: () => {} }),
        readyText: 'Alterar próximo passo',
      },
      {
        runtime: React.createElement(runtime[4].default, { missao: mission, clientes: [cliente], onVoltar: () => {}, onConcluida: () => {} }),
        reference: React.createElement(reference[4].default, { missao: mission, clientes: [cliente], onVoltar: () => {}, onConcluida: () => {} }),
        readyText: 'Retomar leads',
      },
    ]

    for (const item of cases) {
      const runtimeDom = await capture(item.runtime, item.readyText)
      const referenceDom = await capture(item.reference, item.readyText)
      expect(runtimeDom).toBe(referenceDom)
    }
  })
})

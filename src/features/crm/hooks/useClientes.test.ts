import { describe, expect, it } from 'bun:test'
import { buildClientePayload } from './useClientes'

const context = {
  lojaId: '11111111-1111-4111-8111-111111111111',
  sellerUserId: '22222222-2222-4222-8222-222222222222',
}

describe('buildClientePayload', () => {
  it('preenche primeira proxima acao pela cadencia quando vendedor nao informa acao manual', () => {
    const payload = buildClientePayload({
      nome: ' Ana Souza ',
      telefone: ' (31) 99999-0000 ',
      canal_origem: 'internet',
    }, context, new Date('2026-06-16T12:00:00-03:00'))

    expect(payload).toMatchObject({
      loja_id: context.lojaId,
      seller_user_id: context.sellerUserId,
      nome: 'Ana Souza',
      telefone: '(31) 99999-0000',
      canal_origem: 'internet',
      status: 'aguardando_contato',
      relacionamento: 'neutro',
      proxima_acao: 'Enviar mensagem 1 de primeiro contato',
      proxima_acao_em: '2026-06-16',
      ultima_interacao: '2026-06-16',
    })
  })

  it('preserva proxima acao manual do vendedor', () => {
    const payload = buildClientePayload({
      nome: 'Bruno Lima',
      canal_origem: 'porta',
      proxima_acao: 'Enviar proposta personalizada',
      proxima_acao_em: '2026-06-18',
    }, context, new Date('2026-06-16T12:00:00-03:00'))

    expect(payload.proxima_acao).toBe('Enviar proposta personalizada')
    expect(payload.proxima_acao_em).toBe('2026-06-18')
  })
})

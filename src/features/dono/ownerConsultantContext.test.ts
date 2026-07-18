import { describe, expect, test } from 'bun:test'
import {
  buildOwnerConsultantInitialMessage,
  buildOwnerConsultantInitialSubject,
  parseOwnerConsultantContext,
} from './ownerConsultantContext'

describe('contexto do Falar com Consultor', () => {
  test('preserva a origem e os dados executivos recebidos pela URL', () => {
    const context = parseOwnerConsultantContext('?origem=central-decisoes&titulo=Estoque%20acima%20de%2090%20dias&indicador=SP-033&status=Cr%C3%ADtico')

    expect(context.origin).toBe('central-decisoes')
    expect(context.title).toBe('Estoque acima de 90 dias')
    expect(context.snapshot).toEqual({
      origem: 'central-decisoes',
      titulo: 'Estoque acima de 90 dias',
      indicador: 'SP-033',
      status: 'Crítico',
    })
  })

  test('gera assunto e mensagem editáveis sem inventar resposta do consultor', () => {
    const context = parseOwnerConsultantContext('?origem=plano-estrategico&titulo=Vendas%20Total&status=Aten%C3%A7%C3%A3o')

    expect(buildOwnerConsultantInitialSubject(context)).toBe('Analisar: Vendas Total')
    expect(buildOwnerConsultantInitialMessage(context)).toContain('Quero analisar Vendas Total')
    expect(buildOwnerConsultantInitialMessage(context)).toContain('status Atenção')
  })

  test('mantém uma solicitação geral quando não existe contexto', () => {
    const context = parseOwnerConsultantContext('')

    expect(buildOwnerConsultantInitialSubject(context)).toBe('Solicitação ao Consultor MX')
    expect(buildOwnerConsultantInitialMessage(context)).toBe('')
    expect(context.snapshot).toEqual({})
  })
})

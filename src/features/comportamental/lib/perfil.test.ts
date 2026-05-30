import { describe, test, expect } from 'bun:test'
import { calcularPerfil, dimensoesDe, perfilEntries, type Questao, type RespostaInput } from './perfil'

function questao(id: string, dimensao: string): Questao {
  return { id, texto: `q-${id}`, dimensao, ordem: 0, ativo: true, created_at: '2026-01-01' } as Questao
}

describe('calcularPerfil', () => {
  test('média por dimensão', () => {
    const respostas: RespostaInput[] = [
      { questaoId: '1', dimensao: 'disciplina', valor: 4 },
      { questaoId: '2', dimensao: 'disciplina', valor: 2 },
      { questaoId: '3', dimensao: 'colaboracao', valor: 5 },
    ]
    expect(calcularPerfil(respostas)).toEqual({ disciplina: 3, colaboracao: 5 })
  })

  test('arredonda para 2 casas', () => {
    const respostas: RespostaInput[] = [
      { questaoId: '1', dimensao: 'foco', valor: 1 },
      { questaoId: '2', dimensao: 'foco', valor: 2 },
      { questaoId: '3', dimensao: 'foco', valor: 2 },
    ]
    expect(calcularPerfil(respostas).foco).toBeCloseTo(1.67, 2)
  })

  test('respostas vazias retorna objeto vazio', () => {
    expect(calcularPerfil([])).toEqual({})
  })
})

describe('dimensoesDe', () => {
  test('dimensões únicas e ordenadas', () => {
    expect(dimensoesDe([questao('1', 'foco'), questao('2', 'disciplina'), questao('3', 'foco')]))
      .toEqual(['disciplina', 'foco'])
  })
})

describe('perfilEntries', () => {
  test('converte jsonb em pares [dim, número]', () => {
    expect(perfilEntries({ disciplina: 4, foco: 3 })).toEqual([['disciplina', 4], ['foco', 3]])
  })
  test('lida com null/não-objeto', () => {
    expect(perfilEntries(null)).toEqual([])
    expect(perfilEntries('x' as never)).toEqual([])
  })
})

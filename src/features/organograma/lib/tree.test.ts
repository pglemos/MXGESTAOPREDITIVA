import { describe, test, expect } from 'bun:test'
import { buildTree, type OrganogramaNo } from './tree'

function no(id: string, cargo: string, parent_id: string | null, ordem = 0): OrganogramaNo {
  return {
    id, loja_id: 'loja-1', usuario_id: null, cargo, parent_id, ordem,
    created_at: '2026-01-01', updated_at: '2026-01-01',
  } as OrganogramaNo
}

describe('buildTree', () => {
  test('monta hierarquia a partir de parent_id', () => {
    const tree = buildTree([
      no('1', 'Dono', null),
      no('2', 'Gerente', '1'),
      no('3', 'Vendedor', '2'),
    ])
    expect(tree).toHaveLength(1)
    expect(tree[0].cargo).toBe('Dono')
    expect(tree[0].children[0].cargo).toBe('Gerente')
    expect(tree[0].children[0].children[0].cargo).toBe('Vendedor')
  })

  test('múltiplos roots quando parent_id é nulo', () => {
    const tree = buildTree([no('1', 'A', null), no('2', 'B', null)])
    expect(tree).toHaveLength(2)
  })

  test('parent_id inexistente vira root (não perde o nó)', () => {
    const tree = buildTree([no('2', 'Orfao', 'inexistente')])
    expect(tree).toHaveLength(1)
    expect(tree[0].cargo).toBe('Orfao')
  })

  test('ordena filhos por ordem e depois cargo', () => {
    const tree = buildTree([
      no('1', 'Dono', null),
      no('3', 'Zelador', '1', 1),
      no('2', 'Analista', '1', 0),
    ])
    expect(tree[0].children.map(c => c.cargo)).toEqual(['Analista', 'Zelador'])
  })

  test('lista vazia retorna []', () => {
    expect(buildTree([])).toEqual([])
  })
})

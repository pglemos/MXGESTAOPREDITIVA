import { describe, expect, test } from 'bun:test'
import { mapResponsaveisTratativaOptions } from './responsaveis-tratativa'

// MX-22.4 (AC-1/AC-2; Spec §9.1): antes da RPC SECURITY DEFINER, a RLS
// bloqueava um vendedor comum de ver colegas — a query direta retornava
// só a própria linha. Este é o teste de comportamento (não string) que
// prova que a lista completa de colegas elegíveis sobrevive ao mapeamento,
// não colapsa pra self-only.
describe('mapResponsaveisTratativaOptions (MX-22.4)', () => {
  test('preserva múltiplos colegas elegíveis (vendedor comum não vê só a própria linha)', () => {
    const rows = [
      { id: 'self', name: 'Vendedor Próprio', role: 'vendedor' },
      { id: 'colega-1', name: 'Ana Colega', role: 'vendedor' },
      { id: 'colega-2', name: 'Bruno Gerente', role: 'gerente' },
      { id: 'colega-3', name: 'Carla Dona', role: 'dono' },
    ]
    const options = mapResponsaveisTratativaOptions(rows)
    expect(options).toHaveLength(4)
    expect(options.map(o => o.id)).toContain('colega-1')
    expect(options.map(o => o.id)).toContain('colega-2')
    expect(options.map(o => o.id)).toContain('colega-3')
  })

  test('ordena por nome em pt-BR', () => {
    const rows = [
      { id: '1', name: 'Zeca', role: 'vendedor' },
      { id: '2', name: 'Álvaro', role: 'vendedor' },
      { id: '3', name: 'Bruno', role: 'vendedor' },
    ]
    const options = mapResponsaveisTratativaOptions(rows)
    expect(options.map(o => o.name)).toEqual(['Álvaro', 'Bruno', 'Zeca'])
  })

  test('filtra linhas sem id ou sem name (defensivo contra retorno inesperado)', () => {
    const rows = [
      { id: '', name: 'Sem id', role: 'vendedor' },
      { id: '1', name: '', role: 'vendedor' },
      { id: '2', name: 'Válido', role: 'vendedor' },
    ]
    const options = mapResponsaveisTratativaOptions(rows)
    expect(options).toEqual([{ id: '2', name: 'Válido', role: 'vendedor' }])
  })

  test('lista vazia/nula não quebra (loja recém-criada, RPC ainda sem retorno)', () => {
    expect(mapResponsaveisTratativaOptions(null)).toEqual([])
    expect(mapResponsaveisTratativaOptions(undefined)).toEqual([])
    expect(mapResponsaveisTratativaOptions([])).toEqual([])
  })

  test('usa fallback "vendedor" quando role vem vazio', () => {
    const options = mapResponsaveisTratativaOptions([{ id: '1', name: 'Sem Role', role: '' }])
    expect(options[0].role).toBe('vendedor')
  })
})

import { describe, expect, it } from 'bun:test'
import { parseCadenciaAgenda } from './useCadenciaAgenda'

const validRow = {
  cadencia_estado_id: '11111111-1111-4111-8111-111111111111',
  cliente_id: '22222222-2222-4222-8222-222222222222',
  cliente_nome: 'Maria Silva',
  cliente_telefone: '11999990000',
  loja_id: '33333333-3333-4333-8333-333333333333',
  seller_user_id: '44444444-4444-4444-8444-444444444444',
  canal: 'internet' as const,
  passo_atual_key: 'passo_1',
  etapa_atual: 'Contato Inicial',
  proxima_acao: 'Ligar para cliente',
  proxima_acao_em: '2026-06-20',
  status: 'ativo',
  last_result: 'feito' as const,
}

describe('parseCadenciaAgenda', () => {
  it('returns empty array for non-array input', () => {
    expect(parseCadenciaAgenda(null)).toEqual([])
    expect(parseCadenciaAgenda(undefined)).toEqual([])
    expect(parseCadenciaAgenda('string')).toEqual([])
    expect(parseCadenciaAgenda(42)).toEqual([])
    expect(parseCadenciaAgenda({ key: 'value' })).toEqual([])
  })

  it('filters out invalid rows missing required fields', () => {
    const incomplete = { cadencia_estado_id: '11111111-1111-4111-8111-111111111111' }
    expect(parseCadenciaAgenda([incomplete])).toEqual([])
    expect(parseCadenciaAgenda([{}])).toEqual([])
    expect(parseCadenciaAgenda([null, undefined, 42])).toEqual([])
  })

  it('parses valid rows correctly', () => {
    const result = parseCadenciaAgenda([validRow])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(validRow)
  })

  it('parses row with nullable fields set to null', () => {
    const rowNulls = { ...validRow, cliente_telefone: null, canal: null, last_result: null }
    const result = parseCadenciaAgenda([rowNulls])
    expect(result).toHaveLength(1)
    expect(result[0].cliente_telefone).toBeNull()
    expect(result[0].canal).toBeNull()
    expect(result[0].last_result).toBeNull()
  })

  it('parses row with canal porta and last_result aguardando', () => {
    const row = { ...validRow, canal: 'porta', last_result: 'aguardando' }
    const result = parseCadenciaAgenda([row])
    expect(result).toHaveLength(1)
    expect(result[0].canal).toBe('porta')
    expect(result[0].last_result).toBe('aguardando')
  })

  it('keeps valid rows and skips invalid ones in mixed array', () => {
    const invalid = { cadencia_estado_id: 'not-a-uuid', cliente_nome: 123 }
    const result = parseCadenciaAgenda([validRow, invalid, null, validRow])
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(validRow)
    expect(result[1]).toEqual(validRow)
  })
})

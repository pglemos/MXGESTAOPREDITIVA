import { describe, expect, it } from 'bun:test'
import {
  podeExibirCarreiraMercado,
  podeReceberFeedbackGerente,
  resolverVinculoTipoVendedor,
} from './vinculo-vendedor'

describe('vinculo do vendedor', () => {
  it('usa vinculo persistido como fonte canonica quando existe', () => {
    expect(resolverVinculoTipoVendedor({ perfilVinculoTipo: 'autonomo', lojaId: 'loja-1', vinculosLojaCount: 1 })).toBe('autonomo')
    expect(resolverVinculoTipoVendedor({ perfilVinculoTipo: 'loja' })).toBe('loja')
  })

  it('deriva vendedor de loja quando existe loja ativa ou vinculo de loja', () => {
    expect(resolverVinculoTipoVendedor({ lojaId: 'loja-1' })).toBe('loja')
    expect(resolverVinculoTipoVendedor({ activeStoreId: 'loja-1' })).toBe('loja')
    expect(resolverVinculoTipoVendedor({ vinculosLojaCount: 2 })).toBe('loja')
  })

  it('deriva autonomo quando nao ha vinculo persistido nem loja', () => {
    expect(resolverVinculoTipoVendedor({ perfilVinculoTipo: null, lojaId: null, activeStoreId: null, vinculosLojaCount: 0 })).toBe('autonomo')
  })

  it('centraliza visibilidades que dependem do vinculo', () => {
    expect(podeExibirCarreiraMercado('loja')).toBe(false)
    expect(podeExibirCarreiraMercado('autonomo')).toBe(true)
    expect(podeReceberFeedbackGerente('loja')).toBe(true)
    expect(podeReceberFeedbackGerente('autonomo')).toBe(false)
  })
})

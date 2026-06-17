import { describe, expect, it } from 'bun:test'
import { derivarNivelMaturidadeVendedor, trackTypeParaMaturidade } from '@/features/crm/lib/maturidade'

describe('derivarNivelMaturidadeVendedor', () => {
  it('classifica vendedor sem experiencia como N1', () => {
    expect(derivarNivelMaturidadeVendedor({
      tempo_mercado_anos: 0,
      experiencia_declarada: 'sem_experiencia',
      cargo_atual: 'Vendedor',
    })).toBe('N1')
  })

  it('classifica cinco anos de mercado como N4', () => {
    const perfil = {
      tempo_mercado_anos: 5,
      experiencia_declarada: 'intermediario',
      cargo_atual: 'Vendedor',
    } as const

    expect(derivarNivelMaturidadeVendedor(perfil)).toBe('N4')
    expect(trackTypeParaMaturidade(perfil)).toBe('maturidade_n4')
  })

  it('usa cargo de lideranca como calibragem minima N3', () => {
    expect(derivarNivelMaturidadeVendedor({
      tempo_mercado_anos: 1,
      experiencia_declarada: 'iniciante',
      cargo_atual: 'Supervisor comercial',
    })).toBe('N3')
  })
})

import { describe, expect, test } from 'bun:test'
import {
  OWNER_BASE44_NAVIGATION,
  OWNER_BASE44_SECTION_VALUES,
  OWNER_LEGACY_SECTION_VALUES,
  ownerNavigationCanonicalPath,
  ownerNavigationSectionValue,
  resolveOwnerSection,
} from './ownerBase44Config'

describe('contrato do módulo Dono inspirado no Base44', () => {
  test('mantém a arquitetura de informação aprovada em cinco grupos', () => {
    expect(OWNER_BASE44_NAVIGATION.map(section => section.label)).toEqual([
      'GESTÃO',
      'ESTRATÉGIA',
      'NEGÓCIO',
      'DESENVOLVIMENTO',
      'AÇÃO GLOBAL',
    ])

    expect(OWNER_BASE44_NAVIGATION.flatMap(section => section.items.map(item => item.label))).toEqual([
      'Início',
      'Rotina do Dia',
      'Central de Decisões',
      'Plano Estratégico',
      'Plano de Ação',
      'Consultoria',
      'Departamentos',
      'Visão Geral',
      'Comercial',
      'Marketing',
      'Produto e Estoque',
      'Pessoas — RH',
      'Financeiro',
      'Operações',
      'Mercado',
      'Universidade MX',
      'Falar com Consultor',
    ])
  })

  test('gera um destino único para cada item de negócio', () => {
    const business = OWNER_BASE44_NAVIGATION.find(section => section.label === 'NEGÓCIO')
    const values = business?.items.map(ownerNavigationSectionValue) ?? []
    expect(new Set(values).size).toBe(values.length)
    expect(values).toContain('departamentos-visao-geral')
  })

  test('liga o sidebar universal às rotas canônicas do módulo Dono', () => {
    const paths = OWNER_BASE44_NAVIGATION.flatMap(section =>
      section.items.map(item => [item.label, ownerNavigationCanonicalPath(item)] as const),
    )

    expect(Object.fromEntries(paths)).toEqual({
      'Início': '/dono',
      'Rotina do Dia': '/dono/rotina',
      'Central de Decisões': '/dono/decisoes',
      'Plano Estratégico': '/dono/plano-estrategico',
      'Plano de Ação': '/dono/plano-acao',
      Consultoria: '/dono/consultoria',
      Departamentos: '/dono/departamentos',
      'Visão Geral': '/dono/departamentos',
      Comercial: '/dono/departamentos/comercial',
      Marketing: '/dono/departamentos/marketing',
      'Produto e Estoque': '/dono/departamentos/produto-e-estoque',
      'Pessoas — RH': '/dono/departamentos/pessoas-rh',
      Financeiro: '/dono/departamentos/financeiro',
      Operações: '/dono/departamentos/operacoes',
      Mercado: '/dono/mercado',
      'Universidade MX': '/dono/universidade',
      'Falar com Consultor': '/dono/consultoria?openConsultant=1',
    })
  })

  test('resolve todas as seções sem criar nova árvore de rotas', () => {
    for (const section of OWNER_BASE44_SECTION_VALUES) {
      expect(resolveOwnerSection(`?ownerSection=${section}`)).toBe(section)
    }
    expect(resolveOwnerSection('')).toBe('home')
    expect(resolveOwnerSection('?ownerSection=inexistente')).toBe('home')
  })

  test('preserva links legados em vez de redirecioná-los silenciosamente', () => {
    for (const section of OWNER_LEGACY_SECTION_VALUES) {
      expect(resolveOwnerSection(`?ownerSection=${section}`)).toBe(section)
    }
  })

  test('mantém apenas departamentos canônicos no contexto executivo', () => {
    expect(resolveOwnerSection('?ownerSection=departamentos-visao-geral')).toBe('departamentos')
    expect(resolveOwnerSection('?ownerSection=departamentos-comercial')).toBe('departamentos')
    expect(resolveOwnerSection('?ownerSection=departamentos-marketing')).toBe('departamentos')
    expect(resolveOwnerSection('?ownerSection=departamentos-produto')).toBe('departamentos')
    expect(resolveOwnerSection('?ownerSection=departamentos-rh')).toBe('departamentos')
    expect(resolveOwnerSection('?ownerSection=departamentos-financeiro')).toBe('departamentos')
    expect(resolveOwnerSection('?ownerSection=departamentos-operacional')).toBe('departamentos')
    expect(resolveOwnerSection('?ownerSection=departamentos-inexistente')).toBe('home')
  })
})

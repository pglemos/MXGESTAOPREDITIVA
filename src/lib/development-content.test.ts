import { describe, expect, test } from 'bun:test'
import {
  buildDevelopmentContentMetadata,
  buildNewCollaboratorTrack,
  filterDevelopmentContent,
  inferDevelopmentTheme,
  isContentVisibleForStore,
  recommendDevelopmentThemeFromGap,
} from './development-content'

describe('development content helpers', () => {
  test('infers themes from title, type and description', () => {
    expect(inferDevelopmentTheme({ title: 'Como avaliar usado na troca', type: 'vendas' })).toBe('carro_de_troca')
    expect(inferDevelopmentTheme({ title: 'Ficha e financiamento', description: 'Crédito do cliente' })).toBe('financiamento')
    expect(inferDevelopmentTheme({ title: 'Follow-up de CRM', type: 'crm' })).toBe('crm')
  })

  test('filters library content by search and theme', () => {
    const items = [
      { id: '1', title: 'Agendamento de visita', type: 'atendimento' },
      { id: '2', title: 'Fechamento com proposta', type: 'fechamento' },
      { id: '3', title: 'Financiamento básico', type: 'financiamento' },
    ]

    expect(filterDevelopmentContent(items, { search: 'proposta', theme: 'todos' }).map(item => item.id)).toEqual(['2'])
    expect(filterDevelopmentContent(items, { theme: 'financiamento' }).map(item => item.id)).toEqual(['3'])
  })

  test('maps performance gaps to deterministic themes', () => {
    expect(recommendDevelopmentThemeFromGap('LEAD_AGD')).toBe('prospeccao')
    expect(recommendDevelopmentThemeFromGap('VISITA_VND')).toBe('atendimento')
    expect(recommendDevelopmentThemeFromGap('carro de troca')).toBe('carro_de_troca')
  })

  test('creates a basic new collaborator track with locked future steps', () => {
    const track = buildNewCollaboratorTrack()

    expect(track[0].locked).toBe(false)
    expect(track.some(step => step.theme === 'rotina_diaria')).toBe(true)
    expect(track.filter(step => step.locked).length).toBeGreaterThan(0)
  })

  test('builds institutional/editorial metadata without leaking stores', () => {
    const metadata = buildDevelopmentContentMetadata({
      item: { id: '1', title: 'História da loja', type: 'institucional' },
      storeId: 'store-1',
    })

    expect(metadata.source_kind).toBe('loja_institucional')
    expect(metadata.store_id).toBe('store-1')
    expect(metadata.theme).toBe('institucional')
    expect(isContentVisibleForStore({ store_id: 'store-1' }, 'store-1')).toBe(true)
    expect(isContentVisibleForStore({ store_id: 'store-1' }, 'store-2')).toBe(false)
    expect(isContentVisibleForStore({ store_id: null }, 'store-2')).toBe(true)
  })
})

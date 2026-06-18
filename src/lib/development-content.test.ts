import { describe, expect, test } from 'bun:test'
import {
  buildFunnelDevelopmentRecommendation,
  buildDevelopmentContentMetadata,
  buildNewCollaboratorTrack,
  buildDevelopmentRecommendation,
  buildRecommendedDevelopmentCards,
  calculateAverageRating,
  filterDevelopmentContent,
  inferDevelopmentTheme,
  isTrackStepUnlocked,
  isContentVisibleForStore,
  recommendDevelopmentThemeFromGap,
  shouldReviewContent,
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
    expect(track.length).toBe(11)
    expect(track.some(step => step.month === 6 && step.unlockRule === 'manager_release')).toBe(true)
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

  test('calculates ratings and flags curation review candidates', () => {
    expect(calculateAverageRating([{ rating: 5 }, { rating: 3 }, { rating: 4 }])).toEqual({ average: 4, count: 3 })
    expect(shouldReviewContent({ averageRating: 3.2, ratingCount: 4 })).toBe(true)
    expect(shouldReviewContent({ averageRating: 4.8, ratingCount: 4, editorialStatus: 'active' })).toBe(false)
    expect(shouldReviewContent({ editorialStatus: 'review' })).toBe(true)
  })

  test('builds persisted recommendation metadata from feedback or PDI text', () => {
    const recommendation = buildDevelopmentRecommendation({
      source: 'feedback',
      text: 'Baixo retorno de CRM e follow-up',
      availableContent: [{ id: 'crm-1', title: 'CRM e follow-up', type: 'crm' }],
    })

    expect(recommendation.theme).toBe('crm')
    expect(recommendation.training_id).toBe('crm-1')
    expect(recommendation.reason).toContain('feedback')
  })

  test('builds a deterministic recommendation from the main funnel bottleneck', () => {
    const recommendation = buildFunnelDevelopmentRecommendation({
      gargalo: {
        etapa: 'agendamento',
        total: 5,
        pendentes: 4,
        concluidos: 1,
        cancelados: 0,
        semSucesso: 2,
        aguardando: 1,
        reagendamentosSemSucesso: 1,
      },
      availableContent: [
        { id: 'crm-1', title: 'CRM e follow-up', type: 'crm' },
        { id: 'agd-1', title: 'Confirmacao de visita', type: 'agendamento' },
      ],
    })

    expect(recommendation?.source_type).toBe('funil')
    expect(recommendation?.theme).toBe('agendamento')
    expect(recommendation?.training_id).toBe('agd-1')
    expect(recommendation?.reason).toContain('gargalo de funil')
    expect(recommendation?.reason).toContain('Agendamento')
  })

  test('builds explainable recommendation cards without duplicate trainings', () => {
    const availableContent = [
      { id: 'crm-1', title: 'CRM e follow-up', type: 'crm' },
      { id: 'agd-1', title: 'Confirmacao de visita', type: 'agendamento' },
      { id: 'pdi-1', title: 'Negociacao consultiva', type: 'fechamento' },
    ]

    const cards = buildRecommendedDevelopmentCards({
      recommendations: [
        {
          id: 'rec-feedback',
          seller_id: 'seller-1',
          store_id: 'store-1',
          source_type: 'feedback',
          source_id: 'feedback-1',
          theme: 'crm',
          training_id: 'crm-1',
          reason: 'Feedback apontou baixo retorno de CRM.',
          status: 'recommended',
          priority: 'high',
          due_date: null,
          created_at: '2026-06-17T10:00:00Z',
          training: availableContent[0],
        },
        {
          id: 'rec-pdi',
          seller_id: 'seller-1',
          store_id: 'store-1',
          source_type: 'pdi',
          source_id: 'pdi-1',
          theme: 'fechamento',
          training_id: null,
          reason: 'PDI indicou competencia baixa em negociacao.',
          status: 'recommended',
          priority: 'medium',
          due_date: null,
          created_at: '2026-06-17T09:00:00Z',
          training: null,
        },
      ],
      funnelGap: {
        etapa: 'agendamento',
        total: 5,
        pendentes: 4,
        concluidos: 1,
        cancelados: 0,
        semSucesso: 2,
        aguardando: 1,
        reagendamentosSemSucesso: 1,
      },
      availableContent,
      limit: 3,
    })

  expect(cards.map(card => card.sourceLabel)).toEqual(['Feedback', 'PDI', 'Funil de Vendas'])
    expect(cards.map(card => card.training.id)).toEqual(['crm-1', 'pdi-1', 'agd-1'])
    expect(new Set(cards.map(card => card.training.id)).size).toBe(cards.length)
    expect(cards[0].reason).toContain('baixo retorno')
    expect(cards[2].reason).toContain('gargalo de funil')
  })

  test('unlocks onboarding steps by month and prior completion', () => {
    const track = buildNewCollaboratorTrack()

    expect(isTrackStepUnlocked(track[0], [], 1)).toBe(true)
    expect(isTrackStepUnlocked(track[2], [], 1)).toBe(false)
    expect(isTrackStepUnlocked(track[2], ['m1_rotina'], 1)).toBe(true)
    expect(isTrackStepUnlocked(track[3], ['m1_atendimento'], 1)).toBe(false)
    expect(isTrackStepUnlocked(track[3], ['m1_atendimento'], 2)).toBe(true)
  })
})

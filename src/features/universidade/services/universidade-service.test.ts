import { describe, expect, test } from 'vitest'
import { mapVendedorTreinamentos } from './universidade-service'

describe('mapVendedorTreinamentos', () => {
  const training = {
    id: 'training-1',
    title: 'Prospecção consultiva',
    description: 'Conteúdo real',
    type: 'prospeccao',
    curation_notes: 'N2 Intermediário',
    target_audience: 'vendedor',
    duration_minutes: 20,
    video_url: 'https://example.com/aula',
    material_url: null,
    published_at: null,
  }

  test('combina conteúdo e progresso sem fabricar métricas', () => {
    const [result] = mapVendedorTreinamentos([training], [{
      id: 'progress-1', training_id: training.id, status: 'concluido', progress_percent: 100, completed_at: '2026-07-10T10:00:00Z',
    }])

    expect(result).toMatchObject({
      id: training.id,
      category: 'Prospecção',
      level: 'N2 Intermediário',
      completed: true,
      progress_percent: 100,
    })
    expect(result).not.toHaveProperty('quiz_score')
    expect(result).not.toHaveProperty('hours_studied')
  })

  test('mantém conteúdo sem progresso como não concluído', () => {
    const [result] = mapVendedorTreinamentos([training], [])

    expect(result.completed).toBe(false)
    expect(result.progress_percent).toBe(0)
    expect(result.completed_at).toBeNull()
  })
})

import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const assignMaturityTrack = mock(async () => ({ error: null }))
const refetchTracks = mock(async () => {})
const markWatched = mock(async () => undefined)
const rateTraining = mock(async () => ({ error: null }))
const suggestContent = mock(async () => ({ error: null }))
const refetchTrainings = mock(async () => undefined)

let developmentAssignments: unknown[] = []
let developmentRecommendations: unknown[] = []
let tracksLoading = false
let cadenciaAnalytics = {
  totalEstados: 0,
  gargalos: [] as unknown[],
  demandaVeiculos: [],
  conversaoPorFluxo: [],
}

const trainingRows = [
  {
    id: 'training-1',
    title: 'Fechamento consultivo',
    description: 'Conteúdo obrigatório para conversão.',
    type: 'fechamento',
    video_url: 'https://example.com/fechamento',
    target_audience: 'vendedor',
    active: true,
    store_id: null,
    source_kind: 'mx_interno',
    editorial_status: 'active',
    duration_minutes: 20,
    created_at: '2026-06-16T12:00:00Z',
    watched: false,
    user_rating: null,
    user_comment: null,
    average_rating: 0,
    rating_count: 0,
    needs_review: false,
  },
  {
    id: 'training-2',
    title: 'Confirmacao de visita',
    description: 'Conteudo para reduzir furos de agendamento.',
    type: 'agendamento',
    video_url: 'https://example.com/agendamento',
    target_audience: 'vendedor',
    active: true,
    store_id: null,
    source_kind: 'mx_interno',
    editorial_status: 'active',
    duration_minutes: 15,
    created_at: '2026-06-16T11:00:00Z',
    watched: false,
    user_rating: null,
    user_comment: null,
    average_rating: 0,
    rating_count: 0,
    needs_review: false,
  },
]

mock.module('sonner', () => ({
  toast: {
    error: mock(() => {}),
    info: mock(() => {}),
    success: mock(() => {}),
  },
}))

mock.module('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: {
      id: 'seller-1',
      name: 'Ana Vendedora',
      avatar_url: null,
    },
    role: 'vendedor',
    storeId: 'store-1',
    vinculos_loja: [],
  }),
}))

mock.module('@/hooks/useData', () => ({
  useTrainings: () => ({
    treinamentos: trainingRows,
    loading: false,
    error: null,
    markWatched,
    rateTraining,
    suggestContent,
    refetch: refetchTrainings,
  }),
  useDevelopmentRecommendations: () => ({
    recommendations: developmentRecommendations,
    loading: false,
  }),
  useDevelopmentTracks: () => ({
    assignments: developmentAssignments,
    progress: [],
    loading: tracksLoading,
    assignMaturityTrack,
    refetch: refetchTracks,
  }),
}))

mock.module('@/features/crm/hooks/useOportunidades', () => ({
  useOportunidades: () => ({
    oportunidades: [],
  }),
}))

mock.module('@/features/crm/hooks/useCadenciaAnalytics', () => ({
  useCadenciaAnalytics: () => ({
    analytics: cadenciaAnalytics,
    loading: false,
    error: null,
  }),
}))

mock.module('@/hooks/useAulasAoVivo', () => ({
  useAulasAoVivo: () => ({
    indicadores: {
      presencasValidadas: 0,
      mediaProvas: null,
    },
  }),
}))

mock.module('@/features/universidade/sections/AulasAoVivoSection', () => ({
  AulasAoVivoSection: () => <div>Aulas ao Vivo</div>,
}))

mock.module('@/features/crm/hooks/useVendedorPerfil', () => ({
  MATURIDADE_VENDEDOR_LABEL: {
    N1: 'N1 — Iniciante',
    N2: 'N2 — Intermediário',
    N3: 'N3 — Performance',
    N4: 'N4 — Alta Performance',
  },
  derivarNivelMaturidadeVendedor: () => 'N4',
  trackTypeParaMaturidade: () => 'maturidade_n4',
  useVendedorPerfil: () => ({
    perfil: {
      tempo_mercado_anos: 5,
      experiencia_declarada: 'especialista',
      cargo_atual: 'Vendedor senior',
    },
  }),
}))

const { default: VendedorTreinamentos } = await import('./VendedorTreinamentos')

function renderPage(initialEntry = '/vendedor/treinamentos') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <VendedorTreinamentos />
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  developmentAssignments = []
  developmentRecommendations = []
  tracksLoading = false
  cadenciaAnalytics = {
    totalEstados: 0,
    gargalos: [],
    demandaVeiculos: [],
    conversaoPorFluxo: [],
  }
  assignMaturityTrack.mockClear()
  refetchTracks.mockClear()
  markWatched.mockClear()
  rateTraining.mockClear()
  suggestContent.mockClear()
  refetchTrainings.mockClear()
})

describe('VendedorTreinamentos', () => {
  it('exibe nivel sugerido e autoatribui trilha de maturidade quando nao existe atribuicao ativa', async () => {
    renderPage()

    expect(screen.getAllByText('Trilha obrigatória').length).toBeGreaterThan(0)
    expect(screen.getAllByText('N4 — Alta Performance').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sugerida pelo Meu Perfil').length).toBeGreaterThan(0)

    await waitFor(() => {
      expect(assignMaturityTrack).toHaveBeenCalledWith({ sellerId: 'seller-1' })
    })
    await waitFor(() => {
      expect(refetchTracks).toHaveBeenCalled()
    })
  })

  it('exibe trilha N4 ativa e nao chama autoatribuicao novamente', () => {
    developmentAssignments = [
      {
        id: 'assignment-1',
        status: 'active',
        track: {
          name: 'Trilha MX - N4 Alta Performance',
          track_type: 'maturidade_n4',
        },
      },
    ]

    renderPage('/vendedor/treinamentos?tab=trilha')

    expect(screen.getByText('Minha Trilha obrigatória: Trilha MX - N4 Alta Performance')).toBeInTheDocument()
    expect(screen.getByText(/atribuída automaticamente pelo seu nível comercial/i)).toBeInTheDocument()
    expect(assignMaturityTrack).not.toHaveBeenCalled()
  })

  it('mostra recomendacoes explicaveis de feedback e funil na visao geral', () => {
    developmentRecommendations = [
      {
        id: 'rec-feedback',
        seller_id: 'seller-1',
        store_id: 'store-1',
        source_type: 'feedback',
        source_id: 'feedback-1',
        theme: 'fechamento',
        training_id: 'training-1',
        reason: 'Feedback apontou dificuldade em fechamento consultivo.',
        status: 'recommended',
        priority: 'high',
        due_date: null,
        created_at: '2026-06-17T10:00:00Z',
        training: trainingRows[0],
      },
    ]
    cadenciaAnalytics = {
      totalEstados: 5,
      gargalos: [{
        etapa: 'agendamento',
        total: 5,
        pendentes: 4,
        concluidos: 1,
        cancelados: 0,
        semSucesso: 2,
        aguardando: 1,
        reagendamentosSemSucesso: 1,
      }],
      demandaVeiculos: [],
      conversaoPorFluxo: [],
    }

    renderPage()

    expect(screen.getByText('Feedback')).toBeInTheDocument()
    expect(screen.getByText(/dificuldade em fechamento consultivo/i)).toBeInTheDocument()
    expect(screen.getByText('Funil')).toBeInTheDocument()
    expect(screen.getByText(/gargalo de funil/i)).toBeInTheDocument()
    expect(screen.getByText('Confirmacao de visita')).toBeInTheDocument()
  })
})

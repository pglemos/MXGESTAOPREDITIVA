import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import type { CadenciaAnalytics } from '@/features/crm/lib/cadencia-analytics'

const acknowledge = mock(async () => ({ error: null }))
const createAutonomousFeedback = mock(async () => ({ error: null }))
let feedbackRows: typeof systemFeedback[] = []

const analytics: CadenciaAnalytics = {
  totalEstados: 10,
  gargalos: [{
    etapa: 'Agendamento',
    total: 6,
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

const systemFeedback = {
  id: '11111111-1111-4111-8111-111111111111',
  store_id: 'store-1',
  manager_id: null,
  seller_id: 'seller-1',
  week_reference: '2026-06-15',
  leads_week: 12,
  agd_week: 8,
  visit_week: 1,
  vnd_week: 0,
  tx_lead_agd: 66.7,
  tx_agd_visita: 12.5,
  tx_visita_vnd: 0,
  meta_compromisso: 4,
  positives: 'Voce tem base suficiente para agir hoje.',
  attention_points: 'Gargalo principal identificado em Agendamento.',
  action: 'Hoje as 09:00, retomar clientes parados em Agendamento.',
  caso_motivo: 'Sistema MX identificou gargalo em Agendamento.',
  notes: 'Feedback automatico gerado por regra explicavel.',
  team_avg_json: {},
  diagnostic_json: { origem: 'sistema', rule_id: 'cadencia_gargalo_principal' },
  commitment_suggested: 4,
  acknowledged: false,
  acknowledged_at: null,
  seller_comment: null,
  seller_comment_at: null,
  created_at: '2026-06-16T12:00:00.000Z',
}

mock.module('sonner', () => ({
  toast: {
    error: mock(() => {}),
    success: mock(() => {}),
  },
}))

mock.module('@/hooks/useData', () => ({
  useFeedbacks: () => ({
    devolutivas: feedbackRows,
    loading: false,
    acknowledge,
    createAutonomousFeedback,
  }),
  useTrainings: () => ({
    treinamentos: [],
    loading: false,
    error: null,
    markWatched: mock(async () => undefined),
    rateTraining: mock(async () => ({ error: null })),
    suggestContent: mock(async () => ({ error: null })),
    refetch: mock(async () => undefined),
  }),
  useDevelopmentRecommendations: () => ({
    recommendations: [],
    loading: false,
  }),
  useDevelopmentTracks: () => ({
    assignments: [],
    progress: [],
    loading: false,
    assignMaturityTrack: mock(async () => ({ error: null })),
    refetch: mock(async () => undefined),
  }),
  useWeeklyFeedbackReports: () => ({ reports: [], loading: false }),
  useNotifications: () => ({ notifications: [], loading: false }),
  useSystemBroadcasts: () => ({ broadcasts: [], loading: false }),
  useTeamTrainings: () => ({ performance: [], loading: false }),
  useStoreDeliveryRules: () => ({ rules: null, loading: false }),
}))

mock.module('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'seller-1', name: 'Ana Vendedora' },
    role: 'vendedor',
    storeId: 'store-1',
    activeStoreId: 'store-1',
    vinculos_loja: [],
  }),
}))

mock.module('@/features/crm/hooks/useVendedorPerfil', () => ({
  DIAS_SEMANA: [
    { code: 'seg', label: 'Seg' },
    { code: 'ter', label: 'Ter' },
    { code: 'qua', label: 'Qua' },
    { code: 'qui', label: 'Qui' },
    { code: 'sex', label: 'Sex' },
  ],
  MATURIDADE_VENDEDOR_LABEL: {
    N1: 'N1 — Iniciante',
    N2: 'N2 — Intermediário',
    N3: 'N3 — Performance',
    N4: 'N4 — Alta Performance',
  },
  MATURIDADE_TRACK_TYPE: {
    N1: 'maturidade_n1',
    N2: 'maturidade_n2',
    N3: 'maturidade_n3',
    N4: 'maturidade_n4',
  },
  VENDEDOR_EXPERIENCIA_DECLARADA: ['sem_experiencia', 'iniciante', 'intermediario', 'experiente', 'especialista'],
  VENDEDOR_EXPERIENCIA_LABEL: {
    sem_experiencia: 'Sem experiência',
    iniciante: 'Iniciante',
    intermediario: 'Intermediário',
    experiente: 'Experiente',
    especialista: 'Especialista',
  },
  VENDEDOR_VINCULO_TIPO: ['loja', 'autonomo'],
  DEFAULT_PERFIL: {
    hora_entrada: null,
    hora_almoco_inicio: null,
    hora_almoco_fim: null,
    hora_saida: null,
    dias_trabalho: ['seg', 'ter', 'qua', 'qui', 'sex'],
    fechar_dia_notificacao_ativa: true,
    fechar_dia_notificacao_hora: null,
    objetivo_curto: null,
    objetivo_medio: null,
    objetivo_longo: null,
    carreira_interesse: 'nao',
    pretensao_min: null,
    pretensao_max: null,
    cargos_interesse: null,
    cidades_interesse: null,
    tempo_mercado_anos: null,
    experiencia_declarada: null,
    cargo_atual: null,
    vinculo_tipo: null,
    mix_canal_internet_pct: null,
    mix_canal_carteira_pct: null,
    mix_canal_porta_pct: null,
  },
  derivarNivelMaturidadeVendedor: () => 'N4',
  trackTypeParaMaturidade: () => 'maturidade_n4',
  resolverVinculoTipoVendedor: () => 'autonomo',
  useVendedorPerfil: () => ({
    perfil: {
      tempo_mercado_anos: 5,
      experiencia_declarada: 'especialista',
      cargo_atual: 'Vendedor senior',
    },
    vinculoTipo: 'autonomo',
    loading: false,
  }),
}))

mock.module('@/features/crm/hooks/useOportunidades', () => ({
  buildOportunidadePayload: (
    input: {
      cliente_id: string
      veiculo_interesse?: string | null
      tipo_veiculo?: string | null
      valor_negociado?: number
      etapa?: string
      canal?: string | null
      sinal?: number
      financiamento?: string
      carro_avaliado?: boolean
      motivo_perda?: string | null
      closed_at?: string | null
    },
    context: { loja_id: string; seller_user_id: string },
    nowIso = () => new Date().toISOString(),
  ) => {
    const isTerminal = input.etapa === 'ganho' || input.etapa === 'perdido'
    return {
      cliente_id: input.cliente_id,
      loja_id: context.loja_id,
      seller_user_id: context.seller_user_id,
      veiculo_interesse: input.veiculo_interesse?.trim() || null,
      tipo_veiculo: input.tipo_veiculo || null,
      valor_negociado: input.valor_negociado ?? 0,
      etapa: input.etapa || 'prospeccao',
      canal: input.canal || null,
      sinal: input.sinal ?? 0,
      financiamento: input.financiamento || 'nao_aplica',
      carro_avaliado: input.carro_avaliado ?? false,
      motivo_perda: input.etapa === 'perdido' ? (input.motivo_perda?.trim() || null) : null,
      closed_at: isTerminal ? (input.closed_at || nowIso()) : null,
    }
  },
  useOportunidades: () => ({
    oportunidades: [],
  }),
}))

mock.module('@/features/crm/hooks/useCadenciaAnalytics', () => ({
  useCadenciaAnalytics: () => ({
    analytics,
    loading: false,
    error: null,
  }),
}))

const { default: VendedorFeedback } = await import('./VendedorFeedback')

afterEach(() => {
  cleanup()
  feedbackRows = []
  acknowledge.mockClear()
  createAutonomousFeedback.mockClear()
})

describe('VendedorFeedback', () => {
  it('mostra Sistema MX como responsavel da devolutiva sistemica', () => {
    feedbackRows = [systemFeedback]

    render(<VendedorFeedback />)

    expect(screen.getAllByText('Sistema MX').length).toBeGreaterThan(0)
    expect(screen.queryByText('Seu gestor')).toBeNull()
  })

  it('gera feedback autonomo quando ha gargalo e nao existe devolutiva sistemica da semana', async () => {
    feedbackRows = []

    render(<VendedorFeedback />)

    await waitFor(() => expect(createAutonomousFeedback).toHaveBeenCalledTimes(1))
    expect(createAutonomousFeedback.mock.calls[0]?.[0]).toMatchObject({
      manager_id: null,
      seller_id: 'seller-1',
      store_id: 'store-1',
      diagnostic_json: {
        origem: 'sistema',
        etapa_gargalo: 'Agendamento',
      },
    })
  })
})

import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { CadenciaAnalytics } from '@/features/crm/lib/cadencia-analytics'

const DialogContext = React.createContext<{ onOpenChange?: (open: boolean) => void }>({})

mock.module('@radix-ui/react-dialog', () => ({
  Root: ({ children, open, onOpenChange }: any) => {
    if (!open) return null
    return React.createElement(DialogContext.Provider, { value: { onOpenChange } }, children)
  },
  Portal: ({ children }: any) => React.createElement(React.Fragment, null, children),
  Overlay: (props: any) => React.createElement('div', { ...props, 'data-testid': 'overlay' }),
  Content: (props: any) => React.createElement('div', { ...props, role: 'dialog' }),
  Title: ({ children }: any) => React.createElement(React.Fragment, null, children),
  Description: ({ children }: any) => React.createElement(React.Fragment, null, children),
  Close: ({ children, asChild, ...props }: any) => {
    const { onOpenChange } = React.useContext(DialogContext)
    const handleClick = () => onOpenChange?.(false)
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, { onClick: handleClick })
    }
    return React.createElement('button', { ...props, onClick: handleClick }, children)
  },
}))

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
  it('estrutura a tela Feedback com KPIs, ações vinculadas, pendências, lateral, histórico e evolução', () => {
    render(<MemoryRouter><VendedorFeedback /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Feedback' })).toBeInTheDocument()
    expect(screen.getByText('Receba feedbacks, leia com atenção e confirme para acompanharmos seu desenvolvimento.')).toBeInTheDocument()

    const kpis = screen.getByLabelText('KPIs de feedback')
    expect(within(kpis).getByText('Feedback recebido')).toBeInTheDocument()
    expect(within(kpis).getByText('Positivos')).toBeInTheDocument()
    expect(within(kpis).getByText('Desenvolvimento')).toBeInTheDocument()
    expect(within(kpis).getByText('Pendentes')).toBeInTheDocument()
    expect(within(kpis).getByText('Ações obrigatórias')).toBeInTheDocument()
    expect(within(kpis).getByText('Engajamento com feedback')).toBeInTheDocument()

    const actions = screen.getByLabelText('Ações vinculadas a feedback')
    expect(within(actions).getByText('Agendar 3 retornos hoje')).toBeInTheDocument()
    expect(within(actions).getByText('Atualizar status de 5 clientes sem próxima ação')).toBeInTheDocument()
    expect(within(actions).getAllByRole('button', { name: /ver na central de execução/i }).length).toBeGreaterThan(0)
    expect(within(actions).getAllByRole('button', { name: /marcar como feito/i }).length).toBeGreaterThan(0)
    expect(within(actions).getAllByRole('button', { name: /justificar/i }).length).toBeGreaterThan(0)

    const pending = screen.getByLabelText('Feedback pendente')
    for (const header of ['Data', 'Tipo', 'Competência', 'Motivo / Caso', 'Indicador', 'Comentário do líder', 'Responsável', 'Ação vinculada', 'Ações']) {
      expect(within(pending).getByText(header)).toBeInTheDocument()
    }
    expect(within(pending).getByText('Baixa prospecção ativa')).toBeInTheDocument()
    expect(within(pending).getByText('2 contatos realizados de 5 esperados')).toBeInTheDocument()
    expect(within(pending).getAllByText('Pedro Almeida').length).toBeGreaterThan(0)
    expect(within(pending).getAllByRole('button', { name: /li e compreendi/i }).length).toBeGreaterThan(0)
    expect(within(pending).getAllByRole('button', { name: /deixar comentário/i }).length).toBeGreaterThan(0)
    expect(within(pending).getAllByRole('button', { name: /ver ação/i }).length).toBeGreaterThan(0)

    const sidebar = screen.getByLabelText('Orientações e impactos de feedback')
    expect(within(sidebar).getByText('Por que é importante confirmar seus feedbacks?')).toBeInTheDocument()
    expect(within(sidebar).getByText('Impacto no Fechamento Diário')).toBeInTheDocument()
    expect(within(sidebar).getByText('Vinculado à Central de Execução')).toBeInTheDocument()

    const history = screen.getByLabelText('Histórico de feedbacks')
    expect(within(history).getByText('Histórico de feedbacks')).toBeInTheDocument()
    expect(within(history).getByText('Confirmado em')).toBeInTheDocument()
    expect(within(history).getByText('Meu comentário')).toBeInTheDocument()
    expect(within(history).getAllByText(/Lido e compreendido|Ação concluída|Justificado|Pendente|Ação pendente/).length).toBeGreaterThan(0)

    const evolution = screen.getByLabelText('Evolução após feedbacks')
    expect(within(evolution).getByText('Evolução após feedbacks')).toBeInTheDocument()
    expect(within(evolution).getByText('+12')).toBeInTheDocument()
    expect(within(evolution).getByText('contatos realizados')).toBeInTheDocument()
    expect(within(evolution).getByText('+3')).toBeInTheDocument()
    expect(within(evolution).getByText('retornos agendados')).toBeInTheDocument()
    expect(screen.queryByText(/Ajuste Técnico/i)).not.toBeInTheDocument()
  })

  it('abre comentário, detalhe de ação e justificativa mantendo vínculo com feedback', () => {
    render(<MemoryRouter><VendedorFeedback /></MemoryRouter>)

    fireEvent.click(screen.getAllByRole('button', { name: /deixar comentário/i })[0])
    expect(screen.getByRole('heading', { name: 'Deixar comentário' })).toBeInTheDocument()
    expect(screen.getByLabelText('Comentário do vendedor')).toBeInTheDocument()
    expect(screen.getByLabelText('Anexo opcional')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Comentário do vendedor'), { target: { value: 'Entendi o ponto e vou executar hoje.' } })
    fireEvent.click(screen.getByRole('button', { name: /enviar comentário/i }))
    expect(screen.queryByText('Seu comentário fica vinculado ao feedback e notifica seu líder.')).not.toBeInTheDocument()
    expect(screen.getByText('Entendi o ponto e vou executar hoje.')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: /ver ação/i })[0])
    expect(screen.getByRole('heading', { name: 'Detalhe da ação vinculada' })).toBeInTheDocument()
    expect(screen.getByText('Origem do feedback')).toBeInTheDocument()
    expect(screen.getByText('Critério de conclusão')).toBeInTheDocument()
    expect(screen.getByText('Impacto no fechamento')).toBeInTheDocument()

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Justificar$/i }))
    expect(screen.getByRole('heading', { name: 'Justificar ação pendente' })).toBeInTheDocument()
    expect(screen.getByLabelText('Motivo da não conclusão')).toBeInTheDocument()
    expect(screen.getByLabelText('Descrição obrigatória')).toBeInTheDocument()
  })

  it('mostra Sistema MX como responsavel da devolutiva sistemica', () => {
    feedbackRows = [systemFeedback]

    render(<MemoryRouter><VendedorFeedback /></MemoryRouter>)

    expect(screen.getAllByText('Sistema MX').length).toBeGreaterThan(0)
    expect(screen.queryByText('Seu gestor')).toBeNull()
  })

  it('confirma leitura de feedback real pelo fluxo Li e compreendi', async () => {
    feedbackRows = [systemFeedback]

    render(<MemoryRouter><VendedorFeedback /></MemoryRouter>)

    fireEvent.click(screen.getAllByRole('button', { name: /li e compreendi/i })[0])

    await waitFor(() => expect(acknowledge).toHaveBeenCalledWith({ id: systemFeedback.id, sellerComment: undefined }))
  })

  it('gera feedback autonomo quando ha gargalo e nao existe devolutiva sistemica da semana', async () => {
    feedbackRows = []

    render(<MemoryRouter><VendedorFeedback /></MemoryRouter>)

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

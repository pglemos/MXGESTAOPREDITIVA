import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

  it('estrutura a aba Trilha como area obrigatoria com acoes, modulos, pontos e desbloqueios', () => {
    renderPage('/vendedor/treinamentos?tab=trilha')

    const tabs = screen.getByRole('tablist', { name: /abas de treinamentos/i })
    expect(within(tabs).getByRole('tab', { name: 'Trilha' })).toHaveAttribute('aria-selected', 'true')
    expect(within(tabs).getByRole('tab', { name: 'Provas' })).toBeInTheDocument()

    const actions = screen.getByLabelText('Ações obrigatórias da Trilha')
    expect(within(actions).getByText('Próxima ação obrigatória')).toBeInTheDocument()
    expect(within(actions).getByText('Fechamento e contorno de objeções')).toBeInTheDocument()
    expect(within(actions).getByText('Prova pendente')).toBeInTheDocument()
    expect(within(actions).getByText('Responder prova')).toBeInTheDocument()
    expect(within(actions).getByText('Prazo da trilha')).toBeInTheDocument()
    expect(within(actions).getByText('Ciclo atual: Jun/2026 a Dez/2026')).toBeInTheDocument()
    expect(within(actions).getByText('Prazo final: 31/12/2026')).toBeInTheDocument()

    const moduleOne = screen.getByLabelText('Módulo 1 Negociação e Fechamento')
    for (const header of ['Conteúdo', 'Tipo', 'Duração', 'Progresso', 'Prova', 'Nota mínima', 'Pontos', 'Status', 'Ação']) {
      expect(within(moduleOne).getByText(header)).toBeInTheDocument()
    }
    expect(within(moduleOne).getByText('Fechamento e contorno de objeções')).toBeInTheDocument()
    expect(within(moduleOne).getByText('Prova obrigatória')).toBeInTheDocument()
    expect(within(moduleOne).getByText('70%')).toBeInTheDocument()
    expect(within(moduleOne).getByText('Sandbox MX Fechamento')).toBeInTheDocument()
    expect(within(moduleOne).getByText('35%')).toBeInTheDocument()
    expect(screen.getAllByText('Não iniciado').length).toBeGreaterThanOrEqual(2)
    expect(within(screen.getByLabelText('Módulo 4 Liderança e Influência')).getByText('Conteúdos em preparação')).toBeInTheDocument()

    const sidebar = screen.getByLabelText('Detalhes da Trilha obrigatória')
    expect(within(sidebar).getByText('Sobre sua Trilha obrigatória')).toBeInTheDocument()
    expect(within(sidebar).getByText('Seu progresso')).toBeInTheDocument()
    expect(within(sidebar).getByText('Pontos da Trilha')).toBeInTheDocument()
    expect(within(sidebar).getByText('Próxima conquista')).toBeInTheDocument()
    expect(within(sidebar).getByText('Vinculado ao PDI / Feedback')).toBeInTheDocument()
    expect(within(sidebar).getByText('Melhorar follow-up com clientes sem resposta.')).toBeInTheDocument()
    expect(screen.getByText('Ao concluir esta trilha, você desbloqueia:')).toBeInTheDocument()
    expect(screen.getByText(/Certificado/)).toBeInTheDocument()
    expect(screen.getByText('Conquista de conclusão')).toBeInTheDocument()
    expect(screen.getByText('Pontos no Score MX')).toBeInTheDocument()
  })

  it('abre modal explicando como o nivel da Trilha e definido', () => {
    renderPage('/vendedor/treinamentos?tab=trilha')

    fireEvent.click(screen.getByRole('button', { name: /entenda como seu nível é definido/i }))

    const dialog = screen.getByRole('dialog', { name: 'Entenda como seu nível é definido' })
    expect(within(dialog).getAllByText('Meu Perfil').length).toBeGreaterThan(0)
    expect(within(dialog).getByText('Tempo de mercado')).toBeInTheDocument()
    expect(within(dialog).getByText('Experiência declarada')).toBeInTheDocument()
    expect(within(dialog).getByText('Diagnóstico inicial')).toBeInTheDocument()
    expect(within(dialog).getByText('Desempenho')).toBeInTheDocument()
    expect(within(dialog).getByText('Avaliações anteriores')).toBeInTheDocument()
    expect(within(dialog).getByText(/N1, N2, N3 e N4/)).toBeInTheDocument()
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

  it('preserva hierarquia final: abas, indicadores, obrigatorios, recomendados, lateral e banner', () => {
    renderPage()

    const tabs = screen.getByRole('tablist', { name: /abas de treinamentos/i })
    const summary = screen.getByLabelText('Resumo de treinamentos')
    const mandatoryActions = screen.getByLabelText('Próximas ações obrigatórias')
    const recommendations = screen.getByLabelText('Recomendado para você')
    const requiredTrack = screen.getByLabelText('Trilha obrigatória')

    expect(Boolean(tabs.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true)
    expect(Boolean(summary.compareDocumentPosition(mandatoryActions) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true)
    expect(Boolean(mandatoryActions.compareDocumentPosition(recommendations) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true)

    expect(within(mandatoryActions).getByText('Próxima aula obrigatória')).toBeInTheDocument()
    expect(within(mandatoryActions).getByText('Prova pendente')).toBeInTheDocument()
    expect(within(mandatoryActions).getByText('Próxima aula ao vivo')).toBeInTheDocument()
    expect(within(requiredTrack).getByText('Ciclo: Jun/2026 a Dez/2026')).toBeInTheDocument()
    expect(within(requiredTrack).getByText('Prazo final: 31/12/2026')).toBeInTheDocument()
    expect(screen.getByText('A prova é sua confirmação de presença!')).toBeInTheDocument()
  })

  it('estrutura a aba Aulas ao Vivo com indicadores, prova, agenda, gravacoes e pontuacao proprios', () => {
    renderPage('/vendedor/treinamentos?tab=aulas')

    const tabs = screen.getByRole('tablist', { name: /abas de treinamentos/i })
    expect(within(tabs).getByRole('tab', { name: 'Aulas ao Vivo' })).toHaveAttribute('aria-selected', 'true')
    expect(within(tabs).getByRole('tab', { name: 'Trilha' })).toBeInTheDocument()
    expect(within(tabs).queryByRole('tab', { name: 'Trilhas' })).not.toBeInTheDocument()
    expect(within(tabs).getByRole('tab', { name: 'Provas' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Resumo de treinamentos')).not.toBeInTheDocument()

    const indicators = screen.getByLabelText('Indicadores de Aulas ao Vivo')
    expect(within(indicators).getByText('Próximas aulas')).toBeInTheDocument()
    expect(within(indicators).getByText('Aulas confirmadas')).toBeInTheDocument()
    expect(within(indicators).getByText('Presenças validadas')).toBeInTheDocument()
    expect(within(indicators).getByText('Provas pendentes')).toBeInTheDocument()
    expect(within(indicators).getByText('Média nas provas')).toBeInTheDocument()
    expect(within(indicators).getByText('Pontos acumulados')).toBeInTheDocument()

    expect(screen.getByText('Próxima aula ao vivo')).toBeInTheDocument()
    expect(screen.getAllByText('Como aumentar agendamentos na internet').length).toBeGreaterThan(0)
    expect(screen.getByText('Sua presença será validada pela prova após a aula.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /participar da aula/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /adicionar ao calendário/i })).toBeInTheDocument()

    expect(screen.getAllByText('Prova pendente').length).toBeGreaterThan(0)
    expect(screen.getByText('Técnicas de Fechamento')).toBeInTheDocument()
    expect(screen.getAllByText('5 questões').length).toBeGreaterThan(0)
    expect(screen.getByText('Nota mínima: 70%')).toBeInTheDocument()
    expect(screen.getAllByText('Prazo: hoje até 23:59').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /responder prova/i })).toBeInTheDocument()
    expect(screen.queryByText(/5 10 perguntas/i)).not.toBeInTheDocument()

    const sidebar = screen.getByLabelText('Agenda e gravações de Aulas ao Vivo')
    expect(within(sidebar).getByText('Agenda de aulas')).toBeInTheDocument()
    expect(within(sidebar).getByText('Gravações disponíveis')).toBeInTheDocument()
    expect(within(sidebar).getByText('Sua pontuação')).toBeInTheDocument()
    expect(within(sidebar).getAllByText(/\+20 pts/).length).toBeGreaterThan(0)

    expect(screen.getAllByText('Como funciona').length).toBeGreaterThan(0)
    expect(screen.getByText('1. Confirme presença')).toBeInTheDocument()
    expect(screen.getByText('2. Participe da aula')).toBeInTheDocument()
    expect(screen.getByText('3. Faça a prova')).toBeInTheDocument()
    expect(screen.getByText('4. Valide sua presença')).toBeInTheDocument()
    expect(screen.getByText('5. Ganhe pontos no Score')).toBeInTheDocument()
    expect(screen.getByText('Suas aulas recentes')).toBeInTheDocument()
    expect(screen.getByText('Horas de conteúdo')).toBeInTheDocument()
    expect(screen.getByText('Presença que gera resultado!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ver meus certificados/i })).toBeInTheDocument()
  })

  it('estrutura a aba Provas com indicadores, prova obrigatoria, regras, tabela e lateral propria', () => {
    renderPage('/vendedor/treinamentos?tab=provas')

    const tabs = screen.getByRole('tablist', { name: /abas de treinamentos/i })
    expect(within(tabs).getByRole('tab', { name: 'Trilha' })).toBeInTheDocument()
    expect(within(tabs).queryByRole('tab', { name: 'Trilhas' })).not.toBeInTheDocument()
    expect(within(tabs).getByRole('tab', { name: 'Provas', selected: true })).toBeInTheDocument()
    expect(screen.queryByLabelText('Resumo de treinamentos')).not.toBeInTheDocument()

    const indicators = screen.getByLabelText('Indicadores de Provas')
    expect(within(indicators).getByText('Provas pendentes')).toBeInTheDocument()
    expect(within(indicators).getByText('Provas aprovadas')).toBeInTheDocument()
    expect(within(indicators).getByText('Reprovadas')).toBeInTheDocument()
    expect(within(indicators).getByText('Média nas provas')).toBeInTheDocument()
    expect(within(indicators).getByText('Presenças validadas')).toBeInTheDocument()
    expect(within(indicators).getByText('Pontos no Score')).toBeInTheDocument()

    expect(screen.getByText('Próxima prova obrigatória')).toBeInTheDocument()
    expect(screen.getAllByText('Técnicas de Fechamento').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Aula ao Vivo').length).toBeGreaterThan(0)
    expect(screen.getByText('• Negociação sem desconto')).toBeInTheDocument()
    expect(screen.getAllByText('5 questões').length).toBeGreaterThan(0)
    expect(screen.getByText('Nota mínima: 70%')).toBeInTheDocument()
    expect(screen.getByText('Tempo estimado: 8 min')).toBeInTheDocument()
    expect(screen.getAllByText('Prazo: hoje até 23:59').length).toBeGreaterThan(0)
    expect(screen.getByText('Pontuação: +20 pts no Score')).toBeInTheDocument()
    expect(screen.getByText('Ao atingir 70% ou mais, sua presença será validada automaticamente.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar prova/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ver conteúdo/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /como funciona/i }).length).toBeGreaterThan(0)

    expect(screen.getByText('Regras da prova')).toBeInTheDocument()
    expect(screen.getByText('5 questões objetivas')).toBeInTheDocument()
    expect(screen.getByText('nota mínima 70%')).toBeInTheDocument()
    expect(screen.getByText('1 tentativa por prova')).toBeInTheDocument()
    expect(screen.getByText('libera presença validada')).toBeInTheDocument()
    expect(screen.getByText('gera pontuação no Score MX')).toBeInTheDocument()
    expect(screen.getByText('Impacto no Score')).toBeInTheDocument()
    expect(screen.getByText('+20 pts')).toBeInTheDocument()

    const sidebar = screen.getByLabelText('Agenda e resultados de Provas')
    expect(within(sidebar).getByText('Agenda de provas')).toBeInTheDocument()
    expect(within(sidebar).getByText('Últimos resultados')).toBeInTheDocument()
    expect(within(sidebar).getByText('Sua pontuação')).toBeInTheDocument()

    expect(screen.getByText('1. Acesse a prova')).toBeInTheDocument()
    expect(screen.getByText('2. Responda 5 questões')).toBeInTheDocument()
    expect(screen.getByText('3. Atinga 70% ou mais')).toBeInTheDocument()
    expect(screen.getByText('4. Valide sua presença')).toBeInTheDocument()
    expect(screen.getByText('5. Ganhe pontos no Score')).toBeInTheDocument()
    expect(screen.queryByText(/5 10 perguntas|5 a 10 perguntas/i)).not.toBeInTheDocument()

    expect(screen.getByText('Suas provas recentes')).toBeInTheDocument()
    expect(screen.getByText('Provas concluídas')).toBeInTheDocument()
    expect(screen.getByText('Média de acertos')).toBeInTheDocument()
    expect(screen.getByText('Pontos conquistados')).toBeInTheDocument()
    expect(screen.getByText('Horas estudadas')).toBeInTheDocument()

    const table = screen.getByRole('table')
    for (const header of ['Prova', 'Origem', 'Obrigatória', 'Nota mínima', 'Sua nota', 'Status', 'Prazo', 'Tentativas', 'Ação']) {
      expect(within(table).getByText(header)).toBeInTheDocument()
    }
    expect(within(table).getByText('Pós-venda que gera indicação')).toBeInTheDocument()
    expect(within(table).getByText('Reprovada')).toBeInTheDocument()
    expect(within(table).getByText('Encerrada')).toBeInTheDocument()
    expect(within(table).getAllByText('1/1').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /refazer/i })).not.toBeInTheDocument()

    expect(screen.getByText('Aprendizado validado gera resultado!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ver meus certificados/i })).toBeInTheDocument()
  })

  it('estrutura a Biblioteca como area livre com indicadores, cards completos e lateral propria', () => {
    renderPage('/vendedor/treinamentos?tab=biblioteca')

    const banner = screen.getByText(/Biblioteca livre/i).closest('div')
    const libraryMetrics = screen.getByLabelText('Indicadores da Biblioteca')
    const categories = screen.getByLabelText('Categorias da Biblioteca')

    expect(banner).not.toBeNull()
    expect(Boolean(banner!.compareDocumentPosition(libraryMetrics) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true)
    expect(screen.queryByLabelText('Resumo de treinamentos')).not.toBeInTheDocument()

    expect(within(libraryMetrics).getByText('Conteúdos disponíveis')).toBeInTheDocument()
    expect(within(libraryMetrics).getByText('Assistidos')).toBeInTheDocument()
    expect(within(libraryMetrics).getByText('Em andamento')).toBeInTheDocument()
    expect(within(libraryMetrics).getByText('Favoritos')).toBeInTheDocument()
    expect(within(libraryMetrics).getByText('Vistos recentemente')).toBeInTheDocument()
    expect(within(libraryMetrics).getByText('Impacto no Score')).toBeInTheDocument()

    expect(within(categories).getByText('Todos')).toBeInTheDocument()
    expect(within(categories).getByText('WhatsApp')).toBeInTheDocument()
    expect(within(categories).getByText('Troca / Avaliação')).toBeInTheDocument()
    expect(screen.getAllByText('Obrigatório').length + screen.getAllByText('Recomendado').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Pontua no Score|Não pontua/).length).toBeGreaterThan(0)

    expect(screen.getByText('Trilha obrigatória')).toBeInTheDocument()
    expect(screen.getByText('Sugestões para você')).toBeInTheDocument()
    expect(screen.getAllByText('Sugerir conteúdo').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Vistos recentemente').length).toBeGreaterThan(0)
    expect(screen.getByText('Para aplicar hoje')).toBeInTheDocument()
    expect(screen.getByText('A prova é sua confirmação de presença!')).toBeInTheDocument()
  })

  it('abre modal de sugerir conteudo com os campos exigidos', () => {
    renderPage('/vendedor/treinamentos?tab=biblioteca')

    fireEvent.click(screen.getAllByRole('button', { name: /sugerir conteúdo/i })[0])

    const dialog = screen.getByRole('dialog', { name: 'Sugerir conteúdo' })
    expect(within(dialog).getByText('Tema')).toBeInTheDocument()
    expect(within(dialog).getByText('Categoria')).toBeInTheDocument()
    expect(within(dialog).getByText('Descrição da necessidade')).toBeInTheDocument()
    expect(within(dialog).getByText('Exemplo de situação real')).toBeInTheDocument()
    expect(within(dialog).getByText('Prioridade')).toBeInTheDocument()
    expect(within(dialog).getByText('Anexo opcional')).toBeInTheDocument()
  })
})

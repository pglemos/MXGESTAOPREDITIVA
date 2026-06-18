import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { PDIAvaliacao360, PDIMeta360, PDIPlanoAcao360, PDISessionSummary } from '@/hooks/usePDI_MX'

const testWindow = globalThis.window as typeof globalThis.window & { TypeError?: typeof TypeError }
if (testWindow?.Event) {
  globalThis.Event = testWindow.Event as typeof globalThis.Event
}
if (testWindow?.CustomEvent) {
  globalThis.CustomEvent = testWindow.CustomEvent as typeof globalThis.CustomEvent
}
if (testWindow?.NodeFilter) {
  globalThis.NodeFilter = testWindow.NodeFilter as typeof globalThis.NodeFilter
}
if (testWindow && !testWindow.TypeError) {
  testWindow.TypeError = TypeError
}
if (!globalThis.getComputedStyle) {
  globalThis.getComputedStyle = (() => ({ animationName: 'none' })) as typeof globalThis.getComputedStyle
}
if (!globalThis.MutationObserver) {
  globalThis.MutationObserver = class {
    observe() {}
    disconnect() {}
    takeRecords() { return [] }
  } as typeof globalThis.MutationObserver
}

let pdisMock: PDISessionSummary[] = []
let vinculoTipoMock: 'loja' | 'autonomo' = 'loja'

const fetchCargos = mock(async () => [])
const fetchTemplate = mock(async () => null)
const fetchSuggestedActions = mock(async () => [])
const saveSessionBundle = mock(async () => 'pdi-auto-1')
const refetchPDI = mock(async () => {})
const createSellerPDIAction = mock(async () => ({ id: 'acao-nova-1', error: null }))
const updateSellerPDIAction = mock(async () => ({ id: 'acao-1', error: null }))
const updateSellerPDIActionStatus = mock(async () => ({ id: 'acao-1', error: null }))
const updateSellerPDIGoals = mock(async () => ({ count: 2, error: null }))
const linkSellerPDIActionContent = mock(async () => ({ id: 'rec-1', error: null }))
const sendSellerPDIActionToCentral = mock(async () => ({ id: 'execution-1', error: null }))

const pdiTemplateMock = {
  escala: [
    { nota: 6, descritor: 'Base', ordem: 1 },
    { nota: 7, descritor: 'Regular', ordem: 2 },
    { nota: 8, descritor: 'Bom', ordem: 3 },
    { nota: 9, descritor: 'Forte', ordem: 4 },
    { nota: 10, descritor: 'Excelente', ordem: 5 },
  ],
  competencias: [
    { id: 'comp-1', nome: 'Planejamento', tipo: 'tecnica' as const, descricao_completa: 'Planeja rotina comercial.', indicador: 'Agenda organizada', ordem: 1, alvo: 10 },
  ],
  frases: [],
}

mock.module('@/hooks/usePDI_MX', () => ({
useMyPDISessions: () => ({
pdis: pdisMock,
loading: false,
refetch: refetchPDI,
}),
  usePDI_MX: () => ({
    cargos: [{ id: 'cargo-1', nome: 'Consultor', nivel: 1, nota_min: 6, nota_max: 10 }],
    template: pdiTemplateMock,
    loading: false,
    error: null,
    fetchCargos,
fetchTemplate,
fetchSuggestedActions,
saveSessionBundle,
createSellerPDIAction,
updateSellerPDIAction,
updateSellerPDIActionStatus,
updateSellerPDIGoals,
linkSellerPDIActionContent,
sendSellerPDIActionToCentral,
}),
}))

mock.module('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'seller-1', name: 'Ana' },
    storeId: null,
    role: 'vendedor',
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
  resolverVinculoTipoVendedor: () => vinculoTipoMock,
  useVendedorPerfil: () => ({
    perfil: {
      tempo_mercado_anos: 5,
      experiencia_declarada: 'especialista',
      cargo_atual: 'Vendedor senior',
    },
    vinculoTipo: vinculoTipoMock,
  }),
}))

const { default: VendedorPDI } = await import('./VendedorPDI')

function avaliacao(input: Partial<PDIAvaliacao360> & { competencia_id: string; competencia: string; nota: number }): PDIAvaliacao360 {
  return {
    alvo: 10,
    gap: 10 - input.nota,
    tipo: 'tecnica',
    ...input,
  }
}

function session(
  id: string,
  date: string,
  avaliacoes: PDIAvaliacao360[],
  overrides: Partial<PDISessionSummary> = {},
): PDISessionSummary {
  return {
    id,
    colaborador_id: 'seller-1',
    gerente_id: 'manager-1',
    loja_id: 'store-1',
    status: 'concluida',
    created_at: `${date}T10:00:00.000Z`,
    data_realizacao: date,
    seller_name: 'Ana',
    manager_name: 'Bruno',
    metas: [],
    avaliacoes,
    plano_acao: [],
    top_5_gaps: [],
    meta_6m: '',
    meta_12m: '',
    meta_24m: '',
    ...overrides,
  }
}

function metasPDI(): PDIMeta360[] {
  return [
    { id: 'meta-curto-1', prazo: '6_meses', tipo: 'profissional', descricao: 'Ser o vendedor número 1 da loja' },
    { id: 'meta-curto-2', prazo: '6_meses', tipo: 'profissional', descricao: 'Atingir R$ 1.200.000 em vendas' },
    { id: 'meta-medio-1', prazo: '12_meses', tipo: 'profissional', descricao: 'Ser Gerente de Vendas' },
    { id: 'meta-longo-1', prazo: '24_meses', tipo: 'profissional', descricao: 'Ser Diretor Comercial' },
  ]
}

function planoAcaoPDI(): PDIPlanoAcao360[] {
  return [
    {
      id: 'acao-1',
      competencia_id: 'prospeccao',
      competencia: 'Prospecção',
      descricao_acao: 'Realizar 10 contatos ativos por dia',
      data_conclusao: '2026-06-30',
      impacto: 'Curto Prazo (1 ano)',
      custo: 'Gestor',
      status: 'Em andamento',
    },
    {
      id: 'acao-2',
      competencia_id: 'fechamento',
      competencia: 'Fechamento de Venda',
      descricao_acao: 'Treinamento: Técnicas de Fechamento',
      data_conclusao: '2026-06-15',
      impacto: 'Curto Prazo (1 ano)',
      custo: 'Gestor',
      status: 'Concluída',
    },
  ]
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/vendedor/pdi']}>
      <VendedorPDI />
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  pdisMock = []
  vinculoTipoMock = 'loja'
  fetchCargos.mockClear()
fetchTemplate.mockClear()
fetchSuggestedActions.mockClear()
saveSessionBundle.mockClear()
refetchPDI.mockClear()
createSellerPDIAction.mockClear()
updateSellerPDIAction.mockClear()
updateSellerPDIActionStatus.mockClear()
updateSellerPDIGoals.mockClear()
linkSellerPDIActionContent.mockClear()
sendSellerPDIActionToCentral.mockClear()
})

describe('VendedorPDI', () => {
  it('organiza o PDI do vendedor na hierarquia aprovada com resumo, lateral, historico e conteudos', () => {
    const avaliacoesAtuais = [
      avaliacao({ competencia_id: 'prospeccao', competencia: 'Prospecção', tipo: 'tecnica', nota: 8.2, origem_nota: 'gestor' }),
      avaliacao({ competencia_id: 'fechamento', competencia: 'Fechamento de Venda', tipo: 'tecnica', nota: 8.3, origem_nota: 'gestor' }),
      avaliacao({ competencia_id: 'lideranca', competencia: 'Liderança', tipo: 'comportamental', nota: 6.8, origem_nota: 'autoavaliacao' }),
      avaliacao({ competencia_id: 'comunicacao', competencia: 'Comunicação', tipo: 'comportamental', nota: 7.6, origem_nota: 'gestor' }),
      avaliacao({ competencia_id: 'organizacao', competencia: 'Organização', tipo: 'comportamental', nota: 7.9, origem_nota: 'gestor' }),
    ]

    pdisMock = [
      session('pdi-2', '2026-06-17', avaliacoesAtuais, {
        proxima_revisao_data: '2026-07-22',
        metas: metasPDI(),
        plano_acao: planoAcaoPDI(),
        top_5_gaps: avaliacoesAtuais.slice(2),
      }),
      session('pdi-1', '2026-05-17', [
        avaliacao({ competencia_id: 'prospeccao', competencia: 'Prospecção', tipo: 'tecnica', nota: 7.2, origem_nota: 'gestor' }),
        avaliacao({ competencia_id: 'fechamento', competencia: 'Fechamento de Venda', tipo: 'tecnica', nota: 7.6, origem_nota: 'gestor' }),
        avaliacao({ competencia_id: 'lideranca', competencia: 'Liderança', tipo: 'comportamental', nota: 6.2, origem_nota: 'autoavaliacao' }),
      ]),
    ]

    renderPage()

    const bodyText = document.body.textContent || ''
    const hierarchy = [
      'Nota geral do PDI',
      'Conquistas',
      'Competências e Desenvolvimento',
      'Plano de Ação',
      'Evolução do PDI',
      'Histórico de avaliações',
      'Conteúdos recomendados para evoluir',
    ]

    const positions = hierarchy.map(label => bodyText.indexOf(label))
    expect(positions.every(position => position >= 0)).toBe(true)
    positions.slice(1).forEach((position, index) => {
      expect(position).toBeGreaterThan(positions[index])
    })

    expect(screen.getByText('Ser o vendedor número 1 da loja')).toBeInTheDocument()
    expect(screen.getByText('Atingir R$ 1.200.000 em vendas')).toBeInTheDocument()
    expect(screen.getByText('Ser Gerente de Vendas')).toBeInTheDocument()
    expect(screen.getByText('Ser Diretor Comercial')).toBeInTheDocument()
    expect(screen.getByText('5 de 12')).toBeInTheDocument()
    expect(screen.getAllByText('Gestor + indicadores').length).toBeGreaterThan(0)
    expect(screen.getByText('Autoavaliação + gestor')).toBeInTheDocument()
    expect(screen.getByText('Competências Técnicas')).toBeInTheDocument()
    expect(screen.getByText('Competências Comportamentais')).toBeInTheDocument()
    expect(screen.getByText('Realizar 10 contatos ativos por dia')).toBeInTheDocument()
    expect(screen.getByText('Treinamento: Técnicas de Fechamento')).toBeInTheDocument()
    for (const header of ['Ação', 'Competência', 'Conquista vinculada', 'Origem', 'Prazo', 'Status', 'Progresso', 'Ações']) {
      expect(screen.getAllByRole('columnheader', { name: header }).length).toBeGreaterThan(0)
    }
    expect(screen.getByText('30/06/2026')).toBeInTheDocument()
    expect(screen.getByText('15/06/2026')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /editar conquistas/i })).toHaveLength(3)
    expect(screen.getByRole('button', { name: /nova ação/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^ver detalhe$/i })).toHaveLength(2)
    expect(screen.getByText('Liderança Situacional na Prática')).toBeInTheDocument()
    expect(screen.getByText(/O PDI orienta desenvolvimento/i)).toBeInTheDocument()
    expect(screen.getAllByText('22/07/2026').length).toBeGreaterThan(0)
  })

  it('renderiza painel de evolucao comparando sessoes por competencia', () => {
    pdisMock = [
      session('pdi-2', '2026-03-10', [
        avaliacao({ competencia_id: 'planejamento', competencia: 'Planejamento', nota: 8 }),
        avaliacao({ competencia_id: 'atendimento', competencia: 'Atendimento', nota: 7 }),
      ]),
      session('pdi-1', '2026-01-10', [
        avaliacao({ competencia_id: 'planejamento', competencia: 'Planejamento', nota: 6 }),
        avaliacao({ competencia_id: 'atendimento', competencia: 'Atendimento', nota: 7 }),
      ]),
    ]

    renderPage()

    const heading = screen.getByRole('heading', { name: /evolução do pdi/i })
    const panel = heading.closest('section')
    expect(panel).not.toBeNull()
    expect(within(panel as HTMLElement).getAllByText('Planejamento').length).toBeGreaterThan(0)
    expect(within(panel as HTMLElement).getAllByText('Evoluindo').length).toBeGreaterThan(0)
    expect(within(panel as HTMLElement).getAllByText('Atendimento').length).toBeGreaterThan(0)
    expect(within(panel as HTMLElement).getAllByText('Estagnado').length).toBeGreaterThan(0)
  })

  it('mostra estado compacto quando nao ha duas sessoes comparaveis', () => {
    pdisMock = [
      session('pdi-1', '2026-01-10', [
        avaliacao({ competencia_id: 'planejamento', competencia: 'Planejamento', nota: 6 }),
      ]),
    ]

    renderPage()

    expect(screen.getByRole('heading', { name: /evolução do pdi/i })).toBeInTheDocument()
    expect(screen.getByText(/evolução disponível quando houver duas sessões avaliadas/i)).toBeInTheDocument()
  })

  it('mostra formulario de autoavaliacao apenas para vendedor autonomo', () => {
    vinculoTipoMock = 'autonomo'

    renderPage()

    expect(screen.getByRole('heading', { name: /autoavaliação/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Nota de Planejamento')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /salvar autoavaliação/i })).toBeInTheDocument()
  })

it('nao mostra formulario de autoavaliacao para vendedor de loja', () => {
vinculoTipoMock = 'loja'

renderPage()

expect(screen.queryByRole('heading', { name: /autoavaliação/i })).not.toBeInTheDocument()
expect(screen.queryByRole('button', { name: /salvar autoavaliação/i })).not.toBeInTheDocument()
})

it('salva nova acao do PDI em vez de apenas fechar o modal', async () => {
const avaliacoesAtuais = [
avaliacao({ competencia_id: 'prospeccao', competencia: 'Prospecção', tipo: 'tecnica', nota: 8.2, origem_nota: 'gestor' }),
]
pdisMock = [
session('pdi-2', '2026-06-17', avaliacoesAtuais, {
metas: metasPDI(),
plano_acao: planoAcaoPDI(),
top_5_gaps: avaliacoesAtuais,
}),
]

renderPage()

fireEvent.click(screen.getByRole('button', { name: /nova ação/i }))
const titleInput = screen.getByLabelText(/título da ação/i)
fireEvent.change(titleInput, { target: { value: 'Criar rotina de prospecção ativa' } })
;(titleInput as HTMLInputElement).setAttribute('value', 'Criar rotina de prospecção ativa')
const prazoInput = screen.getByLabelText(/^prazo$/i)
fireEvent.change(prazoInput, { target: { value: '2026-07-10' } })
;(prazoInput as HTMLInputElement).setAttribute('value', '2026-07-10')
fireEvent.click(screen.getByRole('button', { name: /^salvar ação$/i }))

await waitFor(() => {
expect(createSellerPDIAction).toHaveBeenCalledWith(expect.objectContaining({
sessaoId: 'pdi-2',
competenciaId: 'prospeccao',
descricaoAcao: 'Criar rotina de prospecção ativa',
dataConclusao: '2026-07-10',
}))
})
expect(refetchPDI).toHaveBeenCalled()
})

it('executa acoes do detalhe do PDI com persistencia', async () => {
const avaliacoesAtuais = [
avaliacao({ competencia_id: 'prospeccao', competencia: 'Prospecção', tipo: 'tecnica', nota: 8.2, origem_nota: 'gestor' }),
]
pdisMock = [
session('pdi-2', '2026-06-17', avaliacoesAtuais, {
metas: metasPDI(),
plano_acao: planoAcaoPDI(),
top_5_gaps: avaliacoesAtuais,
}),
]

renderPage()

fireEvent.click(screen.getAllByRole('button', { name: /^ver detalhe$/i })[0])
fireEvent.change(screen.getByLabelText(/justificativa/i), { target: { value: 'Carteira atrasou retorno.' } })
fireEvent.click(screen.getByRole('button', { name: /justificar atraso/i }))

await waitFor(() => {
expect(updateSellerPDIActionStatus).toHaveBeenCalledWith({
actionId: 'acao-1',
status: 'justificada',
justificativa: 'Carteira atrasou retorno.',
})
})

fireEvent.click(screen.getAllByRole('button', { name: /^ver detalhe$/i })[0])
fireEvent.click(screen.getByRole('button', { name: /vincular conteúdo/i }))
fireEvent.click(screen.getByRole('button', { name: /enviar para central de execução/i }))

await waitFor(() => {
expect(linkSellerPDIActionContent).toHaveBeenCalledWith('acao-1')
expect(sendSellerPDIActionToCentral).toHaveBeenCalledWith('acao-1')
})
})
})

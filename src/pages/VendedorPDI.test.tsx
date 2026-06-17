import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { PDIAvaliacao360, PDISessionSummary } from '@/hooks/usePDI_MX'

let pdisMock: PDISessionSummary[] = []
let vinculoTipoMock: 'loja' | 'autonomo' = 'loja'

const fetchCargos = mock(async () => [])
const fetchTemplate = mock(async () => null)
const fetchSuggestedActions = mock(async () => [])
const saveSessionBundle = mock(async () => 'pdi-auto-1')

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

function session(id: string, date: string, avaliacoes: PDIAvaliacao360[]): PDISessionSummary {
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
  }
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
})

describe('VendedorPDI', () => {
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

    const heading = screen.getByRole('heading', { name: /evolução das notas/i })
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

    expect(screen.getByRole('heading', { name: /evolução das notas/i })).toBeInTheDocument()
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
})

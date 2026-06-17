import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'

const setPerfil = mock(() => {})
const savePerfil = mock(async () => ({ error: null }))
let vinculoTipoMock: 'loja' | 'autonomo' = 'loja'

mock.module('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: {
      name: 'Vendedor Teste',
      email: 'vendedor@mx.test',
      phone: '(31) 99999-0000',
      avatar_url: null,
    },
  }),
}))

mock.module('@/features/vendedor-home/hooks/useVendedorHomePage', () => ({
  useVendedorHomePage: () => ({
    metrics: { meta: 8, vendasMes: 3 },
    remuneracaoEstimada: {
      disponivel: true,
      comissao: 1200,
      bonus: 300,
      total: 4500,
    },
    treinamentos: [{ watched: true }, { watched: false }],
    discipline: { percentage: 80 },
  }),
}))

mock.module('@/features/crm/hooks/useMeuScore', () => ({
  useMeuScore: () => ({
    score: { value: 82, band: 'excellent' },
    bandLabel: { excellent: 'Excelente' },
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
  VENDEDOR_EXPERIENCIA_DECLARADA: ['sem_experiencia', 'iniciante', 'intermediario', 'experiente', 'especialista'],
  VENDEDOR_EXPERIENCIA_LABEL: {
    sem_experiencia: 'Sem experiência',
    iniciante: 'Iniciante',
    intermediario: 'Intermediário',
    experiente: 'Experiente',
    especialista: 'Especialista',
  },
  derivarNivelMaturidadeVendedor: () => 'N4',
  useVendedorPerfil: () => ({
    perfil: {
      hora_entrada: '08:00',
      hora_almoco_inicio: '12:00',
      hora_almoco_fim: '13:00',
      hora_saida: '18:00',
      dias_trabalho: ['seg', 'ter', 'qua', 'qui', 'sex'],
      fechar_dia_notificacao_ativa: true,
      fechar_dia_notificacao_hora: '18:00',
      objetivo_curto: 'Bater meta',
      objetivo_medio: 'Virar referência',
      objetivo_longo: 'Liderar equipe',
      carreira_interesse: 'disponivel',
      pretensao_min: 5000,
      pretensao_max: 7000,
      cargos_interesse: 'Gerente',
      cidades_interesse: 'Belo Horizonte',
      tempo_mercado_anos: 5,
      experiencia_declarada: 'especialista',
      cargo_atual: 'Vendedor',
      mix_canal_internet_pct: 70,
      mix_canal_carteira_pct: 20,
      mix_canal_porta_pct: 10,
    },
    vinculoTipo: vinculoTipoMock,
    setPerfil,
    loading: false,
    savePerfil,
  }),
}))

const { MeuPerfilVendedor } = await import('./MeuPerfilVendedor.container')

afterEach(() => {
  cleanup()
  setPerfil.mockClear()
  savePerfil.mockClear()
  vinculoTipoMock = 'loja'
})

describe('MeuPerfilVendedor', () => {
  it('oculta oportunidades de carreira para vendedor de loja', () => {
    render(<MeuPerfilVendedor />)

    expect(screen.getByRole('heading', { name: /meu perfil/i })).toBeInTheDocument()
    expect(screen.getByText(/minha rotina/i)).toBeInTheDocument()
    expect(screen.getByText(/minha remuneração/i)).toBeInTheDocument()
    expect(screen.getByText(/maturidade comercial/i)).toBeInTheDocument()
    expect(screen.getByText(/mix de canais/i)).toBeInTheDocument()
    expect(screen.getByText(/N4 — Alta Performance/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Vendedor')).toBeInTheDocument()
    expect(screen.getByDisplayValue('70')).toBeInTheDocument()
    expect(screen.getByDisplayValue('20')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()

    expect(screen.queryByText(/oportunidades de carreira/i)).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/Gerente comercial/i)).not.toBeInTheDocument()
  })

  it('exibe oportunidades de carreira para vendedor autonomo', () => {
    vinculoTipoMock = 'autonomo'

    render(<MeuPerfilVendedor />)

    expect(screen.getByText(/autônomo/i)).toBeInTheDocument()
    expect(screen.getByText(/oportunidades de carreira/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /disponibilidade/i })).toHaveValue('disponivel')
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('7000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Gerente')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Belo Horizonte')).toBeInTheDocument()
  })
})

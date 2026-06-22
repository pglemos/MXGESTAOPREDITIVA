import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const setPerfil = mock(() => {})
const savePerfil = mock(async () => ({ error: null }))
let vinculoTipoMock: 'loja' | 'autonomo' = 'loja'

const perfilBase = {
  hora_entrada: '08:00',
  hora_almoco_inicio: '12:00',
  hora_almoco_fim: '13:00',
  hora_saida: '18:00',
  dias_trabalho: ['seg', 'ter', 'qua', 'qui', 'sex'],
  fechar_dia_notificacao_ativa: true,
  fechar_dia_notificacao_hora: '17:45',
  objetivo_curto: 'Bater meta',
  objetivo_medio: 'Virar referencia',
  objetivo_longo: 'Liderar equipe',
  carreira_interesse: 'disponivel',
  pretensao_min: 5000,
  pretensao_max: 7000,
  cargos_interesse: 'Gerente',
  cidades_interesse: 'Belo Horizonte',
  tempo_mercado_anos: 5,
  experiencia_declarada: 'especialista',
  cargo_atual: 'Vendedor',
  vinculo_tipo: null,
  mix_canal_internet_pct: 35,
  mix_canal_carteira_pct: 45,
  mix_canal_porta_pct: 20,
}

let perfilMock = { ...perfilBase }

mock.module('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: {
      name: 'Vendedor Teste',
      email: 'vendedor@mx.test',
      phone: '(31) 99999-0000',
      avatar_url: null,
      created_at: '2026-01-10T12:00:00.000Z',
    },
    membership: {
      store: {
        name: 'MX Consultoria - Loja BH',
        manager_email: 'gestor@mx.test',
      },
    },
  }),
}))

mock.module('@/features/vendedor-home/hooks/useVendedorHomePage', () => ({
  useVendedorHomePage: () => ({
    metrics: { meta: 100, vendasMes: 2 },
    remuneracaoEstimada: {
      disponivel: true,
      comissaoPorVenda: 0,
      comissaoCategoria: 0,
      comissao: 0,
      bonus: 0,
      total: 4800,
    },
    treinamentos: [{ watched: true }, { watched: false }],
    discipline: { percentage: 80 },
  }),
}))

mock.module('@/features/crm/hooks/useMeuScore', () => ({
  BAND_LABEL: {
    elite: 'Elite MX',
    excellent: 'Excelente',
    good: 'Bom',
    attention: 'Atenção',
    critical: 'Crítico',
    regular: 'Regular',
  },
  NEXT_BAND: {
    critical: 'Atenção',
    attention: 'Bom',
    good: 'Excelente',
    excellent: 'Elite MX',
    elite: 'Elite MX',
    regular: 'Regular',
  },
  useMeuScore: () => ({
    score: { value: 40, band: 'regular' },
    bandLabel: { regular: 'Regular' },
  }),
}))

mock.module('@/features/crm/hooks/useVendedorPerfil', () => ({
  DIAS_SEMANA: [
    { code: 'seg', label: 'Seg' },
    { code: 'ter', label: 'Ter' },
    { code: 'qua', label: 'Qua' },
    { code: 'qui', label: 'Qui' },
    { code: 'sex', label: 'Sex' },
    { code: 'sab', label: 'Sáb' },
  ],
  MATURIDADE_VENDEDOR_LABEL: {
    N1: 'N1 - Iniciante',
    N2: 'N2 - Intermediário',
    N3: 'N3 - Performance',
    N4: 'N4 - Alta Performance',
  },
  VENDEDOR_EXPERIENCIA_DECLARADA: ['iniciante', 'intermediario', 'avancado', 'especialista'],
  VENDEDOR_EXPERIENCIA_LABEL: {
    iniciante: 'Iniciante',
    intermediario: 'Intermediário',
    avancado: 'Avançado',
    especialista: 'Especialista',
  },
  derivarNivelMaturidadeVendedor: () => 'N1',
  useVendedorPerfil: () => ({
    perfil: perfilMock,
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
  perfilMock = { ...perfilBase }
})

describe('MeuPerfilVendedor', () => {
  it('renderiza a hierarquia final aprovada para vendedor vinculado a loja', () => {
    render(<MemoryRouter><MeuPerfilVendedor /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: /meu perfil/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /histórico de alterações/i })).toBeInTheDocument()

    const hierarchy = [
      '1. Identidade profissional',
      '2. Resumo comercial',
      '3. Minha rotina',
      '4. Meus objetivos',
      '5. Mix de canais',
      '6. Produtos e categorias',
      '7. Minha remuneração',
      '8. Minha formação',
      '9. Maturidade comercial',
      '10. Meu histórico',
      '11. Currículo profissional',
      '12. Oportunidades de carreira',
    ]

    const pageText = document.body.textContent || ''
    const positions = hierarchy.map(title => pageText.indexOf(title))

    expect(positions.every(position => position >= 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
    expect(screen.queryByText(/minhas metas/i)).not.toBeInTheDocument()

    expect(screen.getByText(/Perfil vinculado à loja/i)).toBeInTheDocument()
    expect(screen.getByText(/Esses horários alimentam Central de Execução/i)).toBeInTheDocument()
    expect(screen.getByText(/Sincronizado com PDI/i)).toBeInTheDocument()
    expect(screen.getByText(/O Mix de Canais alimenta o Funil de Vendas/i)).toBeInTheDocument()
    expect(screen.getByText(/Essas informações influenciam comissão, funil e histórico profissional/i)).toBeInTheDocument()
    expect(screen.getByText(/Plano herdado da loja/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /configurar modelo/i })).toBeDisabled()
    expect(screen.getByText(/Mercado de Trabalho não está habilitado/i)).toBeInTheDocument()
    expect(screen.getByText(/Seus dados são protegidos/i)).toBeInTheDocument()
  })

  it('habilita oportunidades e configuracao de comissao para vendedor autonomo', () => {
    vinculoTipoMock = 'autonomo'
    perfilMock = { ...perfilBase, carreira_interesse: 'disponivel' }

    render(<MemoryRouter><MeuPerfilVendedor /></MemoryRouter>)

    expect(screen.getByText(/Vendedor autônomo/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Perfil autônomo/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Mercado de Trabalho habilitado para perfil autônomo/i)).toBeInTheDocument()
    expect(screen.queryByText(/Mercado de Trabalho não está habilitado/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Sim, estou disponível para o mercado/i)).toBeEnabled()
    expect(screen.getByRole('button', { name: /configurar modelo/i })).toBeEnabled()
    expect(screen.getByDisplayValue('R$ 5.000 - R$ 7.000')).toBeInTheDocument()
  })

  it('salva oportunidades de carreira do vendedor autonomo', async () => {
    vinculoTipoMock = 'autonomo'

    render(<MemoryRouter><MeuPerfilVendedor /></MemoryRouter>)

    const saveButtons = screen.getAllByRole('button', { name: /^salvar$/i })
    fireEvent.click(saveButtons[saveButtons.length - 1])

    await waitFor(() => {
      expect(savePerfil).toHaveBeenCalledWith({})
    })
  })
})

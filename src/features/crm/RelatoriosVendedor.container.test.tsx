import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
// P0-05b (auditoria 2026-07-10): capturado ANTES do mock.module abaixo para
// reusar a implementação real de buildOportunidadePayload em vez de manter
// uma cópia duplicada — uma cópia hand-rolled desatualizada aqui já fez o
// teste unitário de useOportunidades.test.ts rodar contra uma versão obsoleta
// (sem placa_veiculo/data_entrega_prevista) quando executado junto com este
// arquivo, mascarando o bug real de P1-05/P0-05a.
import { buildOportunidadePayload } from '@/features/crm/hooks/useOportunidades'

mock.module('@/features/crm/hooks/useClientes', () => ({
  buildClientePayload: (
    input: {
      nome: string
      telefone?: string | null
      canal_origem?: string | null
      proxima_acao?: string | null
      proxima_acao_em?: string | null
    },
    context: { lojaId: string; sellerUserId: string },
    now: Date = new Date(),
  ) => {
    const proximaAcaoManual = input.proxima_acao?.trim() || null
    const dateOnly = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now)
    return {
      loja_id: context.lojaId,
      seller_user_id: context.sellerUserId,
      nome: input.nome.trim(),
      telefone: input.telefone?.trim() || null,
      canal_origem: input.canal_origem || null,
      status: 'aguardando_contato',
      relacionamento: 'neutro',
      proxima_acao: proximaAcaoManual || 'Enviar mensagem 1 de primeiro contato',
      proxima_acao_em: input.proxima_acao_em || (!proximaAcaoManual ? dateOnly : null),
      ultima_interacao: dateOnly,
    }
  },
  useClientes: () => ({
    clientes: [{ id: 'cliente-1' }],
    metrics: {
      total: 1,
      ativos: 1,
      oportunidades: 0,
      posVenda: 0,
      aguardando: 0,
      inativos: 0,
      potencialTotal: 0,
    },
  }),
}))

mock.module('@/features/crm/hooks/useOportunidades', () => ({
  buildOportunidadePayload,
  useOportunidades: () => ({
    oportunidades: [],
    funil: {
      porEtapa: [
        { etapa: 'prospeccao', quantidade: 1, valor: 100000 },
        { etapa: 'ganho', quantidade: 1, valor: 100000 },
      ],
      ganhos: { etapa: 'ganho', quantidade: 1, valor: 100000 },
      perdidos: { etapa: 'perdido', quantidade: 0, valor: 0 },
      taxaConversaoGeral: 50,
      ticketMedio: 100000,
      valorTotalFunil: 100000,
      totalOportunidades: 2,
      stagesComConversao: [],
    },
  }),
}))

mock.module('@/features/crm/hooks/useAtendimentos', () => ({
  useAtendimentos: () => ({
    porCanal: {
      showroom: 1,
      carteira: 0,
      internet: 1,
      porta: 0,
      total: 2,
    },
  }),
}))

mock.module('@/features/crm/hooks/useAgendamentos', () => ({
  useAgendamentos: () => ({
    metrics: {
      agendamentosHoje: 1,
      compareceram: 0,
      naoCompareceram: 0,
      confirmados: 0,
      aguardando: 1,
      emNegociacao: 0,
      vendasRealizadas: 0,
      taxaComparecimento: 0,
    },
  }),
}))

mock.module('@/features/crm/hooks/useCadenciaAnalytics', () => ({
  useCadenciaAnalytics: () => ({
    loading: false,
    error: null,
    analytics: {
      totalEstados: 2,
      gargalos: [
        {
          etapa: 'agendamento',
          total: 2,
          pendentes: 2,
          concluidos: 0,
          cancelados: 0,
          semSucesso: 1,
          aguardando: 1,
          reagendamentosSemSucesso: 3,
        },
      ],
      demandaVeiculos: [
        { tipo_veiculo: 'carro', quantidade: 2, valorTotal: 190000 },
      ],
      conversaoPorFluxo: [
        {
          fluxo_id: 'fluxo-internet',
          fluxo_version: 1,
          totalClientes: 2,
          ganhos: 1,
          taxaConversao: 50,
          valorGanho: 120000,
        },
      ],
    },
  }),
}))

const { RelatoriosVendedor } = await import('./RelatoriosVendedor.container')

afterEach(() => cleanup())

describe('RelatoriosVendedor', () => {
  it('renderiza analytics de cadencia com gargalo, demanda e conversao', () => {
    render(<RelatoriosVendedor />)

    expect(screen.getByText('Analytics de cadência')).toBeTruthy()
    expect(screen.getByText('Gargalos por etapa')).toBeTruthy()
    expect(screen.getByText('Agendamento')).toBeTruthy()
    expect(screen.getByText('Demanda por veículo')).toBeTruthy()
    expect(screen.getByText('Carro')).toBeTruthy()
    expect(screen.getByText('Conversão por fluxo')).toBeTruthy()
    expect(screen.getByText('50% · 1/2')).toBeTruthy()
  })
})

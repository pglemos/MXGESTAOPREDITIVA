import React from 'react'
import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { deriveRegularizacaoCrmMetrics } from '../lib/clientes-list-from-crm'

mock.module('@/hooks/useAuth', () => ({
  useAuth: () => ({ supabaseUser: { id: 'seller-1' }, profile: { id: 'seller-1' }, activeStoreId: 'store-1', storeId: 'store-1' }),
}))

mock.module('@/features/crm/hooks/useClientes', () => ({
  useClientes: () => ({ clientes: [], createCliente: mock(async () => ({ error: null, id: 'cliente-1' })), updateCliente: mock(async () => ({ error: null })) }),
}))

mock.module('@/features/crm/hooks/useOportunidades', () => ({
  useOportunidades: () => ({ oportunidades: [], createOportunidade: mock(async () => ({ error: null })), updateOportunidade: mock(async () => ({ error: null })), updateMotivoPerda: mock(async () => ({ error: null })), deleteOportunidade: mock(async () => ({ error: null })), refetch: mock(async () => {}) }),
}))

mock.module('@/features/crm/hooks/useAgendamentos', () => ({
  useAgendamentos: () => ({ agendamentos: [], createAgendamento: mock(async () => ({ error: null })), updateAgendamento: mock(async () => ({ error: null })), deleteAgendamento: mock(async () => ({ error: null })), refetch: mock(async () => {}) }),
}))

const { RegularizarFechamentoDrawer } = await import('./RegularizarFechamentoDrawer')

afterEach(cleanup)

describe('RegularizarFechamentoDrawer', () => {
  it('permite enviar os dados preenchidos para aprovação do gerente antes da aplicação', () => {
    render(
      <MemoryRouter>
        <RegularizarFechamentoDrawer
        date="2026-07-09"
        finalized={false}
        formValues={{
          leads_cart: 1,
          leads_net: 0,
          visitas_porta: 2,
          visitas_cart: 0,
          visitas_net: 0,
          agd_cart: 1,
          agd_net: 0,
          vnd_porta: 0,
          vnd_cart: 0,
          vnd_net: 0,
        }}
        onFieldChange={() => {}}
        saving={false}
        onVoltar={() => {}}
        onClose={() => {}}
        onSubmit={() => {}}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText(/nenhum lançamento será aplicado antes da aprovação/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Solicitar aprovação do gerente/i })).toBeEnabled()
    expect(screen.getAllByRole('button', { name: '+' })[0]).toBeEnabled()
    expect(screen.getAllByText('Vendas')).toHaveLength(1)
    expect(screen.queryByText('Motivo do Ajuste')).toBeNull()
  })

  // MX-22.3 (AC-5; Spec §1.3/§8.4/FEV-DATA-10): "Observações Operacionais
  // (Justificativa)" foi removida em cc338e13 — este é o teste de regressão
  // que faltava no ARQUIVO CERTO (renderiza de verdade, não só checa a
  // string-fonte). Motivo do catálogo (ADJUSTMENT_REASONS) é o único campo
  // obrigatório; o campo distinto e legítimo "checkin-note" pertence ao
  // formulário principal (CheckinForm.tsx) e não existe neste drawer.
  it('não renderiza o campo Observações Operacionais (Justificativa) removido (§8.4)', () => {
    render(
      <MemoryRouter>
        <RegularizarFechamentoDrawer
        date="2026-07-09"
        finalized={false}
        formValues={{
          leads_cart: 1,
          leads_net: 0,
          visitas_porta: 2,
          visitas_cart: 0,
          visitas_net: 0,
          agd_cart: 1,
          agd_net: 0,
          vnd_porta: 0,
          vnd_cart: 0,
          vnd_net: 0,
        }}
        onFieldChange={() => {}}
        saving={false}
        onVoltar={() => {}}
        onClose={() => {}}
        onSubmit={() => {}}
        />
      </MemoryRouter>,
    )

    expect(screen.queryByText(/Observações Operacionais \(Justificativa\)/i)).toBeNull()
    expect(screen.queryByLabelText(/Justificativa/i)).toBeNull()
    expect(screen.queryByText(/checkin-note/i)).toBeNull()
  })

  it('deriva vendas do CRM e interpreta D+1 usando a data regularizada quando o fechamento está pendente', () => {
    const metrics = deriveRegularizacaoCrmMetrics(
      [
        {
          id: 'op-d1',
          cliente_id: 'cliente-d1',
          seller_user_id: 'seller-1',
          veiculo_interesse: 'SUV',
          valor_negociado: 100000,
          etapa: 'em_negociacao',
          canal: 'carteira',
          sinal: 0,
          financiamento: 'nao_aplica',
          carro_avaliado: false,
          motivo_perda: null,
          created_at: '2026-07-15T10:00:00-03:00',
          data_competencia: '2026-07-15',
          cliente: { nome: 'Cliente D+1', telefone: null },
        },
        {
          id: 'op-venda',
          cliente_id: 'cliente-venda',
          seller_user_id: 'seller-1',
          veiculo_interesse: 'Hatch',
          valor_negociado: 80000,
          etapa: 'ganho',
          canal: 'internet',
          sinal: 0,
          financiamento: 'nao_aplica',
          carro_avaliado: false,
          motivo_perda: null,
          created_at: '2026-07-14T10:00:00-03:00',
          data_competencia: '2026-07-14',
          cliente: { nome: 'Cliente Venda', telefone: null },
        },
      ],
      [
        {
          id: 'agenda-d1',
          oportunidade_id: 'op-d1',
          data_hora: '2026-07-15T14:00:00-03:00',
          canal: 'carteira',
          status: 'aguardando',
          observacoes: null,
        },
      ],
      '2026-07-14',
      { fechamentoPendente: true },
    )

    expect(metrics.vendas.total).toBe(1)
    expect(metrics.vendas.internet).toBe(1)
    expect(metrics.agendamentosD1).toEqual({ carteira: 1, internet: 0, total: 1 })
    expect(metrics.creditosValidos).toBe(1)
  })
})

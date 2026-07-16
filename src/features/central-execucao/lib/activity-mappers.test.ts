import { describe, expect, test } from 'bun:test'
import { mapExecutionActionRow } from './activity-mappers'

describe('mapExecutionActionRow', () => {
  test('preserva vínculos, snapshots e dados relacionados', () => {
    const mapped = mapExecutionActionRow({
      id: 'action-1',
      store_id: 'store-1',
      seller_id: 'seller-1',
      source_type: 'agendamento',
      source_id: 'appointment-1',
      cliente_id: 'client-1',
      oportunidade_id: 'opportunity-1',
      agendamento_id: 'appointment-1',
      evento_id: null,
      activity_type: 'retorno',
      title: 'Retorno - Maria',
      description: 'Confirmar proposta',
      objective: 'Avançar para negociação',
      due_at: '2026-07-16T15:00:00-03:00',
      status: 'pendente',
      priority: 'high',
      priority_rank: 2,
      alert_tone: 'warning',
      result_code: null,
      result_note: null,
      origin_module: 'crm',
      active: true,
      automatic: true,
      manager_required: false,
      escalation_reason: null,
      manager_id: null,
      escalated_at: null,
      completed_at: null,
      client_name_snapshot: 'Maria Snapshot',
      phone_snapshot: '31999999999',
      vehicle_snapshot: 'Onix 2024',
      metadata: { channel: 'internet' },
      created_at: '2026-07-16T10:00:00-03:00',
      updated_at: '2026-07-16T10:00:00-03:00',
      cliente: {
        id: 'client-1',
        nome: 'Maria da Silva',
        telefone: '(31) 99999-9999',
        canal_origem: 'internet',
        status: 'oportunidade',
        proxima_acao: 'Ligar novamente',
        proxima_acao_em: '2026-07-17',
      },
      oportunidade: {
        id: 'opportunity-1',
        cliente_id: 'client-1',
        veiculo_interesse: 'Onix 2024',
        valor_negociado: 85000,
        etapa: 'negociacao',
        financiamento: 'pendente',
        carro_avaliado: true,
        sinal: 1000,
        motivo_perda: null,
      },
      agendamento: {
        id: 'appointment-1',
        cliente_id: 'client-1',
        oportunidade_id: 'opportunity-1',
        data_hora: '2026-07-16T15:00:00-03:00',
        tipo: 'retorno',
        status: 'aguardando',
        canal: 'internet',
        observacoes: 'Cliente pediu retorno à tarde',
      },
    })

    expect(mapped.activityType).toBe('retorno')
    expect(mapped.client?.nome).toBe('Maria da Silva')
    expect(mapped.opportunity?.valor_negociado).toBe(85000)
    expect(mapped.appointment?.tipo).toBe('retorno')
    expect(mapped.snapshots).toEqual({
      name: 'Maria Snapshot',
      phone: '31999999999',
      vehicle: 'Onix 2024',
    })
    expect(mapped.metadata).toEqual({ channel: 'internet' })
  })

  test('infere tipo legado pela origem sem fabricar relacionamento', () => {
    const mapped = mapExecutionActionRow({
      id: 'legacy-1',
      store_id: null,
      seller_id: 'seller-1',
      source_type: 'pdi',
      source_id: 'pdi-1',
      cliente_id: null,
      oportunidade_id: null,
      agendamento_id: null,
      evento_id: null,
      activity_type: null,
      title: 'Treinar abordagem',
      description: null,
      objective: null,
      due_at: '2026-07-16T09:00:00-03:00',
      status: 'em_andamento',
      priority: 'medium',
      priority_rank: 5,
      alert_tone: 'info',
      result_code: null,
      result_note: null,
      origin_module: 'pdi',
      active: true,
      automatic: false,
      manager_required: false,
      escalation_reason: null,
      manager_id: null,
      escalated_at: null,
      completed_at: null,
      client_name_snapshot: null,
      phone_snapshot: null,
      vehicle_snapshot: null,
      metadata: null,
      created_at: '2026-07-16T08:00:00-03:00',
      updated_at: '2026-07-16T08:00:00-03:00',
      cliente: null,
      oportunidade: null,
      agendamento: null,
    })

    expect(mapped.activityType).toBe('pdi')
    expect(mapped.client).toBeNull()
    expect(mapped.opportunity).toBeNull()
    expect(mapped.appointment).toBeNull()
    expect(mapped.metadata).toEqual({})
  })
})

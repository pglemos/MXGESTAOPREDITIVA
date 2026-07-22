import { describe, expect, test } from 'bun:test'
import {
  mapMxClientToCarteiraVisual,
  selectActiveOpportunity,
  selectRelevantAppointment,
  situationToStage,
} from './carteira-mappers'

describe('carteira normalized mappers', () => {
  test('selects the newest active opportunity instead of the first relation row', () => {
    const result = selectActiveOpportunity([
      { id: 'closed', etapa: 'perdido', updated_at: '2026-07-16T12:00:00Z' },
      { id: 'old-active', etapa: 'qualificacao', updated_at: '2026-07-14T12:00:00Z' },
      { id: 'current-active', etapa: 'negociacao', updated_at: '2026-07-16T11:00:00Z' },
    ])

    expect(result?.id).toBe('current-active')
  })

  test('selects the nearest open appointment and ignores completed appointments', () => {
    const result = selectRelevantAppointment([
      { id: 'completed', status: 'compareceu', data_hora: '2026-07-16T09:00:00Z' },
      { id: 'later', status: 'confirmado', data_hora: '2026-07-18T09:00:00Z' },
      { id: 'next', status: 'aguardando', data_hora: '2026-07-17T09:00:00Z' },
    ], new Date('2026-07-16T12:00:00Z'))

    expect(result?.id).toBe('next')
  })

  test('maps normalized records to the visual Base44 contract without duplicating identity', () => {
    const result = mapMxClientToCarteiraVisual({
      id: 'client-1',
      loja_id: 'store-1',
      seller_user_id: 'seller-1',
      nome: 'Maria Silva',
      telefone: '31999999999',
      canal_origem: 'internet',
      status: 'oportunidade',
      proxima_acao: 'Confirmar visita',
      proxima_acao_em: '2026-07-17',
      oportunidades: [{
        id: 'op-1',
        etapa: 'negociacao',
        veiculo_interesse: 'Corolla',
        financiamento: 'pendente',
        updated_at: '2026-07-16T10:00:00Z',
      }],
      agendamentos: [{
        id: 'appointment-1',
        status: 'confirmado',
        data_hora: '2026-07-17T15:00:00Z',
      }],
    }, new Date('2026-07-16T12:00:00Z'))

    expect(result.id).toBe('client-1')
    expect(result.oportunidade_id).toBe('op-1')
    expect(result.agendamento_id).toBe('appointment-1')
    expect(result.veiculo_interesse).toBe('Corolla')
    expect(result.situacao_atual).toBe('Visita agendada')
    expect(result.temperatura).toBe('Quente')
  })

  test('advances the funil stage for every "sit" label produced by proximoPassoLib.TRANSICAO', () => {
    // Regressão: essas oito etapas caíam no default 'prospeccao' — a mesma
    // etapa em que a oportunidade já estava — porque nenhum substring do
    // heurístico batia com o texto exato. Resultado: registrar "Cliente
    // respondeu" no primeiro passo não movia a esteira.
    expect(situationToStage({ situacao_atual: 'Cliente respondeu' })).toBe('qualificacao')
    expect(situationToStage({ situacao_atual: 'Cliente quente sem visita' })).toBe('apresentacao')
    expect(situationToStage({ situacao_atual: 'Vai pensar' })).toBe('negociacao')
    expect(situationToStage({ situacao_atual: 'Não compareceu' })).toBe('apresentacao')
    expect(situationToStage({ situacao_atual: 'Visita realizada' })).toBe('apresentacao')
    expect(situationToStage({ situacao_atual: 'Aguardando ação do vendedor' })).toBe('negociacao')
    expect(situationToStage({ situacao_atual: 'Em cadência sem resposta' })).toBe('prospeccao')
  })

  test('status_comercial still wins over the situação text for terminal stages', () => {
    expect(situationToStage({ situacao_atual: 'Cliente respondeu', status_comercial: 'Vendido' })).toBe('ganho')
    expect(situationToStage({ situacao_atual: 'Oportunidade futura', status_comercial: 'Perdido' })).toBe('perdido')
  })

  test('falls back to the substring heuristic for situações outside the known table', () => {
    expect(situationToStage({ situacao_atual: 'Financiamento em análise pelo banco' })).toBe('negociacao')
    expect(situationToStage({ situacao_atual: 'Algo totalmente novo e desconhecido' })).toBe('prospeccao')
  })

})

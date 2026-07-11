import { describe, expect, it } from 'bun:test'
import { eventoDeCriacaoParaTipo } from './useAgendamentos'
import { CRM_AGENDAMENTO_TIPO, type CrmAgendamentoTipo } from '@/lib/schemas/crm.schema'

// 2.2.4 (auditoria 2026-07-10) — "garantia não reabre venda": a criação de um
// agendamento de garantia gera o evento comercial 'garantia_registrada', um
// fato pós-venda isolado — nunca 'venda_realizada' nem qualquer evento que
// mexa na etapa da oportunidade já ganha. Ver também CentralExecucao
// .container.test.tsx > "garantia não reabre venda", que prova o mesmo
// contrato na camada de UI (createAgendamento chamado, updateOportunidade não).
describe('eventoDeCriacaoParaTipo', () => {
  it('garantia gera garantia_registrada, não um evento de venda/compromisso futuro', () => {
    expect(eventoDeCriacaoParaTipo('garantia')).toBe('garantia_registrada')
  })

  it('pós-venda gera pos_venda_realizado (fato já realizado, não compromisso futuro)', () => {
    expect(eventoDeCriacaoParaTipo('pos_venda')).toBe('pos_venda_realizado')
  })

  it('demais tipos (visita, retorno, test_drive, entrega, negociação) geram agendamento_criado', () => {
    const demais: CrmAgendamentoTipo[] = CRM_AGENDAMENTO_TIPO.filter(t => t !== 'garantia' && t !== 'pos_venda')
    for (const tipo of demais) {
      expect(eventoDeCriacaoParaTipo(tipo)).toBe('agendamento_criado')
    }
  })
})

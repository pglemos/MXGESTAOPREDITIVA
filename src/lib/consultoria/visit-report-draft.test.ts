import { describe, expect, it } from 'bun:test'
import { formatVisitDraftForGroup } from './visit-report-draft'

describe('visit report draft formatter', () => {
  it('uses the typed visit draft as the source for the group summary', () => {
    const message = formatVisitDraftForGroup({
      draft: 'Validamos o novo plano de remuneracao com o gerente. Pendente implementar a rotina do vendedor. Ponto de atencao: leads sem acompanhamento diario.',
      clientName: 'G&A Veiculos',
      visitNumber: 3,
      objective: 'Plano de remuneracao',
      visitDate: '2026-05-05',
      completedTasks: ['Checklist antigo concluido'],
      pendingTasks: ['Tarefa generica pendente'],
    })

    expect(message).toContain('RELATÓRIO DE VISITA TÉCNICA - MÉTODO MX')
    expect(message).toContain('Empresa: G&A Veiculos')
    expect(message).toContain('🎯 OBJETIVO DA REUNIÃO')
    expect(message).toContain('Plano de remuneracao')
    expect(message).toContain('Validamos o novo plano de remuneracao com o gerente')
    expect(message).toContain('Pendente implementar a rotina do vendedor')
    expect(message).toContain('leads sem acompanhamento diario')
    expect(message).not.toContain('Tarefa generica pendente')
    expect(message).toContain('📱 TEXTO PARA ENVIAR NO GRUPO DE WHATSAPP DA LOJA')
  })

  it('falls back to checklist items when the draft is empty', () => {
    const message = formatVisitDraftForGroup({
      draft: '',
      clientName: 'Loja Teste',
      visitNumber: 4,
      objective: 'Auditoria de funil',
      completedTasks: ['Verificar se o plano foi avaliado'],
      pendingTasks: ['Implementar rotina do gerente'],
    })

    expect(message).toContain('Verificar se o plano foi avaliado')
    expect(message).toContain('Implementar rotina do gerente')
  })

  it('does not turn existing formatted headings into bullet points on a second click', () => {
    const firstMessage = formatVisitDraftForGroup({
      draft: 'Validado plano comercial. Proximo passo: acompanhar indicadores diariamente.',
      clientName: 'Loja Teste',
      visitNumber: 2,
      feedbackClient: 'Feedback separado ao cliente.',
      nextCycleGoal: 'Foco separado do proximo ciclo.',
    })

    const secondMessage = formatVisitDraftForGroup({
      draft: firstMessage,
      clientName: 'Loja Teste',
      visitNumber: 2,
      feedbackClient: 'Feedback separado ao cliente.',
      nextCycleGoal: 'Foco separado do proximo ciclo.',
    })

    expect(secondMessage).not.toContain('- Resumo da visita')
    expect(secondMessage).not.toContain('- O que foi alinhado')
    expect(secondMessage).not.toContain('*O que foi alinhado*\n- Foco separado do proximo ciclo.')
    expect(secondMessage).not.toContain('*Proximos passos*\n- Feedback separado ao cliente.')
    expect(secondMessage).toContain('RELATÓRIO DE VISITA TÉCNICA - MÉTODO MX')
  })
})

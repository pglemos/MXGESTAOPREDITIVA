import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const headerSource = readFileSync(new URL('./CheckinHeader.tsx', import.meta.url), 'utf8')
const formSource = readFileSync(new URL('./CheckinForm.tsx', import.meta.url), 'utf8')

// P0-02/P0-06 (auditoria 2026-07-10): a solicitação de regularização enviava
// agd_cart_prev_day/agd_net_prev_day fixos em 0 — zerando os agendamentos D-1
// do vendedor em toda regularização aprovada, mesmo quando ninguém pretendia
// alterá-los. E a distribuição de leads/visitas por canal era perdida ao
// somar tudo em leads_cart/visitas_porta antes de reabrir o drawer.
describe('CheckinHeader — regularização (P0-02/P0-06)', () => {
    test('não hardcoda agd_cart_prev_day/agd_net_prev_day em 0 no payload de solicitação (zerava agendamentos D-1 em toda regularização)', () => {
        expect(headerSource).not.toContain('agd_cart_prev_day: 0')
        expect(headerSource).not.toContain('agd_net_prev_day: 0')
    })

    test('pré-preenchimento do drawer não zera leads_net/visitas_cart/visitas_net quando a distribuição por canal foi rastreada', () => {
        expect(headerSource).toContain('hasVisitasCanal')
        expect(headerSource).toContain('leads_net: checkin.leads_net_prev_day || 0')
        expect(headerSource).toContain('visitas_cart: hasVisitasCanal ? (checkin.visitas_cart_prev_day || 0) : 0')
    })

    test('payload de solicitação usa nomes de coluna reais para leads/visitas por canal (não soma tudo em Carteira/Porta)', () => {
        expect(headerSource).toContain('leads_prev_day: Number(formValues.leads_cart)')
        expect(headerSource).toContain('leads_net_prev_day: Number(formValues.leads_net)')
        expect(headerSource).toContain('visitas_porta_prev_day: Number(formValues.visitas_porta)')
        expect(headerSource).toContain('visitas_cart_prev_day: Number(formValues.visitas_cart)')
        expect(headerSource).toContain('visitas_net_prev_day: Number(formValues.visitas_net)')
    })

    test('mantém os textos e as duas ações prescritas nos cards de contexto', () => {
        expect(headerSource).toContain('FECHAMENTO ANTERIOR CONCLUÍDO')
        expect(headerSource).toContain('FECHAMENTO ANTERIOR PENDENTE')
        expect(headerSource).toContain('Você enviou o fechamento do dia ${previousCard.date.split')
        expect(headerSource).toContain('As informações foram encaminhadas para sua liderança. Caso precise corrigir algum dado, acesse o Histórico de Fechamentos, clique em Ajustar e envie a regularização para análise.')
        expect(headerSource).toContain('não foi enviado dentro do prazo. A tela atual já está liberada para o fechamento de hoje.')
        expect(headerSource).toContain('Ver histórico')
        expect(headerSource).toContain('Ajustar fechamento')
        expect(headerSource).toContain('Regularizar ${previousCard.date.slice')
        expect(headerSource).toContain('whitespace-normal break-words')
        expect(headerSource).not.toContain('truncate text-[12px] font-semibold')
    })

    test('preserva a hierarquia visual da data, progresso, finalização e histórico', () => {
        expect(headerSource.indexOf('Data operacional principal')).toBeLessThan(headerSource.indexOf('Progresso do Fechamento'))
        expect(formSource.indexOf('FINALIZAR FECHAMENTO DO DIA')).toBeLessThan(formSource.lastIndexOf('Histórico de Fechamentos'))
    })

    test('não reutiliza observação operacional como motivo de regularização', () => {
        expect(headerSource).not.toContain('formValues.note')
        expect(headerSource).not.toContain('onNoteChange')
        expect(formSource).not.toContain('Observações Operacionais (Justificativa)')
    })
})

// MX-22.3 (AC-1/2/4; Spec §8.1/§8.2/§8.3) — 7 estados do Histórico +
// regra do botão Ajustar/Regularizar sempre sobre a data exata da linha.
describe('CheckinHeader — Histórico com 7 estados e ações por estado (MX-22.3)', () => {
    test('combina lancamentos_diarios com solicitacoes_correcao_lancamento via resolveHistoryRowState (não mais binário Finalizado/Pendente)', () => {
        expect(headerSource).toContain('resolveHistoryRowState')
        expect(headerSource).toContain('latestRequestForCheckin')
        expect(headerSource).toContain('fetchOwnRequests')
    })

    test('inclui hoje no loop do Histórico (i=0), viabilizando o estado "Em andamento"', () => {
        expect(headerSource).toContain('for (let i = 0; i <= 7; i++)')
    })

    test('Aguardando aprovação nunca reabre Ajustar/Regularizar — evita colisão com o guard de pending do servidor', () => {
        expect(headerSource).toContain("action === 'ajustar' || action === 'regularizar' || action === 'criar_nova_versao'")
    })

    test('handleSelectRow/handleAdjustPrevious carregam exatamente a data da linha/card selecionado (§8.3)', () => {
        expect(headerSource).toContain('const date = previousCard.date')
        expect(headerSource).toContain('checkins.find(c => c.reference_date === date && c.metric_scope')
    })
})

import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const headerSource = readFileSync(new URL('./CheckinHeader.tsx', import.meta.url), 'utf8')

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
})

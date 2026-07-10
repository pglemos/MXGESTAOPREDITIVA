/**
 * P0-02 (auditoria 2026-07-10): antes desta correção, o payload enviado ao
 * RPC submit_checkin só levava o total somado de leads/visitas — a
 * distribuição por canal (Carteira/Internet, Showroom/Carteira/Internet)
 * digitada pelo vendedor nunca chegava ao banco (round-trip quebrado).
 *
 * Testado como função pura (buildSubmitCheckinPayload), não via
 * mock.module('@/lib/supabase') + chamada real de saveCheckin: essa
 * abordagem baseada em mock de rede se mostrou frágil quando a suíte inteira
 * roda junto — Bun não garante substituir um módulo já resolvido por outro
 * arquivo de teste, o que fazia este teste passar isolado e falhar
 * silenciosamente (sem capturar o payload real) dentro do `npm test` da
 * suíte completa. Ver useCheckinsSubmit.ts (buildSubmitCheckinPayload).
 */
import { describe, expect, test } from 'bun:test'
import type { CheckinFormData } from '@/types/database'
import { buildSubmitCheckinPayload } from './useCheckinsSubmit'

describe('buildSubmitCheckinPayload — payload de canal (P0-02)', () => {
    test('envia leads_cart/leads_net e visitas_porta/cart/net separadamente, sem somar tudo em um único canal', () => {
        const formData: CheckinFormData = {
            leads: 10,
            leads_cart: 6,
            leads_net: 4,
            visitas: 9,
            visitas_porta: 2,
            visitas_cart: 3,
            visitas_net: 4,
            agd_cart: 0,
            agd_net: 0,
            agd_cart_prev: 0,
            agd_net_prev: 0,
            vnd_porta: 0,
            vnd_cart: 0,
            vnd_net: 0,
            note: '',
            zero_reason: '',
        }

        const payload = buildSubmitCheckinPayload(
            formData,
            'daily',
            'seller-1',
            'store-1',
            '2026-07-09',
            new Date('2026-07-09T11:00:00.000Z'),
            true,
        )

        expect(payload.leads_prev_day).toBe(6)
        expect(payload.leads_net_prev_day).toBe(4)
        expect(payload.visitas_porta_prev_day).toBe(2)
        expect(payload.visitas_cart_prev_day).toBe(3)
        expect(payload.visitas_net_prev_day).toBe(4)
        // visit_prev_day continua sendo o total, para os consumidores que só
        // leem o agregado (ranking, performance, funil).
        expect(payload.visit_prev_day).toBe(9)
    })

    test('canal ausente no form vira 0 explícito, não fica undefined (RPC trataria como não rastreado)', () => {
        const formData: CheckinFormData = { leads: 0, visitas: 0, note: '', zero_reason: 'Folga' }

        const payload = buildSubmitCheckinPayload(
            formData,
            'daily',
            'seller-1',
            'store-1',
            '2026-07-09',
            new Date('2026-07-09T11:00:00.000Z'),
            true,
        )

        expect(payload.leads_net_prev_day).toBe(0)
        expect(payload.visitas_porta_prev_day).toBe(0)
        expect(payload.visitas_cart_prev_day).toBe(0)
        expect(payload.visitas_net_prev_day).toBe(0)
    })
})

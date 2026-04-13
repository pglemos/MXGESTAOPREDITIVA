import { expect, test, describe } from 'bun:test'
import {
    calcularTotais,
    calcularAtingimento,
    calcularFaltaX,
    calcularProjecao,
    calcularRitmo,
    isBusinessDay,
    calcularFunil,
    gerarDiagnosticoMX,
    MX_BENCHMARKS
} from './calculations'
import type { DailyCheckin, CheckinFormData, FunnelData } from '@/types/database'

describe('Business Calculations (MX Performance)', () => {
    
    test('calcularAtingimento', () => {
        expect(calcularAtingimento(5, 10)).toBe(50)
        expect(calcularAtingimento(0, 10)).toBe(0)
        expect(calcularAtingimento(10, 0)).toBe(0) // Meta zero
        expect(calcularAtingimento(15, 10)).toBe(150)
        expect(calcularAtingimento(3, 7)).toBe(42.9) // Arredondamento 1 casa decimal
    })

    test('calcularFaltaX', () => {
        expect(calcularFaltaX(10, 3)).toBe(7)
        expect(calcularFaltaX(10, 15)).toBe(0) // Não deve ser negativo
        expect(calcularFaltaX(0, 5)).toBe(0)
    })

    test('calcularProjecao', () => {
        expect(calcularProjecao(5, 10, 30)).toBe(15)
        expect(calcularProjecao(0, 10, 30)).toBe(0)
        expect(calcularProjecao(5, 0, 30)).toBe(0) // Dias decorridos zero
    })

    test('calcularRitmo', () => {
        expect(calcularRitmo(20, 5, 15)).toBe(1) // Faltam 15, tem 15 dias -> ritmo 1
        expect(calcularRitmo(20, 20, 10)).toBe(0) // Meta batida -> ritmo 0
        expect(calcularRitmo(20, 25, 10)).toBe(0) // Meta ultrapassada -> ritmo 0
        expect(calcularRitmo(20, 5, 0)).toBe(0) // Sem dias restantes -> ritmo 0
        expect(calcularRitmo(10, 5, 3)).toBe(1.7) // Arredondamento 1 casa decimal
    })

    test('isBusinessDay', () => {
        // 2026-04-12 is Sunday
        expect(isBusinessDay(new Date('2026-04-12T12:00:00Z'))).toBe(false)
        // 2026-04-13 is Monday
        expect(isBusinessDay(new Date('2026-04-13T12:00:00Z'))).toBe(true)
        // 2026-04-18 is Saturday
        expect(isBusinessDay(new Date('2026-04-18T12:00:00Z'))).toBe(true)
    })

    test('calcularTotais from FormData', () => {
        const formData: Partial<CheckinFormData> = {
            leads: 10,
            agd_cart: 2,
            agd_net: 3,
            vnd_porta: 1,
            vnd_cart: 0,
            vnd_net: 1
        }
        const totais = calcularTotais(formData as CheckinFormData)
        expect(totais.agd_total).toBe(5)
        expect(totais.vnd_total).toBe(2)
    })

    test('calcularTotais from DailyCheckin', () => {
        const checkin: Partial<DailyCheckin> = {
            agd_cart_today: 2,
            agd_net_today: 3,
            vnd_porta_prev_day: 1,
            vnd_cart_prev_day: 0,
            vnd_net_prev_day: 1
        }
        const totais = calcularTotais(checkin)
        expect(totais.agd_total).toBe(5)
        expect(totais.vnd_total).toBe(2)
    })

    test('calcularFunil', () => {
        const checkins: Partial<DailyCheckin>[] = [
            { leads_prev_day: 10, agd_cart_prev_day: 1, agd_net_prev_day: 2, visit_prev_day: 2, vnd_net_prev_day: 1 },
            { leads_prev_day: 20, agd_cart_prev_day: 2, agd_net_prev_day: 1, visit_prev_day: 2, vnd_porta_prev_day: 1 }
        ]
        
        const funil = calcularFunil(checkins as DailyCheckin[])
        
        expect(funil.leads).toBe(30)
        expect(funil.agd_total).toBe(6)
        expect(funil.visitas).toBe(4)
        expect(funil.vnd_total).toBe(2)
        
        expect(funil.tx_lead_agd).toBe(20) // 6/30 * 100
        expect(funil.tx_agd_visita).toBe(67) // 4/6 * 100
        expect(funil.tx_visita_vnd).toBe(50) // 2/4 * 100
    })

    test('gerarDiagnosticoMX', () => {
        const rules = {
            store_id: '1',
            monthly_goal: 100,
            individual_goal_mode: 'even' as const,
            include_venda_loja_in_store_total: false,
            include_venda_loja_in_individual_goal: false,
            bench_lead_agd: 20,
            bench_agd_visita: 60,
            bench_visita_vnd: 33,
            projection_mode: 'calendar' as const,
            updated_by: null,
            updated_at: ''
        }

        // Cenário 1: Gargalo em Lead -> Agendamento
        const funil1: FunnelData = { leads: 100, agd_total: 10, visitas: 8, vnd_total: 4, tx_lead_agd: 10, tx_agd_visita: 80, tx_visita_vnd: 50 }
        const diag1 = gerarDiagnosticoMX(funil1, false, rules)
        expect(diag1.gargalo).toBe('LEAD_AGD')

        // Cenário 2: Gargalo em Agendamento -> Visita
        const funil2: FunnelData = { leads: 100, agd_total: 30, visitas: 10, vnd_total: 5, tx_lead_agd: 30, tx_agd_visita: 33, tx_visita_vnd: 50 }
        const diag2 = gerarDiagnosticoMX(funil2, false, rules)
        expect(diag2.gargalo).toBe('AGD_VISITA')

        // Cenário 3: Gargalo em Visita -> Venda
        const funil3: FunnelData = { leads: 100, agd_total: 30, visitas: 20, vnd_total: 2, tx_lead_agd: 30, tx_agd_visita: 67, tx_visita_vnd: 10 }
        const diag3 = gerarDiagnosticoMX(funil3, false, rules)
        expect(diag3.gargalo).toBe('VISITA_VND')

        // Cenário 4: Tudo saudável
        const funil4: FunnelData = { leads: 100, agd_total: 25, visitas: 15, vnd_total: 6, tx_lead_agd: 25, tx_agd_visita: 60, tx_visita_vnd: 40 }
        const diag4 = gerarDiagnosticoMX(funil4, false, rules)
        expect(diag4.gargalo).toBe(null)

        // Cenário 5: Venda Loja (SISTEMICO)
        const diag5 = gerarDiagnosticoMX(funil4, true, rules)
        expect(diag5.gargalo).toBe('SISTEMICO')
    })
})
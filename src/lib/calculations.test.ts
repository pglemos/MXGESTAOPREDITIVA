import { describe, it, expect } from 'bun:test'
import {
    calcularTotais,
    calcularAtingimento,
    calcularFaltaX,
    calcularProjecao,
    calcularRitmo,
    getDiasInfo,
    calcularFunil,
    identificarGargalo,
    validarFunil,
    somarVendas,
    somarVendasPorCanal
} from './calculations'
import type { DailyCheckin, Benchmark } from '../types/database'

describe('calculations.ts', () => {
    describe('calcularTotais', () => {
        it('should calculate totals correctly with all values', () => {
            const checkin = {
                agd_cart: 10,
                agd_net: 5,
                vnd_porta: 2,
                vnd_cart: 3,
                vnd_net: 4
            }
            const result = calcularTotais(checkin)
            expect(result.agd_total).toBe(15)
            expect(result.vnd_total).toBe(9)
        })

        it('should handle missing values (undefined/null)', () => {
            const checkin = {
                agd_cart: 10,
                agd_net: undefined as any,
                vnd_porta: null as any,
                vnd_cart: 3,
                vnd_net: undefined as any
            }
            const result = calcularTotais(checkin)
            expect(result.agd_total).toBe(10)
            expect(result.vnd_total).toBe(3)
        })
    })

    describe('calcularAtingimento', () => {
        it('should calculate percentage correctly', () => {
            expect(calcularAtingimento(50, 100)).toBe(50)
            expect(calcularAtingimento(1, 3)).toBe(33.3)
        })

        it('should return 0 if meta is 0 or less', () => {
            expect(calcularAtingimento(50, 0)).toBe(0)
            expect(calcularAtingimento(50, -10)).toBe(0)
        })
    })

    describe('calcularFaltaX', () => {
        it('should calculate remaining value correctly', () => {
            expect(calcularFaltaX(100, 60)).toBe(40)
        })

        it('should return 0 if sales exceed meta', () => {
            expect(calcularFaltaX(100, 120)).toBe(0)
        })
    })

    describe('calcularProjecao', () => {
        it('should project sales correctly', () => {
            expect(calcularProjecao(10, 5, 30)).toBe(60)
        })

        it('should return 0 if diasDecorridos is 0 or less', () => {
            expect(calcularProjecao(10, 0, 30)).toBe(0)
        })
    })

    describe('calcularRitmo', () => {
        it('should calculate required daily rhythm correctly', () => {
            // (100 - 40) / 10 = 6
            expect(calcularRitmo(100, 40, 10)).toBe(6)
        })

        it('should return 0 if diasRestantes is 0 or less', () => {
            expect(calcularRitmo(100, 40, 0)).toBe(0)
        })

        it('should return 0 if meta is already reached', () => {
            expect(calcularRitmo(100, 120, 10)).toBe(0)
        })
    })

    describe('getDiasInfo', () => {
        it('should return correct days info for a specific date', () => {
            const date = new Date(2024, 0, 15) // Jan 15, 2024
            const info = getDiasInfo(date)
            expect(info.total).toBe(31)
            expect(info.decorridos).toBe(15)
            expect(info.restantes).toBe(16)
        })
    })

    describe('calcularFunil', () => {
        it('should aggregate checkins and calculate rates', () => {
            const checkins: Partial<DailyCheckin>[] = [
                { leads: 10, agd_cart: 2, agd_net: 3, visitas: 4, vnd_porta: 1, vnd_cart: 1, vnd_net: 0 },
                { leads: 20, agd_cart: 5, agd_net: 5, visitas: 6, vnd_porta: 2, vnd_cart: 0, vnd_net: 1 }
            ]
            const result = calcularFunil(checkins as DailyCheckin[])

            expect(result.leads).toBe(30)
            expect(result.agd_total).toBe(15)
            expect(result.visitas).toBe(10)
            expect(result.vnd_total).toBe(5)

            expect(result.tx_lead_agd).toBe(50) // 15/30
            expect(result.tx_agd_visita).toBe(67) // 10/15 = 0.666...
            expect(result.tx_visita_vnd).toBe(50) // 5/10
        })

        it('should handle empty or zeroed data', () => {
            const result = calcularFunil([])
            expect(result.leads).toBe(0)
            expect(result.tx_lead_agd).toBe(0)
        })
    })

    describe('identificarGargalo', () => {
        const benchmark: Benchmark = {
            id: '1',
            store_id: '1',
            lead_to_appt: 50,
            appt_to_visit: 50,
            visit_to_sale: 50
        }

        it('should return success message if all rates are above benchmark', () => {
            const funil = {
                leads: 100, agd_total: 60, visitas: 40, vnd_total: 25,
                tx_lead_agd: 60, tx_agd_visita: 66, tx_visita_vnd: 62
            }
            const result = identificarGargalo(funil, benchmark)
            expect(result.gargalo).toBeNull()
            expect(result.mensagem).toContain('✅')
        })

        it('should identify the biggest gap', () => {
            const funil = {
                leads: 100, agd_total: 30, visitas: 10, vnd_total: 5,
                tx_lead_agd: 30, // gap 20
                tx_agd_visita: 33, // gap 17
                tx_visita_vnd: 50 // gap 0
            }
            const result = identificarGargalo(funil, benchmark)
            expect(result.etapa_problema).toBe('lead_agd')
            expect(result.mensagem).toContain('Lead → Agendamento')
        })
    })

    describe('validarFunil', () => {
        it('should return null for valid funnel', () => {
            const data = { agd_cart: 10, agd_net: 10, vnd_porta: 5, vnd_cart: 0, vnd_net: 0, visitas: 10 }
            expect(validarFunil(data)).toBeNull()
        })

        it('should return error if vendas > visitas', () => {
            const data = { agd_cart: 10, agd_net: 10, vnd_porta: 10, vnd_cart: 5, vnd_net: 0, visitas: 10 }
            const error = validarFunil(data)
            expect(error).toContain('vendas (15) não pode ser maior que visitas (10)')
        })

        it('should return error if visitas > agendamentos', () => {
            const data = { agd_cart: 5, agd_net: 0, vnd_porta: 2, vnd_cart: 0, vnd_net: 0, visitas: 10 }
            const error = validarFunil(data)
            expect(error).toContain('Visitas (10) não pode ser maior que total de agendamentos (5)')
        })
    })

    describe('somarVendas', () => {
        it('should sum all sales channels', () => {
            const checkins: Partial<DailyCheckin>[] = [
                { vnd_porta: 1, vnd_cart: 2, vnd_net: 3 },
                { vnd_porta: 4, vnd_cart: 5, vnd_net: 6 }
            ]
            expect(somarVendas(checkins as DailyCheckin[])).toBe(21)
        })
    })

    describe('somarVendasPorCanal', () => {
        it('should sum sales separately by channel', () => {
            const checkins: Partial<DailyCheckin>[] = [
                { vnd_porta: 1, vnd_cart: 2, vnd_net: 3 },
                { vnd_porta: 4, vnd_cart: 5, vnd_net: 6 }
            ]
            const result = somarVendasPorCanal(checkins as DailyCheckin[])
            expect(result.porta).toBe(5)
            expect(result.carteira).toBe(7)
            expect(result.internet).toBe(9)
        })
    })
})

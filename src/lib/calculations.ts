// ============================================
// MX Gestão Preditiva — Business Calculations
// ============================================

import type { DailyCheckin, CheckinTotals, FunnelData, FunnelDiagnostic, Benchmark } from '@/types/database'

/** Calculate check-in totals (agd_total, vnd_total) */
export function calcularTotais(c: Pick<DailyCheckin, 'agd_cart' | 'agd_net' | 'vnd_porta' | 'vnd_cart' | 'vnd_net'>): CheckinTotals {
    return {
        agd_total: (c.agd_cart || 0) + (c.agd_net || 0),
        vnd_total: (c.vnd_porta || 0) + (c.vnd_cart || 0) + (c.vnd_net || 0),
    }
}

/** % atingimento = vendas / meta × 100 */
export function calcularAtingimento(vendas: number, meta: number): number {
    if (meta <= 0) return 0
    return Math.round((vendas / meta) * 100 * 10) / 10
}

/** Falta X = max(meta - vendas, 0) */
export function calcularFaltaX(meta: number, vendas: number): number {
    return Math.max(meta - vendas, 0)
}

/** Projeção = (vendas_acum / dias_decorridos) × total_dias */
export function calcularProjecao(vendas: number, diasDecorridos: number, totalDias: number): number {
    if (diasDecorridos <= 0) return 0
    return Math.round((vendas / diasDecorridos) * totalDias)
}

/** Ritmo diário = (meta - vendas) / dias_restantes */
export function calcularRitmo(meta: number, vendas: number, diasRestantes: number): number {
    if (diasRestantes <= 0) return 0
    const falta = Math.max(meta - vendas, 0)
    return Math.round(falta / diasRestantes * 10) / 10
}

/** Get days info for the current month */
export function getDiasInfo(date?: Date): { total: number; decorridos: number; restantes: number } {
    const now = date || new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const total = new Date(year, month + 1, 0).getDate()
    const decorridos = now.getDate()
    const restantes = total - decorridos
    return { total, decorridos, restantes }
}

/** Calculate funnel data from aggregated checkins */
export function calcularFunil(checkins: DailyCheckin[]): FunnelData {
    const leads = checkins.reduce((s, c) => s + (c.leads || 0), 0)
    const agd_total = checkins.reduce((s, c) => s + (c.agd_cart || 0) + (c.agd_net || 0), 0)
    const visitas = checkins.reduce((s, c) => s + (c.visitas || 0), 0)
    const vnd_total = checkins.reduce((s, c) => s + (c.vnd_porta || 0) + (c.vnd_cart || 0) + (c.vnd_net || 0), 0)

    return {
        leads,
        agd_total,
        visitas,
        vnd_total,
        tx_lead_agd: leads > 0 ? Math.round((agd_total / leads) * 100) : 0,
        tx_agd_visita: agd_total > 0 ? Math.round((visitas / agd_total) * 100) : 0,
        tx_visita_vnd: visitas > 0 ? Math.round((vnd_total / visitas) * 100) : 0,
    }
}

/** Identify funnel bottleneck */
export function identificarGargalo(funil: FunnelData, benchmark: Benchmark): FunnelDiagnostic {
    const gaps = [
        {
            etapa: 'lead_agd' as const,
            real: funil.tx_lead_agd,
            esperado: benchmark.lead_to_appt,
            nome: 'Lead → Agendamento',
        },
        {
            etapa: 'agd_visita' as const,
            real: funil.tx_agd_visita,
            esperado: benchmark.appt_to_visit,
            nome: 'Agendamento → Visita',
        },
        {
            etapa: 'visita_vnd' as const,
            real: funil.tx_visita_vnd,
            esperado: benchmark.visit_to_sale,
            nome: 'Visita → Venda',
        },
    ]

    const problemas = gaps.filter(g => g.real < g.esperado).sort((a, b) => {
        const gapA = a.esperado - a.real
        const gapB = b.esperado - b.real
        return gapB - gapA
    })

    if (problemas.length === 0) {
        return { gargalo: null, mensagem: '✅ Funil saudável! Todas as taxas acima do benchmark.', etapa_problema: null }
    }

    const pior = problemas[0]
    return {
        gargalo: pior.nome,
        mensagem: `⚠️ Gargalo em "${pior.nome}": taxa real ${pior.real}% vs benchmark ${pior.esperado}%. Foco em melhorar esta etapa.`,
        etapa_problema: pior.etapa,
    }
}

/** Validate funnel logic: vnd_total <= visitas <= agd_total */
export function validarFunil(data: { agd_cart: number; agd_net: number; vnd_porta: number; vnd_cart: number; vnd_net: number; visitas: number }): string | null {
    const agd_total = data.agd_cart + data.agd_net
    const vnd_total = data.vnd_porta + data.vnd_cart + data.vnd_net

    if (vnd_total > data.visitas) {
        return `Total de vendas (${vnd_total}) não pode ser maior que visitas (${data.visitas})`
    }
    if (data.visitas > agd_total && agd_total > 0) {
        return `Visitas (${data.visitas}) não pode ser maior que total de agendamentos (${agd_total})`
    }
    return null
}

/** Sum total vendas from checkins array */
export function somarVendas(checkins: DailyCheckin[]): number {
    return checkins.reduce((s, c) => s + (c.vnd_porta || 0) + (c.vnd_cart || 0) + (c.vnd_net || 0), 0)
}

/** Sum vendas by channel */
export function somarVendasPorCanal(checkins: DailyCheckin[]) {
    return {
        porta: checkins.reduce((s, c) => s + (c.vnd_porta || 0), 0),
        carteira: checkins.reduce((s, c) => s + (c.vnd_cart || 0), 0),
        internet: checkins.reduce((s, c) => s + (c.vnd_net || 0), 0),
    }
}

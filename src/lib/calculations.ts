// ============================================
// MX Gestão Preditiva — Business Calculations
// ============================================

import type { DailyCheckin, CheckinTotals, FunnelData, FunnelDiagnostic, Benchmark, CheckinFormData } from '@/types/database'

/** Calculate check-in totals (agd_total, vnd_total) */
export function calcularTotais(c: Partial<DailyCheckin> | CheckinFormData): CheckinTotals {
    // Se for FormData (nomes simples)
    if ('leads' in c) {
        return {
            agd_total: (c.agd_cart || 0) + (c.agd_net || 0),
            vnd_total: (c.vnd_porta || 0) + (c.vnd_cart || 0) + (c.vnd_net || 0),
        }
    }
    // Se for DailyCheckin (nomes canônicos)
    return {
        agd_total: (c.agd_cart_today || 0) + (c.agd_net_today || 0),
        vnd_total: (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0),
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
    const leads = checkins.reduce((s, c) => s + (c.leads_prev_day || 0), 0)
    const agd_total = checkins.reduce((s, c) => s + (c.agd_cart_today || 0) + (c.agd_net_today || 0), 0)
    const visitas = checkins.reduce((s, c) => s + (c.visit_prev_day || 0), 0)
    const vnd_total = checkins.reduce((s, c) => s + (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0), 0)

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


/** Benchmarks Oficiais Metodologia MX */
export const MX_BENCHMARKS = {
    lead_agd: 20,    // 20% de Leads devem virar Agendamentos
    agd_visita: 60,  // 60% de Agendamentos devem virar Visitas
    visita_vnd: 33   // 33% de Visitas devem virar Vendas
}

/** Gera diagnóstico rígido baseado no critério 20/60/33 */
export function gerarDiagnosticoMX(funil: FunnelData): { 
    gargalo: string | null, 
    diagnostico: string, 
    sugestao: string 
} {
    if (funil.tx_lead_agd < MX_BENCHMARKS.lead_agd) {
        return {
            gargalo: 'LEAD_AGD',
            diagnostico: `Baixa conversão de Leads para Agendamentos (${funil.tx_lead_agd}% vs ${MX_BENCHMARKS.lead_agd}% ideal).`,
            sugestao: "Focar em velocidade de primeiro contato e qualidade da abordagem inicial (script de agendamento)."
        }
    }
    if (funil.tx_agd_visita < MX_BENCHMARKS.agd_visita) {
        return {
            gargalo: 'AGD_VISITA',
            diagnostico: `Baixa taxa de comparecimento (${funil.tx_agd_visita}% vs ${MX_BENCHMARKS.agd_visita}% ideal).`,
            sugestao: "Melhorar a confirmação de agendamentos e o 'valor percebido' criado durante a ligação."
        }
    }
    if (funil.tx_visita_vnd < MX_BENCHMARKS.visita_vnd) {
        return {
            gargalo: 'VISITA_VND',
            diagnostico: `Baixo fechamento em loja (${funil.tx_visita_vnd}% vs ${MX_BENCHMARKS.visita_vnd}% ideal).`,
            sugestao: "Revisar etapas de demonstração de produto e contorno de objeções no momento do fechamento."
        }
    }

    return {
        gargalo: null,
        diagnostico: "Funil equilibrado e dentro dos padrões de eficiência MX.",
        sugestao: "Manter o ritmo e focar em aumento de volume de leads para escala."
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

/** Get status operacional baseado no pacing e disciplina */
export function getOperationalStatus(pacing: number, disciplinePct: number): { label: string; color: string } {
    if (disciplinePct < 80) return { label: 'INDISCIPLINA', color: 'bg-rose-600 text-white' }
    if (pacing < 30) return { label: 'CRÍTICO', color: 'bg-rose-600 text-white' }
    if (pacing < 70) return { label: 'ATENÇÃO', color: 'bg-amber-500 text-white' }
    if (pacing < 100) return { label: 'NO RITMO', color: 'bg-emerald-600 text-white' }
    return { label: 'EXCELÊNCIA', color: 'bg-indigo-600 text-white' }
}

/** Sum total vendas from checkins array */
export function somarVendas(checkins: DailyCheckin[]): number {
    return checkins.reduce((s, c) => s + (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0), 0)
}

/** Sum vendas by channel */
export function somarVendasPorCanal(checkins: DailyCheckin[]) {
    return {
        porta: checkins.reduce((s, c) => s + (c.vnd_porta_prev_day || 0), 0),
        carteira: checkins.reduce((s, c) => s + (c.vnd_cart_prev_day || 0), 0),
        internet: checkins.reduce((s, c) => s + (c.vnd_net_prev_day || 0), 0),
    }
}


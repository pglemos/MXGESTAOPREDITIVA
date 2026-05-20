import type { DailyCheckin, CheckinWithTotals } from '@/types/database'
import { calcularTotais } from '@/lib/calculations'

export const CHECKIN_DEADLINE_MINUTES = 9 * 60 + 30
export const CHECKIN_EDIT_LIMIT_MINUTES = 9 * 60 + 45
export const CHECKIN_DEADLINE_LABEL = '09:30'
export const CHECKIN_EDIT_LIMIT_LABEL = '09:45'
export const MX_TIMEZONE = 'America/Sao_Paulo'
export const CHECKIN_ZERO_REASONS = ['Folga', 'Treinamento', 'Feriado', 'Dia administrativo', 'Outro'] as const
export const CHECKIN_MAX_INPUT_VALUE = 999

export const CHECKIN_SELECT = 'id, seller_user_id, store_id, reference_date, submitted_at, metric_scope, submission_status, leads_prev_day, agd_cart_prev_day, agd_net_prev_day, agd_cart_today, agd_net_today, vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day, visit_prev_day, zero_reason, note, submitted_late, edit_locked_at, created_by, updated_at'

export function withCheckinTotals(checkin: DailyCheckin): CheckinWithTotals {
    const normalized = { ...checkin, is_venda_loja: checkin.is_venda_loja ?? false }
    return { ...normalized, ...calcularTotais(normalized) }
}

function getSaoPauloParts(date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: MX_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date)

    const byType = new Map(parts.map(part => [part.type, part.value]))
    return {
        year: Number(byType.get('year')),
        month: Number(byType.get('month')),
        day: Number(byType.get('day')),
        hour: Number(byType.get('hour')),
        minute: Number(byType.get('minute')),
    }
}

function minutesSinceSaoPauloStartOfDay(date: Date) {
    const parts = getSaoPauloParts(date)
    return parts.hour * 60 + parts.minute
}

// Regra MX: envio acontece hoje, mas a produção declarada se refere sempre ao dia anterior.
export function calculateReferenceDate(baseDate = new Date()): string {
    const parts = getSaoPauloParts(baseDate)
    const saoPauloCalendarDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
    saoPauloCalendarDate.setUTCDate(saoPauloCalendarDate.getUTCDate() - 1)
    return saoPauloCalendarDate.toISOString().split('T')[0]
}

export function isCheckinLate(baseDate = new Date()): boolean {
    // Atraso começa depois de 09:30; exatamente 09:30 ainda é no prazo.
    return minutesSinceSaoPauloStartOfDay(baseDate) > CHECKIN_DEADLINE_MINUTES
}

export function canEditCurrentCheckin(baseDate = new Date()): boolean {
    // Edição/envio diário é permitido até 09:45 inclusive; 09:46 bloqueia.
    return minutesSinceSaoPauloStartOfDay(baseDate) <= CHECKIN_EDIT_LIMIT_MINUTES
}

export function getCheckinEditLockedAt(baseDate = new Date()): string {
    const parts = getSaoPauloParts(baseDate)
    const lockDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 45, 0, 0))
    return lockDate.toISOString()
}

export function validateCheckinSubmissionDate(
    finalDate: string,
    officialReferenceDate: string,
    scope: import('@/types/database').CheckinScope,
): string | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(finalDate)) {
        return 'Data de referência inválida.'
    }

    if (finalDate > officialReferenceDate) {
        return 'Lançamentos não podem usar data futura ou o dia corrente.'
    }

    if (scope === 'daily' && finalDate !== officialReferenceDate) {
        return 'Registro diário aceita somente a referência oficial. Use ajuste técnico para datas retroativas.'
    }

    return null
}

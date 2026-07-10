import { supabase } from '@/lib/supabase'
import type { CheckinFormData, CheckinScope } from '@/types/database'
import { canCreateAdjustment } from '@/lib/auth/capabilities'
import {
    getCheckinEditLockedAt,
    isCheckinLate,
    validateCheckinSubmissionDate,
} from './types'

function getSaoPauloDateOnly(baseDate = new Date()): string {
return new Intl.DateTimeFormat('en-CA', {
timeZone: 'America/Sao_Paulo',
year: 'numeric',
month: '2-digit',
day: '2-digit',
}).format(baseDate)
}

export interface UseCheckinsSubmitArgs {
    profile: { id: string } | null
    storeId: string | null
    role: string | null | undefined
    referenceDate: string
    afterSubmit?: () => Promise<void> | void
}

const normalizeText = (str?: string | null) => {
    const trimmed = str?.trim()
    return trimmed || null
}

// Monta o payload enviado à RPC submit_checkin. Extraída para função pura
// (P0-02/P0-05a, auditoria 2026-07-10) para ser testável sem depender de
// mock de rede/supabase — testes baseados em mock.module('@/lib/supabase')
// se mostraram frágeis quando a suíte inteira roda junto (Bun não garante
// substituir um módulo já resolvido por outro arquivo de teste).
export function buildSubmitCheckinPayload(
    formData: CheckinFormData,
    scope: CheckinScope,
    sellerUserId: string,
    storeId: string,
    finalDate: string,
    submittedAt: Date,
    isDaily: boolean,
) {
    return {
        seller_user_id: sellerUserId,
        store_id: storeId,
        reference_date: finalDate,
        submitted_at: submittedAt.toISOString(),
        metric_scope: scope,
        submitted_late: isDaily ? isCheckinLate(submittedAt) : false,
        submission_status: isDaily ? (isCheckinLate(submittedAt) ? 'late' : 'on_time') : 'on_time',
        edit_locked_at: isDaily ? getCheckinEditLockedAt(submittedAt) : null,
        // leads_prev_day = canal Carteira (nome de coluna legado, implícito);
        // leads_net_prev_day = canal Internet. Não usar formData.leads (soma
        // dos dois) aqui — isso jogava tudo em Carteira e zerava Internet no
        // round-trip (P0-02, auditoria 2026-07-10).
        leads_prev_day: formData.leads_prev_day ?? formData.leads_cart ?? formData.leads,
        leads_net_prev_day: formData.leads_net_prev_day ?? formData.leads_net ?? 0,
        agd_cart_prev_day: formData.agd_cart_prev_day ?? formData.agd_cart_prev,
        agd_net_prev_day: formData.agd_net_prev_day ?? formData.agd_net_prev,
        agd_cart_today: formData.agd_cart_today ?? formData.agd_cart,
        agd_net_today: formData.agd_net_today ?? formData.agd_net,
        vnd_porta_prev_day: formData.vnd_porta_prev_day ?? formData.vnd_porta,
        vnd_cart_prev_day: formData.vnd_cart_prev_day ?? formData.vnd_cart,
        vnd_net_prev_day: formData.vnd_net_prev_day ?? formData.vnd_net,
        // visit_prev_day segue como total (compatibilidade com consumidores
        // existentes — ranking, performance, funil). O servidor recalcula esse
        // total a partir dos 3 canais abaixo quando eles vêm preenchidos
        // (defesa em profundidade, mesmo padrão da disciplina/EV-1.5).
        visit_prev_day: formData.visit_prev_day ?? formData.visitas,
        visitas_porta_prev_day: formData.visitas_porta_prev_day ?? formData.visitas_porta ?? 0,
        visitas_cart_prev_day: formData.visitas_cart_prev_day ?? formData.visitas_cart ?? 0,
        visitas_net_prev_day: formData.visitas_net_prev_day ?? formData.visitas_net ?? 0,
        zero_reason: normalizeText(formData.zero_reason),
        note: normalizeText(formData.note),
        pontuacao_disciplina_base: formData.pontuacao_disciplina_base ?? null,
        fechamento_liberado: formData.fechamento_liberado ?? false,
    }
}

/**
 * Hook responsável por submeter check-ins via RPC `submit_checkin`.
 * Encapsula validações de prazo, scope (daily vs adjustment) e payload normalization.
 */
export function useCheckinsSubmit(args: UseCheckinsSubmitArgs) {
    const { profile, storeId, role, referenceDate, afterSubmit } = args

    const saveCheckin = async (
        formData: CheckinFormData,
        scope: CheckinScope = 'daily',
        customDate?: string,
        officialReferenceDate?: string,
    ): Promise<{ error: string | null; id?: string }> => {
        if (!profile || !storeId) return { error: 'Usuário não autenticado' }
        if (scope === 'adjustment' && !canCreateAdjustment(role)) {
            return { error: 'Ajuste técnico é restrito a gestores e perfis internos MX.' }
        }

        const finalDate = customDate || formData.reference_date || referenceDate
        const activeReferenceDate = officialReferenceDate || referenceDate
        const dateError = validateCheckinSubmissionDate(finalDate, activeReferenceDate, scope, getSaoPauloDateOnly())
        if (dateError) return { error: dateError }

 const isDaily = scope === 'daily' && finalDate <= getSaoPauloDateOnly()
        const submittedAt = new Date()
        const payload = buildSubmitCheckinPayload(formData, scope, profile.id, storeId, finalDate, submittedAt, isDaily)

        const { data, error } = await supabase.rpc('submit_checkin', { p_payload: payload })

        if (error) return { error: error.message }
        const result = data as { ok?: boolean; error?: string; data?: { id?: string } } | null
        if (!result?.ok) return { error: result?.error || 'Não foi possível salvar o check-in.' }

        if (afterSubmit) await afterSubmit()
        return { error: null, id: result.data?.id }
    }

    return { saveCheckin }
}

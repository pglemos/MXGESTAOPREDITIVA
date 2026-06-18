import { DailyCheckin } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { isLancamentosViaRpcEnabled } from '@/lib/feature-flags';

/**
 * @deprecated
 *
 * **CAMINHO LEGACY — não use em código novo.**
 *
 * Story 1.2 (DB-016 Fase B): este service realiza INSERT direto em
 * `lancamentos_diarios` paralelamente à RPC canônica `submit_checkin`. Após o
 * REVOKE de write (Story 1.3 canary 1% → 100%), este caminho deixará de
 * funcionar e DEVE ser substituído por chamada direta a `supabase.rpc('submit_checkin', { p_payload })`.
 *
 * Atualmente importado por `AiDiagnostics.tsx` e `MorningReport.tsx` — ambos os
 * call-sites são leitura (não invocam `storeCheckin`). TODO Sprint 2: remover
 * o export e qualquer uso remanescente.
 *
 * Quando a feature flag `db016_rpc_enabled` está ON, o passo de dedup também
 * passa a usar `get_lancamento_por_dia` SECURITY DEFINER (substitui SELECT direto).
 */
export async function storeCheckin(
    checkin: DailyCheckin,
    userId: string,
    source: 'legacy_import' | 'manual_form'
) {
    // 1. Check for existing entry (Deduplication)
    let existing: { id: string } | null = null
    if (isLancamentosViaRpcEnabled()) {
        const { data } = await supabase.rpc('get_lancamento_por_dia', {
            p_seller_id: checkin.seller_user_id,
            p_store_id: checkin.store_id,
            p_reference_date: checkin.reference_date,
            p_scope: 'daily',
        })
        const row = data as { id?: string } | null
        existing = row?.id ? { id: row.id } : null
    } else {
        const { data } = await supabase
            .from('lancamentos_diarios')
            .select('id')
            .eq('store_id', checkin.store_id)
            .eq('seller_user_id', checkin.seller_user_id)
            .eq('reference_date', checkin.reference_date)
            .maybeSingle();
        existing = data as { id: string } | null
    }

    if (existing) {
        throw new Error(`Deduplication error: Fechamento Diário already exists for ${checkin.reference_date}`);
    }

    // 2. Perform Audit Log before transaction
    await supabase.from('logs_auditoria').insert({
        user_id: userId,
        action: 'INSERT',
        entity: 'lancamentos_diarios',
        details_json: { source, checkin }
    });

    // 3. Insert Checkin
    // ⚠️ Caminho LEGACY: INSERT direto. Após Story 1.3 REVOKE, este passo falhará
    // com 403/PGRST204. Migre call-sites para `supabase.rpc('submit_checkin', { p_payload })`.
    const { data, error } = await supabase
        .from('lancamentos_diarios')
        .insert(checkin)
        .select()
        .maybeSingle();

    if (error) throw error;
    return data;
}

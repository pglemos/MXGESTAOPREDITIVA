import { DailyCheckin } from '@/types/database';
import { supabase } from '@/lib/supabase';

/**
 * Service to handle idempotent checkin storage with audit logging.
 */
export async function storeCheckin(
    checkin: DailyCheckin, 
    userId: string,
    source: 'legacy_import' | 'manual_form'
) {
    // 1. Check for existing entry (Deduplication)
    const { data: existing } = await supabase
        .from('daily_checkins')
        .select('id')
        .eq('store_id', checkin.store_id)
        .eq('seller_user_id', checkin.seller_user_id)
        .eq('reference_date', checkin.reference_date)
        .maybeSingle();

    if (existing) {
        throw new Error(`Deduplication error: Check-in already exists for ${checkin.reference_date}`);
    }

    // 2. Perform Audit Log before transaction
    await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'INSERT',
        entity: 'daily_checkins',
        details_json: { source, checkin }
    });

    // 3. Insert Checkin
    const { data, error } = await supabase
        .from('daily_checkins')
        .insert(checkin)
        .select()
        .maybeSingle();

    if (error) throw error;
    return data;
}

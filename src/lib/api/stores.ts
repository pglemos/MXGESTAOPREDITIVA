import { supabase } from '@/lib/supabase';
import { StoreMetaRules, StoreDeliveryRules } from '@/types/database';

const STORE_META_RULES_SELECT = 'store_id, monthly_goal, individual_goal_mode, include_venda_loja_in_store_total, include_venda_loja_in_individual_goal, bench_lead_agd, bench_agd_visita, bench_visita_vnd, projection_mode, updated_by, updated_at';
const DELIVERY_RULES_SELECT = 'store_id, matinal_recipients, weekly_recipients, monthly_recipients, whatsapp_group_ref, timezone, active, updated_by, updated_at';

export async function getStoreGovernance(storeId: string) {
    const [meta, delivery] = await Promise.all([
        supabase.from('regras_metas_loja').select(STORE_META_RULES_SELECT).eq('store_id', storeId).maybeSingle(),
        supabase.from('regras_entrega_loja').select(DELIVERY_RULES_SELECT).eq('store_id', storeId).maybeSingle()
    ]);

    return { meta: meta.data, delivery: delivery.data };
}

export async function updateStoreGovernance(storeId: string, meta: Partial<StoreMetaRules>, delivery: Partial<StoreDeliveryRules>) {
    await Promise.all([
        supabase.from('regras_metas_loja').upsert({ store_id: storeId, ...meta }),
        supabase.from('regras_entrega_loja').upsert({ store_id: storeId, ...delivery })
    ]);
}

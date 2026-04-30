import { supabase } from '@/lib/supabase';
import { StoreMetaRules, StoreDeliveryRules } from '@/types/database';

export async function getStoreGovernance(storeId: string) {
    const [meta, delivery] = await Promise.all([
        supabase.from('regras_metas_loja').select('*').eq('store_id', storeId).maybeSingle(),
        supabase.from('regras_entrega_loja').select('*').eq('store_id', storeId).maybeSingle()
    ]);

    return { meta: meta.data, delivery: delivery.data };
}

export async function updateStoreGovernance(storeId: string, meta: Partial<StoreMetaRules>, delivery: Partial<StoreDeliveryRules>) {
    await Promise.all([
        supabase.from('regras_metas_loja').upsert({ store_id: storeId, ...meta }),
        supabase.from('regras_entrega_loja').upsert({ store_id: storeId, ...delivery })
    ]);
}

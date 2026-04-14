import { supabase } from '@/lib/supabase';
import { StoreMetaRules, StoreDeliveryRules } from '@/types/database';

export async function getStoreGovernance(storeId: string) {
    const [meta, delivery] = await Promise.all([
        supabase.from('store_meta_rules').select('*').eq('store_id', storeId).maybeSingle(),
        supabase.from('store_delivery_rules').select('*').eq('store_id', storeId).maybeSingle()
    ]);

    return { meta: meta.data, delivery: delivery.data };
}

export async function updateStoreGovernance(storeId: string, meta: Partial<StoreMetaRules>, delivery: Partial<StoreDeliveryRules>) {
    await Promise.all([
        supabase.from('store_meta_rules').upsert({ store_id: storeId, ...meta }),
        supabase.from('store_delivery_rules').upsert({ store_id: storeId, ...delivery })
    ]);
}

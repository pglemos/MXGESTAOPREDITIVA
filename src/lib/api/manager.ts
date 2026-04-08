import { supabase } from '@/lib/supabase';

export async function getManagerRoutineData(storeId: string, referenceDate: string) {
    const { data, error } = await supabase
        .from('manager_routine_logs')
        .select('*')
        .eq('store_id', storeId)
        .eq('reference_date', referenceDate)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

export async function getRankingSnapshot(storeId: string) {
    const { data, error } = await supabase
        .rpc('get_ranking_snapshot', { p_store_id: storeId });
    
    if (error) throw error;
    return data;
}

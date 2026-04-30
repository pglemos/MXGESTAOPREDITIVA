import { supabase } from '@/lib/supabase';

export async function getAdminExecutiveOverview() {
    // Aggregates data for all lojas: Pacing, Gap, Projections, Semaphores
    const { data, error } = await supabase.rpc('get_admin_executive_overview');
    if (error) throw error;
    return data;
}

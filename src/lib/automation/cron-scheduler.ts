import { supabase } from '@/lib/supabase';
import { generateMorningReportXlsx } from './reports/xlsx-generator';
import { sendEmailReport } from './email/sender';

export async function runMatinalWorkflow() {
    const { data: stores } = await supabase.from('stores').select('*').eq('active', true);
    if (!stores) return;
    
    for (const store of stores) {
        const { data: checkins } = await supabase.from('daily_checkins').select('*').eq('store_id', store.id);
        if (!checkins) continue;

        const buffer = await generateMorningReportXlsx(checkins);
        await sendEmailReport([store.manager_email!], 'Relatório Matinal', 'Segue em anexo.', buffer);
    }
}

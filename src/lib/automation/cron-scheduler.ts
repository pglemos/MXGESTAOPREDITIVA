import { generateMorningReportXlsx } from './reports/xlsx-generator';
import { sendEmailReport } from './email/sender';
import { supabase } from '@/lib/supabase';

export async function runMatinalWorkflow() {
    // 1. Fetch data and config
    const { data: stores } = await supabase.from('stores').select('*').eq('active', true);
    
    for (const store of stores || []) {
        // 2. Generate report
        const checkins = await supabase.from('daily_checkins').select('*').eq('store_id', store.id);
        const buffer = await generateMorningReportXlsx(checkins.data || []);
        
        // 3. Send
        await sendEmailReport([store.manager_email!], 'Relatório Matinal', 'Segue em anexo.', buffer);
    }
}

import { supabase } from '@/lib/supabase';
import { generateMorningReportXlsx } from './reports/xlsx-generator';
import { sendEmailReport } from './email/sender';
import { getMatinalEmailTemplate } from './email/templates/matinal';
import { calcularFunil } from '../calculations';

export async function runMatinalWorkflow() {
    const { data: stores } = await supabase.from('stores').select('*').eq('active', true);
    if (!stores) return;
    
    for (const store of stores) {
        const { data: checkins } = await supabase.from('daily_checkins').select('*').eq('store_id', store.id);
        if (!checkins) continue;

        const buffer = await generateMorningReportXlsx(checkins);
        const funnelData = calcularFunil(checkins as any);
        const metaInfo = { pacing: 0.85 }; // Placeholder: needs actual calculation against store_meta_rules
        const html = getMatinalEmailTemplate(store.name, funnelData, metaInfo);
        
        await sendEmailReport([store.manager_email!], 'Relatório Matinal - MX Performance', html, buffer);
    }
}

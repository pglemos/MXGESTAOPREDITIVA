import { supabase } from '../src/lib/supabase';
import { generateMorningReportXlsx } from '../src/lib/automation/reports/xlsx-generator';
import { sendEmailReport } from '../src/lib/automation/email/sender';
import { getMatinalEmailTemplate } from '../src/lib/automation/email/templates/matinal';
import { calcularFunil } from '../src/lib/calculations';

async function testEmail() {
    console.log('Disparando e-mail de teste para synvollt@gmail.com...');
    
    // Simular dados de uma loja (usando a primeira loja ativa)
    const { data: stores } = await supabase.from('stores').select('*').limit(1);
    const store = stores?.[0];
    
    if (!store) {
        console.error('Nenhuma loja encontrada para teste.');
        return;
    }

    // Buscar checkins
    const { data: checkins } = await supabase.from('daily_checkins').select('*').eq('store_id', store.id);
    
    const buffer = await generateMorningReportXlsx(checkins || []);
    const funnelData = calcularFunil(checkins as any || []);
    const metaInfo = { pacing: 0.95 }; 
    const html = getMatinalEmailTemplate(store.name, funnelData, metaInfo);
    
    await sendEmailReport(['synvollt@gmail.com'], 'TESTE: Relatório Matinal - MX Performance', html, buffer);
    console.log('E-mail enviado com sucesso.');
}

testEmail().catch(console.error);

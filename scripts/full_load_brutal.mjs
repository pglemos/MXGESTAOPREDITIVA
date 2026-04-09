import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function loadBrutal() {
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const baseOficial = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
    const { data: stores } = await supabase.from('stores').select('id, name');
    const { data: users } = await supabase.from('users').select('id, name');

    console.log('Limpando dados para carga brutal...');
    await supabase.from('daily_checkins').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const uniqueRecords = new Map();

    for (const row of baseOficial) {
        const store = stores.find(s => s.name === row['LOJA']);
        const user = users.find(u => u.name === row['VENDEDOR']);
        
        if (!store) continue;
        
        // FORÇANDO DATA EM ABRIL PARA BATER COM O FILTRO MENSAL DO DASHBOARD
        const dataRef = '2026-04-01'; 

        const uid = user ? user.id : '167f189c-a4dd-43d1-9b0f-388c85935719'; // Admin MX fallback
        const key = `${uid}-${store.id}-${dataRef}`;

        const valLeads = Number(row['LEADS'] || 0);
        const valVisitas = Number(row['VISITA'] || 0);
        const valAgdNet = Number(row['AGD_NET'] || 0);
        const valVndNet = Number(row['VND_NET'] || 0);

        if (uniqueRecords.has(key)) {
            const existing = uniqueRecords.get(key);
            existing.leads += valLeads;
            existing.leads_prev_day += valLeads;
            existing.visitas += valVisitas;
            existing.visit_prev_day += valVisitas;
            existing.agd_net += valAgdNet;
            existing.agd_net_today += valAgdNet;
            existing.vnd_net += valVndNet;
            existing.vnd_net_prev_day += valVndNet;
        } else {
            uniqueRecords.set(key, {
                store_id: store.id,
                user_id: uid,
                seller_user_id: uid,
                reference_date: dataRef,
                date: dataRef,
                leads: valLeads,
                leads_prev_day: valLeads,
                visitas: valVisitas,
                visit_prev_day: valVisitas,
                agd_net: valAgdNet,
                agd_net_today: valAgdNet,
                vnd_net: valVndNet,
                vnd_net_prev_day: valVndNet,
                metric_scope: 'daily',
                submission_status: 'on_time'
            });
        }
    }

    const finalData = Array.from(uniqueRecords.values());
    console.log(`Inserindo ${finalData.length} registros consolidados em Abril/2026...`);

    for (let i = 0; i < finalData.length; i += 100) {
        const chunk = finalData.slice(i, i + 100);
        const { error } = await supabase.from('daily_checkins').upsert(chunk, { onConflict: 'user_id,store_id,date' });
        if (error) console.error('Erro:', error.message);
    }
    
    console.log('Carga brutal concluída.');
}
loadBrutal();

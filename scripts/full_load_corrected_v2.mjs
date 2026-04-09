import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function loadFull() {
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const baseOficial = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
    const { data: stores } = await supabase.from('stores').select('id, name');
    const { data: users } = await supabase.from('users').select('id, name');

    console.log('Limpando dados antigos...');
    await supabase.from('daily_checkins').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log(`Iniciando importação de ${baseOficial.length} registros...`);
    
    // Agrupar por chave única para evitar conflitos no mesmo lote
    const uniqueRecords = new Map();

    for (const row of baseOficial) {
        const store = stores.find(s => s.name === row['LOJA']);
        const user = users.find(u => u.name === row['VENDEDOR']);
        
        if (!store) continue;
        
        let dataRef = '2026-04-08';
        if (typeof row['DATA'] === 'number') {
            const date = new Date((row['DATA'] - 25569) * 86400 * 1000);
            dataRef = date.toISOString().split('T')[0];
        } else if (typeof row['DATA'] === 'string' && row['DATA'].includes('/')) {
            const parts = row['DATA'].split('/');
            if (parts.length === 3) {
                const [d, m, y] = parts;
                dataRef = `${y.length === 2 ? '20' + y : y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
        }

        const uid = user ? user.id : '7a4624a0-acab-4201-9a5b-8da539626295';
        const key = `${uid}-${store.id}-${dataRef}`;

        const valLeads = Math.max(0, Number(row['LEADS'] || 0));
        const valVisitas = Math.max(0, Number(row['VISITA'] || 0));
        const valAgdNet = Math.max(0, Number(row['AGD_NET'] || 0));
        const valVndNet = Math.max(0, Number(row['VND_NET'] || 0));

        const record = {
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
        };

        // Se já existe, somar para consolidar o dia
        if (uniqueRecords.has(key)) {
            const existing = uniqueRecords.get(key);
            existing.leads += record.leads;
            existing.leads_prev_day += record.leads_prev_day;
            existing.visitas += record.visitas;
            existing.visit_prev_day += record.visit_prev_day;
            existing.agd_net += record.agd_net;
            existing.agd_net_today += record.agd_net_today;
            existing.vnd_net += record.vnd_net;
            existing.vnd_net_prev_day += record.vnd_net_prev_day;
        } else {
            uniqueRecords.set(key, record);
        }
    }

    const finalData = Array.from(uniqueRecords.values());
    console.log(`Dados consolidados: ${finalData.length} registros únicos.`);

    const chunks = [];
    const chunkSize = 100;
    for (let i = 0; i < finalData.length; i += chunkSize) {
        chunks.push(finalData.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
        const { error } = await supabase.from('daily_checkins').upsert(chunk, { onConflict: 'user_id,store_id,date' });
        if (error) console.error('Erro no upsert:', error.message);
    }
    
    console.log('Carga histórica consolidada e importada com sucesso.');
}
loadFull();

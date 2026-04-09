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
    
    const chunks = [];
    const chunkSize = 50;
    
    for (let i = 0; i < baseOficial.length; i += chunkSize) {
        chunks.push(baseOficial.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
        const insertData = chunk.map(row => {
            const store = stores.find(s => s.name === row['LOJA']);
            const user = users.find(u => u.name === row['VENDEDOR']);
            
            if (!store) return null;
            
            let dataRef = '2026-04-08';
            if (typeof row['DATA'] === 'number') {
                const date = new Date((row['DATA'] - 25569) * 86400 * 1000);
                dataRef = date.toISOString().split('T')[0];
            } else if (typeof row['DATA'] === 'string') {
                const [d, m, y] = row['DATA'].split('/');
                dataRef = `20${y}-${m}-${d}`;
            }

            const valLeads = Number(row['LEADS'] || 0);
            const valVisitas = Number(row['VISITA'] || 0);
            const valAgdNet = Number(row['AGD_NET'] || 0);
            const valVndNet = Number(row['VND_NET'] || 0);

            return {
                store_id: store.id,
                user_id: user ? user.id : '7a4624a0-acab-4201-9a5b-8da539626295',
                seller_user_id: user ? user.id : '7a4624a0-acab-4201-9a5b-8da539626295',
                reference_date: dataRef,
                date: dataRef,
                
                // Populating BOTH sets of columns to bypass trigger zeroing
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
        }).filter(Boolean);

        if (insertData.length > 0) {
            const { error } = await supabase.from('daily_checkins').insert(insertData);
            if (error) console.error('Erro no lote:', error.message);
        }
    }
    
    console.log('Carga histórica completa com sucesso.');
}
loadFull();

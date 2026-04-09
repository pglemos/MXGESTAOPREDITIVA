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

    // Limpar tudo
    await supabase.from('daily_checkins').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    for (const row of baseOficial) {
        const store = stores.find(s => s.name === row['LOJA']);
        const user = users.find(u => u.name === row['VENDEDOR']);
        
        if (!store) continue;
        
        // Conversão segura de data (XLSX serial number ou formato DD/MM/AAAA)
        let dataRef = '2026-04-08';
        if (typeof row['DATA'] === 'number') {
            const date = new Date((row['DATA'] - 25569) * 86400 * 1000);
            dataRef = date.toISOString().split('T')[0];
        } else if (typeof row['DATA'] === 'string') {
            const [d, m, y] = row['DATA'].split('/');
            dataRef = `20${y}-${m}-${d}`;
        }

        await supabase.from('daily_checkins').insert({
            store_id: store.id,
            user_id: user ? user.id : '7a4624a0-acab-4201-9a5b-8da539626295', // admin fallback
            seller_user_id: user ? user.id : '7a4624a0-acab-4201-9a5b-8da539626295',
            leads: Number(row['LEADS'] || 0),
            visitas: Number(row['VISITA'] || 0),
            agd_net: Number(row['AGD_NET'] || 0),
            vnd_net: Number(row['VND_NET'] || 0),
            reference_date: dataRef,
            date: dataRef,
            submission_status: 'on_time'
        });
    }
    console.log('Carga histórica concluída.');
}
loadFull();

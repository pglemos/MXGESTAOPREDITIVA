import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function finalImport() {
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const baseOficial = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
    
    // Mapear usuários e lojas para evitar erro de null no banco
    const { data: stores } = await supabase.from('stores').select('id, name');
    const { data: users } = await supabase.from('users').select('id, name');

    for (const row of baseOficial) {
        const store = stores.find(s => s.name === row['LOJA']);
        const user = users.find(u => u.name === row['VENDEDOR']);
        
        if (!store || !user) continue;
        
        const record = {
            store_id: store.id,
            user_id: user.id,
            seller_user_id: user.id,
            leads: row['LEADS'] || 0,
            visitas: row['VISITA'] || 0,
            agd_net: row['AGD_NET'] || 0,
            vnd_net: row['VND_NET'] || 0,
            reference_date: '2026-04-01'
        };
        
        await supabase.from('daily_checkins').insert(record);
    }
    console.log('Importação com mapeamento completo concluída.');
}
finalImport().catch(console.error);

import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function forceImport() {
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const baseOficial = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
    
    // Pegar lojas e usuários para mapeamento correto
    const { data: stores } = await supabase.from('stores').select('id, name');
    const { data: users } = await supabase.from('users').select('id, name');

    for (const row of baseOficial) {
        const store = stores.find(s => s.name === row['LOJA']);
        const user = users.find(u => u.name === row['VENDEDOR']);
        
        if (!store || !user) continue;
        
        // Inserção forcada e detalhada
        const { error } = await supabase.from('daily_checkins').upsert({
            store_id: store.id,
            user_id: user.id,
            seller_user_id: user.id,
            leads: Number(row['LEADS'] || 0),
            visitas: Number(row['VISITA'] || 0),
            agd_net: Number(row['AGD_NET'] || 0),
            vnd_net: Number(row['VND_NET'] || 0),
            reference_date: '2026-04-01',
            date: '2026-04-01'
        }, { onConflict: 'user_id,store_id,date' });
        
        if (error) console.error('Erro na importação de', row['LOJA'], error);
    }
    console.log('Dados importados com sucesso.');
}
forceImport();

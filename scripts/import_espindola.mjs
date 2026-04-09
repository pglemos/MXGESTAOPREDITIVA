import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function importEspindola() {
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const baseOficial = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
    const espindolaData = baseOficial.filter(r => r['LOJA'] === 'ESPINDOLA AUTOMOVEIS');
    
    const { data: store } = await supabase.from('stores').select('id').eq('name', 'ESPINDOLA AUTOMOVEIS').single();
    const { data: users } = await supabase.from('users').select('id').limit(1);

    for (const row of espindolaData) {
        const { error } = await supabase.from('daily_checkins').insert({
            store_id: store.id,
            user_id: users[0].id,
            seller_user_id: users[0].id,
            vnd_net: Number(row['VND_NET'] || 0),
            leads: Number(row['LEADS'] || 0),
            reference_date: '2026-04-08'
        });
        if (error) console.log('Erro ao inserir:', error);
        else console.log('Sucesso ao inserir venda:', row['VND_NET']);
    }
}
importEspindola();

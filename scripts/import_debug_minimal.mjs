import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function importMinimal() {
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const baseOficial = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
    const { data: stores } = await supabase.from('stores').select('id, name');
    
    // Pegar um usuário válido
    const { data: user } = await supabase.from('users').select('id').limit(1);

    for (const row of baseOficial) {
        const store = stores.find(s => s.name === row['LOJA']);
        if (!store) continue;
        
        // Inserir apenas dados básicos para evitar trigger
        const { error } = await supabase.from('daily_checkins').insert({
            store_id: store.id,
            user_id: user[0].id,
            seller_user_id: user[0].id,
            reference_date: '2026-04-03',
            vnd_net: Number(row['VND_NET'] || 0),
            vnd_net_prev_day: Number(row['VND_NET'] || 0) // Tentando popular também o prev_day
        });
        if (error) console.log('Erro:', error);
    }
}
importMinimal();

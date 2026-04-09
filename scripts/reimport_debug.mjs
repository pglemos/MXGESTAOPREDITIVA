import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function reimport() {
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const baseOficial = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
    const { data: stores } = await supabase.from('stores').select('id, name');
    
    for (const row of baseOficial) {
        const store = stores.find(s => s.name === row['LOJA']);
        if (!store) continue;
        
        const { data, error } = await supabase.from('daily_checkins').insert({
            store_id: store.id,
            vnd_net: row['VND_NET'] || 0,
            leads: row['LEADS'] || 0,
            visitas: row['VISITA'] || 0,
            agd_net: row['AGD_NET'] || 0,
            reference_date: '2026-04-01'
        });
        if (error) console.log('Erro ao inserir:', error);
    }
}
reimport();

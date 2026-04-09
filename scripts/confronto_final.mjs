import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runConfronto() {
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const baseOficial = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
    const { data: dbData } = await supabase.from('view_store_daily_production').select('store_id, total_vendas');
    const { data: stores } = await supabase.from('stores').select('id, name');

    console.log('--- CONFRONTO DIRETO DE DADOS ---');
    stores.forEach(store => {
        const planTotal = baseOficial
            .filter(r => r['LOJA'] && r['LOJA'].toUpperCase() === store.name)
            .reduce((acc, r) => acc + (r['VND_NET'] || 0), 0);
        
        const dbTotal = dbData
            .filter(d => d.store_id === store.id)
            .reduce((acc, d) => acc + (d.total_vendas || 0), 0);
            
        console.log(`LOJA: ${store.name.padEnd(20)} | PLANILHA: ${planTotal} | BANCO: ${dbTotal}`);
    });
}
runConfronto().catch(console.error);

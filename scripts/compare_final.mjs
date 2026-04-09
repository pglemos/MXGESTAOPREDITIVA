import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function compare() {
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const config = XLSX.utils.sheet_to_json(workbook.Sheets['CONFIG']).map(r => r['NOME DA LOJA']?.trim().toUpperCase()).filter(Boolean);
    const { data: dbStores } = await supabase.from('stores').select('name');
    const dbNames = dbStores.map(s => s.name.trim().toUpperCase());
    
    console.log('--- SPREADSHEET STORES (10) ---');
    console.log(config.sort());
    
    console.log('\n--- DB STORES (12) ---');
    console.log(dbNames.sort());
    
    const missingInDb = config.filter(s => !dbNames.includes(s));
    console.log('\nMissing in DB:', missingInDb);
}
compare();

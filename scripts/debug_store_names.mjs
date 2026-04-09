import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const base = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
    const { data: stores } = await supabase.from('stores').select('id, name');
    
    const spreadsheetStores = [...new Set(base.map(r => r['LOJA']))].filter(Boolean);
    console.log('Stores in Spreadsheet:', spreadsheetStores);
    
    const missing = spreadsheetStores.filter(s => !stores.find(dbS => dbS.name.trim().toUpperCase() === s.trim().toUpperCase()));
    console.log('Missing in DB:', missing);
}
run();

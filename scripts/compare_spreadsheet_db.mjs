import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const base = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
    
    const spreadsheetTotals = {};
    base.forEach(r => {
        const store = r['LOJA']?.trim().toUpperCase();
        if (!store) return;
        if (!spreadsheetTotals[store]) spreadsheetTotals[store] = { sales: 0 };
        spreadsheetTotals[store].sales += Number(r['VND_NET'] || 0);
    });

    const { data: stores } = await supabase.from('stores').select('id, name');
    const dbTotals = {};
    
    // Fetch ALL records (handling potential 1000 limit)
    let allCheckins = [];
    let from = 0;
    let to = 999;
    while (true) {
        const { data } = await supabase.from('daily_checkins').select('store_id, vnd_net').range(from, to);
        if (!data || data.length === 0) break;
        allCheckins = allCheckins.concat(data);
        from += 1000;
        to += 1000;
    }

    allCheckins.forEach(c => {
        const store = stores.find(s => s.id === c.store_id);
        if (!store) return;
        const name = store.name.trim().toUpperCase();
        if (!dbTotals[name]) dbTotals[name] = { sales: 0 };
        dbTotals[name].sales += Number(c.vnd_net || 0);
    });

    console.log('--- FINAL COMPARISON: SPREADSHEET vs DATABASE ---');
    Object.keys(spreadsheetTotals).sort().forEach(s => {
        const plan = spreadsheetTotals[s].sales;
        const db = dbTotals[s]?.sales || 0;
        console.log(`${s.padEnd(25)} | Spreadsheet: ${plan.toString().padEnd(5)} | DB: ${db.toString().padEnd(5)} | Status: ${plan === db ? '✅ OK' : '❌ MISMATCH'}`);
    });
}
run();

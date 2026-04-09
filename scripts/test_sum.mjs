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
    const { data: users } = await supabase.from('users').select('id, name');

    const uniqueMap = new Map();
    let totalVnd = 0;

    for (const row of base) {
        const storeName = row['LOJA']?.trim().toUpperCase();
        if (!storeName) continue;
        const store = stores.find(s => s.name.trim().toUpperCase() === storeName);
        if (!store) continue;

        const sellerName = row['VENDEDOR']?.trim().toUpperCase();
        const user = sellerName ? users.find(u => u.name.trim().toUpperCase() === sellerName) : null;
        const uid = user ? user.id : '167f189c-a4dd-43d1-9b0f-388c85935719';

        let dateStr = '2026-04-08';
        let rawDate = row['DATA'];
        if (typeof rawDate === 'number') {
            const d = new Date((rawDate - 25569) * 86400 * 1000);
            dateStr = d.toISOString().split('T')[0];
        } else if (typeof rawDate === 'string' && rawDate.includes('/')) {
            const parts = rawDate.split('/');
            dateStr = `${parts[2].length === 2 ? '20'+parts[2] : parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }

        const key = `${uid}-${store.id}-${dateStr}`;
        const vnd = Number(row['VND_NET'] || 0);
        totalVnd += vnd;

        if (uniqueMap.has(key)) {
            uniqueMap.get(key).vnd_net += vnd;
        } else {
            uniqueMap.set(key, { vnd_net: vnd });
        }
    }

    const consolidatedSum = Array.from(uniqueMap.values()).reduce((a, b) => a + b.vnd_net, 0);
    console.log('Total VND_NET from rows:', totalVnd);
    console.log('Total VND_NET from consolidated:', consolidatedSum);
}
run();

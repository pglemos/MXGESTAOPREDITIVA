import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function sync() {
    const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
    const base = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
    const { data: stores } = await supabase.from('stores').select('id, name');
    const { data: users } = await supabase.from('users').select('id, name');

    console.log('Cleaning database...');
    await supabase.from('daily_checkins').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const uniqueMap = new Map();
    let totalSalesPlan = 0;

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

        const sales = Number(row['VND_NET'] || 0);
        totalSalesPlan += sales;

        const key = `${uid}-${store.id}-${dateStr}`;
        if (uniqueMap.has(key)) {
            uniqueMap.get(key).vnd_net += sales;
            uniqueMap.get(key).vnd_net_prev_day += sales;
        } else {
            uniqueMap.set(key, {
                store_id: store.id,
                user_id: uid,
                seller_user_id: uid,
                reference_date: dateStr,
                date: dateStr,
                leads: Number(row['LEADS'] || 0),
                visitas: Number(row['VISITA'] || 0),
                agd_net: Number(row['AGD_NET'] || 0),
                vnd_net: sales,
                vnd_net_prev_day: sales,
                metric_scope: 'daily',
                submission_status: 'on_time'
            });
        }
    }

    const finalData = Array.from(uniqueMap.values());
    console.log('Total sales in Plan:', totalSalesPlan);
    console.log('Consolidated records:', finalData.length);
    console.log('Consolidated sum:', finalData.reduce((a, b) => a + b.vnd_net, 0));

    for (let i = 0; i < finalData.length; i += 100) {
        const chunk = finalData.slice(i, i + 100);
        const { error } = await supabase.from('daily_checkins').upsert(chunk, { onConflict: 'user_id,store_id,date' });
        if (error) console.error('Error chunk:', error.message);
    }
    console.log('Sync complete.');
}
sync();

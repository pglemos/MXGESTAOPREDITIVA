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
    let rowsProcessed = 0;
    let rowsMatched = 0;

    for (const row of base) {
        rowsProcessed++;
        const storeNameRaw = row['LOJA'];
        const sellerNameRaw = row['VENDEDOR'];
        if (!storeNameRaw) continue;

        const storeName = String(storeNameRaw).trim().toUpperCase();
        const store = stores.find(s => s.name.trim().toUpperCase() === storeName);
        
        if (!store) {
            // Silently skip or log once per store
            continue;
        }
        rowsMatched++;

        const sellerName = sellerNameRaw ? String(sellerNameRaw).trim().toUpperCase() : null;
        const user = sellerName ? users.find(u => u.name.trim().toUpperCase() === sellerName) : null;
        const uid = user ? user.id : '167f189c-a4dd-43d1-9b0f-388c85935719'; // Admin MX

        let dateStr = '2026-04-08';
        let rawDate = row['DATA'];
        if (typeof rawDate === 'number') {
            const d = new Date((rawDate - 25569) * 86400 * 1000);
            dateStr = d.toISOString().split('T')[0];
        } else if (typeof rawDate === 'string') {
            const parts = rawDate.split('/');
            if (parts.length === 3) {
                let y = parts[2];
                if (y.length === 2) y = '20' + y;
                if (y === '0026') y = '2026';
                dateStr = `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }

        const key = `${uid}-${store.id}-${dateStr}`;
        const val = {
            leads: Number(row['LEADS'] || 0),
            visitas: Number(row['VISITA'] || 0),
            agd_net: Number(row['AGD_NET'] || 0),
            vnd_net: Number(row['VND_NET'] || 0)
        };

        if (uniqueMap.has(key)) {
            const existing = uniqueMap.get(key);
            existing.leads += val.leads;
            existing.visitas += val.visitas;
            existing.agd_net += val.agd_net;
            existing.vnd_net += val.vnd_net;
        } else {
            uniqueMap.set(key, {
                store_id: store.id,
                user_id: uid,
                seller_user_id: uid,
                reference_date: dateStr,
                date: dateStr,
                ...val,
                leads_prev_day: val.leads,
                visit_prev_day: val.visitas,
                agd_net_today: val.agd_net,
                vnd_net_prev_day: val.vnd_net,
                metric_scope: 'daily',
                submission_status: 'on_time'
            });
        }
    }

    const finalData = Array.from(uniqueMap.values()).filter(r => 
        r.leads >= 0 && r.visitas >= 0 && r.agd_net >= 0 && r.vnd_net >= 0
    );

    console.log(`Summary: ${rowsProcessed} rows processed, ${rowsMatched} matched store, ${finalData.length} unique records consolidated.`);
    
    for (let i = 0; i < finalData.length; i += 100) {
        const { error } = await supabase.from('daily_checkins').upsert(finalData.slice(i, i + 100), { onConflict: 'user_id,store_id,date' });
        if (error) console.error('Error:', error.message);
    }
    console.log('Sync complete.');
}
sync();

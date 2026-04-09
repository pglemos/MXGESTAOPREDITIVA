import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function sync() {
    const content = fs.readFileSync('fonte_da_verdade/BASE_OFICIAL.html', 'utf8');
    const rows = content.match(/<tr.*?>.*?<\/tr>/g);
    
    const { data: stores } = await supabase.from('stores').select('id, name');
    const { data: users } = await supabase.from('users').select('id, name');

    console.log('Cleaning daily_checkins...');
    await supabase.from('daily_checkins').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const uniqueMap = new Map();

    rows.forEach((row, i) => {
        if (i === 0) return; // skip header
        const cells = row.match(/<td.*?>(.*?)<\/td>/g);
        if (!cells || cells.length < 10) return;
        
        const data = cells.map(c => c.replace(/<.*?>/g, '').trim());
        const dateRaw = data[0];
        const storeName = data[1].trim().toUpperCase();
        const sellerName = data[2].trim().toUpperCase();
        const leads = parseInt(data[3]) || 0;
        const vnd_porta = parseInt(data[4]) || 0;
        const agd_cart = parseInt(data[5]) || 0;
        const vnd_cart = parseInt(data[6]) || 0;
        const agd_net = parseInt(data[7]) || 0;
        const vnd_net = parseInt(data[8]) || 0;
        const visitas = parseInt(data[9]) || 0;

        const store = stores.find(s => s.name.trim().toUpperCase() === storeName);
        if (!store) return;

        const user = users.find(u => u.name.trim().toUpperCase() === sellerName);
        const uid = user ? user.id : '167f189c-a4dd-43d1-9b0f-388c85935719'; // Admin MX fallback

        let dateStr = '2026-04-08';
        if (dateRaw.includes('/')) {
            const parts = dateRaw.split('/');
            if (parts.length === 3) {
                let y = parts[2];
                if (y === '0026' || y === '26') y = '2026';
                if (y.length === 2) y = '20' + y;
                dateStr = `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }

        const key = `${uid}-${store.id}-${dateStr}`;
        const val = { leads, visitas, agd_net, vnd_net, vnd_porta, agd_cart, vnd_cart };

        if (uniqueMap.has(key)) {
            const existing = uniqueMap.get(key);
            existing.leads += val.leads;
            existing.visitas += val.visitas;
            existing.agd_net += val.agd_net;
            existing.vnd_net += val.vnd_net;
            existing.vnd_porta += val.vnd_porta;
            existing.agd_cart += val.agd_cart;
            existing.vnd_cart += val.vnd_cart;
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
    });

    const finalData = Array.from(uniqueMap.values()).filter(r => 
        r.leads >= 0 && r.visitas >= 0 && r.agd_net >= 0 && r.vnd_net >= 0
    );

    console.log(`Inserting ${finalData.length} unique records from HTML source...`);
    
    for (let i = 0; i < finalData.length; i += 100) {
        const { error } = await supabase.from('daily_checkins').upsert(finalData.slice(i, i + 100), { onConflict: 'user_id,store_id,date' });
        if (error) console.error('Error in batch:', error.message);
    }
    
    console.log('HTML Import complete.');
}
sync();

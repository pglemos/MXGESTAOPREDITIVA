import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('--- DEEP SYNC V2 START ---');

    // 1. Wipe everything
    const tablesToWipe = [
        'daily_checkins', 'daily_lead_volumes', 'feedbacks', 'pdis', 'pdi_reviews', 
        'raw_imports', 'report_history', 'reprocess_logs', 'whatsapp_share_logs', 
        'audit_logs', 'goal_logs', 'goals', 'inventory', 'manager_routine_logs',
        'notification_reads', 'notifications', 'store_meta_rules_history',
        'training_progress', 'memberships', 'user_roles', 'store_meta_rules', 'store_sellers'
    ];
    
    for (const table of tablesToWipe) {
        await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    // 2. Clear users (keep current admin)
    const { data: adminUser } = await supabase.from('users').select('id').eq('email', 'admin@mxperformance.com.br').single();
    if (adminUser) {
        await supabase.from('users').delete().neq('id', adminUser.id);
    } else {
        await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
    
    // 3. Clear stores
    await supabase.from('stores').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 4. Load CONFIG.html (Stores & Goals)
    const configContent = fs.readFileSync('fonte_da_verdade/CONFIG.html', 'utf8');
    const configRows = configContent.match(/<tr.*?>.*?<\/tr>/g);
    const storeMap = new Map();

    for (let i = 1; i < configRows.length; i++) {
        const cells = configRows[i].match(/<td.*?>(.*?)<\/td>/g);
        if (!cells || cells.length < 3) continue;
        const data = cells.map(c => c.replace(/<.*?>/g, '').trim());
        const name = data[0];
        const emails = data[1];
        const goal = parseInt(data[2]) || 0;

        if (!name || name === 'NOME DA LOJA') continue;

        const { data: store, error } = await supabase.from('stores').insert({
            name: name,
            active: true,
            manager_email: emails.split(',')[0] || null
        }).select().single();

        if (store) {
            console.log('Created store:', name);
            storeMap.set(name.toUpperCase(), store.id);
            await supabase.from('store_meta_rules').insert({ store_id: store.id, monthly_goal: goal });
        }
    }

    // 5. Load BASE_OFICIAL.html (Users & Checkins)
    const baseContent = fs.readFileSync('fonte_da_verdade/BASE_OFICIAL.html', 'utf8');
    const baseRows = baseContent.match(/<tr.*?>.*?<\/tr>/g);
    const userMap = new Map();
    const uniqueCheckinMap = new Map();

    for (let i = 1; i < baseRows.length; i++) {
        const cells = baseRows[i].match(/<td.*?>(.*?)<\/td>/g);
        if (!cells || cells.length < 10) continue;
        const data = cells.map(c => c.replace(/<.*?>/g, '').trim());
        
        const dateRaw = data[0];
        const storeName = data[1].toUpperCase();
        const sellerName = data[2].trim().toUpperCase();
        const metrics = {
            leads: parseInt(data[3]) || 0,
            visitas: parseInt(data[9]) || 0,
            agd_net: parseInt(data[7]) || 0,
            vnd_net: parseInt(data[8]) || 0
        };

        const storeId = storeMap.get(storeName);
        if (!storeId) continue;

        // Ensure user exists
        let userId = userMap.get(sellerName);
        if (!userId && sellerName) {
            const { data: user, error } = await supabase.from('users').insert({
                name: data[2],
                email: `${sellerName.toLowerCase().replace(/\s/g, '.')}@mxperformance.com`,
                role: 'vendedor',
                active: true
            }).select().single();
            
            if (user) {
                userId = user.id;
                userMap.set(sellerName, userId);
                await supabase.from('memberships').insert({ user_id: userId, store_id: storeId, role: 'vendedor' });
            } else {
                console.error('Error creating user:', sellerName, error?.message);
            }
        }

        const uid = userId || adminUser?.id;
        if (!uid) continue;
        
        let dateStr = '2026-04-08';
        if (dateRaw.includes('/')) {
            const parts = dateRaw.split('/');
            let y = parts[2];
            if (y === '0026' || y === '26') y = '2026';
            dateStr = `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }

        const key = `${uid}-${storeId}-${dateStr}`;
        if (uniqueCheckinMap.has(key)) {
            const ex = uniqueCheckinMap.get(key);
            ex.leads += metrics.leads;
            ex.visitas += metrics.visitas;
            ex.agd_net += metrics.agd_net;
            ex.vnd_net += metrics.vnd_net;
        } else {
            uniqueCheckinMap.set(key, {
                store_id: storeId,
                user_id: uid,
                seller_user_id: uid,
                reference_date: dateStr,
                date: dateStr,
                ...metrics,
                leads_prev_day: metrics.leads,
                visit_prev_day: metrics.visitas,
                agd_net_today: metrics.agd_net,
                vnd_net_prev_day: metrics.vnd_net,
                metric_scope: 'daily',
                submission_status: 'on_time'
            });
        }
    }

    const finalCheckins = Array.from(uniqueCheckinMap.values());
    console.log(`Inserting ${finalCheckins.length} consolidated records...`);
    for (let i = 0; i < finalCheckins.length; i += 100) {
        const { error } = await supabase.from('daily_checkins').upsert(finalCheckins.slice(i, i + 100), { onConflict: 'user_id,store_id,date' });
        if (error) console.error('Batch error:', error.message);
    }

    console.log('--- DEEP SYNC COMPLETE ---');
}
run();

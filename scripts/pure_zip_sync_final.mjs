import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function normalizeEmail(name) {
    return name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9]/g, ".") // replace non-alphanumeric with dot
        .replace(/\.+/g, ".") // remove multiple dots
        .replace(/^\.|\.$/g, ""); // remove leading/trailing dots
}

async function run() {
    console.log('--- PURE ZIP SYNC FINAL START ---');

    // 1. Wipe operational tables
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

    // 2. Wipe ALL Auth Users (except admin) with pagination
    console.log('Deleting all auth users...');
    let hasMore = true;
    while (hasMore) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers();
        const usersToDelete = users.filter(u => u.email !== 'admin@mxperformance.com.br');
        if (usersToDelete.length === 0) {
            hasMore = false;
        } else {
            for (const user of usersToDelete) {
                await supabase.auth.admin.deleteUser(user.id);
            }
        }
    }
    console.log('Auth users wiped.');

    // 3. Clear Public Users (except admin)
    const { data: adminUser } = await supabase.from('users').select('id').eq('email', 'admin@mxperformance.com.br').single();
    if (adminUser) {
        await supabase.from('users').delete().neq('id', adminUser.id);
    } else {
        await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    // 4. Clear and Load Stores
    await supabase.from('stores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const configContent = fs.readFileSync('fonte_da_verdade/CONFIG.html', 'utf8');
    const configRows = configContent.match(/<tr.*?>.*?<\/tr>/g);
    const storeMap = new Map();

    for (let i = 1; i < configRows.length; i++) {
        const cells = configRows[i].match(/<td.*?>(.*?)<\/td>/g);
        if (!cells || cells.length < 3) continue;
        const data = cells.map(c => c.replace(/<.*?>/g, '').trim());
        const name = data[0];
        if (!name || name === 'NOME DA LOJA' || name.includes('@')) continue;

        const { data: store } = await supabase.from('stores').insert({ name, active: true }).select().single();
        if (store) {
            storeMap.set(name.toUpperCase(), store.id);
            await supabase.from('store_meta_rules').insert({ store_id: store.id, monthly_goal: parseInt(data[2]) || 0 });
        }
    }

    // 5. Load Sellers and Checkins from BASE_OFICIAL.html
    const baseContent = fs.readFileSync('fonte_da_verdade/BASE_OFICIAL.html', 'utf8');
    const baseRows = baseContent.match(/<tr.*?>.*?<\/tr>/g);
    const userMap = new Map();
    const uniqueCheckinMap = new Map();

    console.log('Processing sellers and checkins...');
    for (let i = 1; i < baseRows.length; i++) {
        const cells = baseRows[i].match(/<td.*?>(.*?)<\/td>/g);
        if (!cells || cells.length < 10) continue;
        const data = cells.map(c => c.replace(/<.*?>/g, '').trim());
        
        const storeName = data[1].toUpperCase();
        const sellerNameRaw = data[2].trim();
        const sellerName = sellerNameRaw.toUpperCase();
        const storeId = storeMap.get(storeName);
        if (!storeId) continue;

        // Ensure user exists
        let userId = userMap.get(sellerName);
        if (!userId && sellerName) {
            const email = `${normalizeEmail(sellerName)}@mxperformance.com`;
            const { data: authUser, error } = await supabase.auth.admin.createUser({
                email,
                password: 'InitialPassword123!',
                email_confirm: true,
                user_metadata: { name: sellerNameRaw }
            });
            
            if (authUser?.user) {
                userId = authUser.user.id;
                userMap.set(sellerName, userId);
                await supabase.from('users').upsert({
                    id: userId,
                    name: sellerNameRaw,
                    email,
                    role: 'vendedor',
                    active: true
                });
                await supabase.from('memberships').insert({ user_id: userId, store_id: storeId, role: 'vendedor' });
            } else {
                // If user already exists (shouldn't happen with wipe, but for safety)
                const { data: { users } } = await supabase.auth.admin.listUsers();
                const existing = users.find(u => u.email === email);
                if (existing) {
                    userId = existing.id;
                    userMap.set(sellerName, userId);
                } else {
                    console.error(`Error creating user ${sellerName}:`, error?.message);
                }
            }
        }

        const uid = userId || adminUser?.id;
        if (!uid) continue;

        let dateStr = '2026-04-08';
        if (data[0].includes('/')) {
            const parts = data[0].split('/');
            let y = parts[2];
            if (y === '0026' || y === '26') y = '2026';
            dateStr = `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }

        const key = `${uid}-${storeId}-${dateStr}`;
        const metrics = {
            leads: parseInt(data[3]) || 0,
            visitas: parseInt(data[9]) || 0,
            agd_net: parseInt(data[7]) || 0,
            vnd_net: parseInt(data[8]) || 0,
            vnd_porta: parseInt(data[4]) || 0,
            agd_cart: parseInt(data[5]) || 0,
            vnd_cart: parseInt(data[6]) || 0
        };

        if (uniqueCheckinMap.has(key)) {
            const ex = uniqueCheckinMap.get(key);
            ex.leads += metrics.leads;
            ex.visitas += metrics.visitas;
            ex.agd_net += metrics.agd_net;
            ex.vnd_net += metrics.vnd_net;
            ex.vnd_porta += metrics.vnd_porta;
            ex.agd_cart += metrics.agd_cart;
            ex.vnd_cart += metrics.vnd_cart;
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
        await supabase.from('daily_checkins').upsert(finalCheckins.slice(i, i + 100), { onConflict: 'user_id,store_id,date' });
    }

    console.log('--- PURE ZIP SYNC FINAL COMPLETE ---');
}
run();

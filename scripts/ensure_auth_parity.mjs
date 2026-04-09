import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: publicUsers } = await supabase.from('users').select('*');
    
    let allAuthUsers = [];
    let page = 1;
    while (true) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 50 });
        if (!users || users.length === 0) break;
        allAuthUsers = allAuthUsers.concat(users);
        page++;
    }

    console.log(`Public: ${publicUsers.length}, Auth: ${allAuthUsers.length}`);

    for (const pu of publicUsers) {
        if (pu.email === 'admin@mxperformance.com.br') continue;
        const exists = allAuthUsers.find(au => au.email === pu.email);
        if (!exists) {
            console.log(`Creating missing auth user: ${pu.email}`);
            await supabase.auth.admin.createUser({
                id: pu.id,
                email: pu.email,
                password: 'InitialPassword123!',
                email_confirm: true,
                user_metadata: { name: pu.name }
            });
        }
    }
    console.log('Parity check complete.');
}
run();

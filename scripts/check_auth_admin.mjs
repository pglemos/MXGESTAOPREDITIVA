import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const admin = users.find(u => u.email === 'admin@mxperformance.com.br');
    console.log('Auth Admin ID:', admin?.id);
}
check();

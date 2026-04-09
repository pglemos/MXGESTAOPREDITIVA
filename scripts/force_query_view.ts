import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkViewData() {
    const { data, error } = await supabase.from('view_store_daily_production').select('*');
    if (error) console.error(error);
    else console.table(data.filter(r => r.total_vendas > 0));
}
checkViewData();

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// A lógica de agregação precisa ser robusta
async function verifyData() {
    const { data, error } = await supabase
        .from('daily_checkins')
        .select('store_id, vnd_net, leads, visitas, agd_net');
    
    if (error) console.error(error);
    else console.log('Dados totais recuperados:', data.length);
}
verifyData();

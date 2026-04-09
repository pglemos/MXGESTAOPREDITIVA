import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkView() {
    // Verificar se a view realmente retorna dados SEM qualquer filtro
    const { data, error } = await supabase.from('view_store_daily_production').select('*');
    if (error) {
        console.error('Erro na view:', error);
    } else {
        console.log('Total de registros na view:', data.length);
        console.log('Exemplo:', data[0]);
    }
}
checkView();

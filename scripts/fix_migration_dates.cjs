const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
    console.log('Corrigindo datas das migrações...');
    // Atualiza datas corrompidas para o período corrente (Abril 2026)
    const { data, error } = await supabase
        .from('daily_checkins')
        .update({ reference_date: '2026-04-07' })
        .lt('reference_date', '2026-04-01');

    if (error) console.error(error);
    else console.log('Registros corrigidos.');
}
fix();

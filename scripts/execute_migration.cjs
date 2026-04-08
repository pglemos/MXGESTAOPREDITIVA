const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');

async function migrate() {
    const configData = XLSX.utils.sheet_to_json(workbook.Sheets['CONFIG']);
    
    for (const row of configData) {
        const storeName = row['NOME DA LOJA'];
        const meta = row['META'];
        const managerEmails = row['EMAIL GERENTE'];
        
        console.log(`Migrating store: ${storeName}`);
        
        // 1. Create/Get Store
        let { data: store, error: storeErr } = await supabase
            .from('stores')
            .upsert({ name: storeName, manager_email: managerEmails.split(',')[0], active: true }, { onConflict: 'name' })
            .select()
            .single();
        
        // 2. Set Meta
        await supabase.from('store_meta_rules').upsert({
            store_id: store.id,
            monthly_goal: meta
        });
    }
}
migrate().then(() => console.log('Done')).catch(console.error);

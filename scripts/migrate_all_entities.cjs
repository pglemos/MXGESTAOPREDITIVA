const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
const sqlFile = 'scripts/full_migration.sql';

if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile);

const appendSql = (sql) => fs.appendFileSync(sqlFile, sql + '\n');

// 1. Stores & Goals
const config = XLSX.utils.sheet_to_json(workbook.Sheets['CONFIG']);
config.forEach(row => {
    const name = row['NOME DA LOJA'].replace(/'/g, "''");
    const meta = row['META'];
    appendSql(`INSERT INTO public.stores (name, active) VALUES ('${name}', true) ON CONFLICT (name) DO NOTHING;`);
    appendSql(`INSERT INTO public.store_meta_rules (store_id, monthly_goal) VALUES ((SELECT id FROM public.stores WHERE name = '${name}'), ${meta}) ON CONFLICT (store_id) DO UPDATE SET monthly_goal = EXCLUDED.monthly_goal;`);
});

// 2. Base Oficial (Checkins & Sellers)
const base = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
base.forEach(row => {
    const storeName = row['LOJA'].replace(/'/g, "''");
    const sellerName = row['VENDEDOR'].replace(/'/g, "''");
    
    // Upsert User (Seller)
    appendSql(`INSERT INTO public.users (name, email, role) VALUES ('${sellerName}', '${sellerName.toLowerCase().replace(' ', '.')}@mx.com', 'vendedor') ON CONFLICT (email) DO NOTHING;`);
    
    // Map Checkin
    const date = new Date((row['DATA'] - 25569) * 86400 * 1000).toISOString().split('T')[0];
    appendSql(`INSERT INTO public.daily_checkins (
        store_id, seller_user_id, reference_date, leads_prev_day, 
        vnd_porta_prev_day, agd_cart_prev_day, vnd_cart_prev_day, 
        agd_net_prev_day, vnd_net_prev_day, visit_prev_day
    ) VALUES (
        (SELECT id FROM public.stores WHERE name = '${storeName}'),
        (SELECT id FROM public.users WHERE name = '${sellerName}' LIMIT 1),
        '${date}', ${row['LEADS'] || 0}, ${row['VND_PORTA'] || 0}, ${row['AGD_CART'] || 0}, ${row['VND_CART'] || 0}, ${row['AGD_NET'] || 0}, ${row['VND_NET'] || 0}, ${row['VISITA'] || 0}
    ) ON CONFLICT DO NOTHING;`);
});

console.log('Migration SQL generated in ' + sqlFile);

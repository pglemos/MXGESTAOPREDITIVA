const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx');
const sqlFile = 'scripts/full_migration.sql';

if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile);
const appendSql = (sql) => fs.appendFileSync(sqlFile, sql + '\n');

// 1. Stores
const config = XLSX.utils.sheet_to_json(workbook.Sheets['CONFIG']);
config.forEach(row => {
    const name = row['NOME DA LOJA'].replace(/'/g, "''");
    appendSql(`INSERT INTO public.stores (name, active) VALUES ('${name}', true) ON CONFLICT (name) DO NOTHING;`);
});

// 2. Base Oficial
const base = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_OFICIAL']);
base.forEach(row => {
    const storeName = row['LOJA'].replace(/'/g, "''");
    const sellerName = row['VENDEDOR'].replace(/'/g, "''");
    
    // Proper Excel date handle
    let dateStr = row['DATA'];
    let formattedDate = '2026-01-01';
    
    if (typeof dateStr === 'number') {
        const d = new Date((dateStr - 25569) * 86400 * 1000);
        formattedDate = d.toISOString().split('T')[0];
    } else if (typeof dateStr === 'string') {
        const parts = dateStr.split('/');
        // Assuming dd/mm/yyyy format
        if (parts.length === 3) {
           formattedDate = `20${parts[2].slice(-2)}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }

    appendSql(`INSERT INTO public.users (name, email, role) VALUES ('${sellerName}', '${sellerName.toLowerCase().replace(/\s+/g, '.')}@mx.com', 'vendedor') ON CONFLICT (email) DO NOTHING;`);
    appendSql(`INSERT INTO public.daily_checkins (
        store_id, seller_user_id, reference_date, leads_prev_day, 
        vnd_porta_prev_day, agd_cart_prev_day, vnd_cart_prev_day, 
        agd_net_prev_day, vnd_net_prev_day, visit_prev_day
    ) VALUES (
        (SELECT id FROM public.stores WHERE name = '${storeName}' LIMIT 1),
        (SELECT id FROM public.users WHERE name = '${sellerName}' LIMIT 1),
        '${formattedDate}', ${row['LEADS'] || 0}, ${row['VND_PORTA'] || 0}, ${row['AGD_CART'] || 0}, ${row['VND_CART'] || 0}, ${row['AGD_NET'] || 0}, ${row['VND_NET'] || 0}, ${row['VISITA'] || 0}
    ) ON CONFLICT DO NOTHING;`);
});

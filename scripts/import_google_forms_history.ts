import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fileContent = fs.readFileSync('/Users/pedroguilherme/.gemini/antigravity/brain/dc83fa6a-dccf-4782-94e5-dc622094a005/.system_generated/steps/93/content.md', 'utf-8');

// The file has a markdown string at the top from a previous extraction
const lines = fileContent.split('\n');
const startIdx = lines.findIndex(l => l.startsWith('Carimbo de data/hora') || l.startsWith('DATA'));
const csvData = startIdx !== -1 ? lines.slice(startIdx).join('\n') : fileContent;

const records = parse(csvData, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  // expects DD/MM/YYYY or DD/MM/002X (which is a typo of 202X) or YYYY-MM-DD
  if (dateStr.includes('/')) {
    const parts = dateStr.split(' ')[0].split('/'); // split by space to remove time
    if (parts.length === 3) {
      let [d, m, y] = parts;
      if (y.startsWith('002')) {
        y = '202' + y.slice(3); // fix 0026 -> 2026
      }
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split(' ')[0].split('-');
    if (parts.length === 3) {
        if(parts[0].length === 4) return dateStr.split(' ')[0]; // yyyy-mm-dd
    }
  }
  return null;
}

// Ensure the final insertion uses Postgres ISO date YYYY-MM-DD, but internally it's all processed correctly
// "A data precisa sempre ficar nesse formato DIA/MES/ANO exemplo 01/01/2026" - This is for the UI, DB expects ISO.

async function run() {
  console.log(`Buscando ${records.length} registros no CSV...`);
  
  // Fetch existing stores and users
  const { data: stores } = await supabase.from('stores').select('id, name');
  const { data: users } = await supabase.from('users').select('id, store_id, name, full_name, email');

  console.log(`Encontradas ${stores?.length || 0} lojas e ${users?.length || 0} usuarios no banco.`);

  const storeMap = new Map();
  stores?.forEach(s => storeMap.set(s.name.toLowerCase().trim(), s.id));

  // The DB uses "full_name" or "name", let's map loosely
  const userMap = new Map();
  users?.forEach(u => {
      userMap.set(u.name?.toLowerCase().trim(), u.id);
      userMap.set(u.full_name?.toLowerCase().trim(), u.id);
  });

  const parsedData = [];
  const unmatchedUsers = new Set();
  const unmatchedStores = new Set();

  for (const row of records) {
    // Determine Store
    let lojaName = row['Qual a sua Loja?'] || row['LOJA'];
    if (!lojaName) continue; // Skip totally empty rows
    lojaName = lojaName.trim();

    // Determine Seller
    let userName = row['VENDEDOR'];
    if (!userName) {
        for (const key of Object.keys(row)) {
          if (key.includes('Selecione seu Nome') && row[key]) {
            userName = row[key];
            break;
          }
        }
    }
    if (!userName) userName = "DESCONHECIDO";
    userName = userName.trim();

    // Mapping Values safely using multiple possible headers from history
    const dateCsv = row['Carimbo de data/hora'] || row['DATA'] || '';
    const refDateCsv = row['DATA DE REFERÊNCIA'] || row['Data de Referência'] || '';
    const leads = parseInt(row['LEADS NOVOS RECEBIDOS NO DIA ANTERIOR'] || row['LEADS NOVOS DIA'] || row['LEADS'] || '0') || 0;
    const agdCart = parseInt(row['AGENDAMENTOS CARTEIRA ( HOJE )'] || row['Agendamentos Carteira (Hoje)'] || row['AGD_CART'] || '0') || 0;
    const agdNet = parseInt(row['AGENDAMENTOS INTERNET ( HOJE )'] || row['Agendamentos Internet (Hoje)'] || row['AGD_NET'] || '0') || 0;
    const vndPorta = parseInt(row['VENDAS PORTA ( ONTEM )'] || row['Vendas Porta (Ontem)'] || row['VND_PORTA'] || '0') || 0;
    const vndCart = parseInt(row['VENDAS CARTEIRA VENDEDOR ( ONTEM )'] || row['Vendas Carteira (Ontem)'] || row['VND_CART'] || '0') || 0;
    const vndNet = parseInt(row['VENDAS INTERNET ( ONTEM )'] || row['Vendas Internet (Ontem)'] || row['VND_NET'] || '0') || 0;
    const visitas = parseInt(row['COMPARECIMENTO DE VISITAS ( ONTEM )'] || row['VISITA'] || '0') || 0;

    const dateStr = parseDate(dateCsv) || new Date().toISOString().split('T')[0];
    const refDateStr = parseDate(refDateCsv) || dateStr;

    const storeId = storeMap.get(lojaName.toLowerCase());
    if (!storeId) unmatchedStores.add(lojaName);

    const userId = userMap.get(userName.toLowerCase());
    if (!userId) unmatchedUsers.add(userName);

    parsedData.push({
      store_id: storeId,
      user_id: userId,
      date: dateStr,
      reference_date: refDateStr,
      leads,
      agd_cart: agdCart,
      agd_net: agdNet,
      vnd_porta: vndPorta,
      vnd_cart: vndCart,
      vnd_net: vndNet,
      visitas,
      metric_scope: 'historical'
    });
  }

  console.log(`Processados: ${parsedData.length} registros válidos.`);
  console.log(`Lojas SEM MAPEAMENTO (${unmatchedStores.size}):`, Array.from(unmatchedStores));
  console.log(`Vendedores SEM MAPEAMENTO (${unmatchedUsers.size}):`, Array.from(unmatchedUsers));

  // Saving the parsed result temporarily so the user can verify
  fs.writeFileSync('/tmp/parsed_migration_dryrun.json', JSON.stringify({
      unmatchedStores: Array.from(unmatchedStores),
      unmatchedUsers: Array.from(unmatchedUsers),
      sampleData: parsedData.slice(0, 5) // first 5 for review
  }, null, 2));

  console.log('\nDRY-RUN Concluído! Favor revisar /tmp/parsed_migration_dryrun.json');
}

run().catch(console.error);

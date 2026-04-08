import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], records: [] };
  
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let curVal = '';
    let inQuotes = false;
    for (let char of lines[i]) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(curVal.trim());
        curVal = '';
      } else {
        curVal += char;
      }
    }
    values.push(curVal.trim());
    records.push(values);
  }
  return { headers, records };
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes('/')) {
    const parts = dateStr.split(' ')[0].split('/'); 
    if (parts.length === 3) {
      let [d, m, y] = parts;
      if (y.startsWith('002')) y = '202' + y.slice(3);
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split(' ')[0].split('-');
    if (parts.length === 3) {
        if(parts[0].length === 4) return dateStr.split(' ')[0]; 
    }
  }
  return null;
}

async function run() {
  const filePath = "import_data.csv";
  console.log(`Lendo CSV local de ${filePath}...`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const sourceLines = fileContent.split(/\r?\n/);
  const startIdx = sourceLines.findIndex(l => l.includes('Carimbo de data/hora') || l.includes('DATA'));
  const csvData = startIdx !== -1 ? sourceLines.slice(startIdx).join('\n') : fileContent;

  const { headers, records } = parseCSV(csvData);
  console.log(`Buscando ${records.length} registros no CSV...`);
  
  const { data: stores, error: err1 } = await supabase.from('stores').select('id, name');
  const { data: users, error: err2 } = await supabase.from('users').select('id, name, email');

  const storeMap = new Map();
  stores?.forEach(s => storeMap.set(s.name.toLowerCase().trim(), s.id));

  const userMap = new Map();
  users?.forEach(u => {
      if (u.name) userMap.set(u.name.toLowerCase().trim(), u.id);
  });

  // Find column indices
  const getIdx = (name) => {
      const idxs = [];
      headers.forEach((h, i) => { if (h.toUpperCase().includes(name.toUpperCase())) idxs.push(i); });
      return idxs;
  };

  const storeIdxs = [...getIdx('Qual a sua Loja?'), ...getIdx('LOJA')];
  const nameIdxs = [...getIdx('Selecione seu Nome'), ...getIdx('VENDEDOR')];
  const dateIdxs = [...getIdx('Carimbo de data/hora'), ...getIdx('DATA')];
  const refDateIdxs = [...getIdx('DATA DE REFERÊNCIA'), ...getIdx('Data de Referência')];
  
  const leadsIdxs = [...getIdx('LEADS NOVOS RECEBIDOS NO DIA ANTERIOR'), ...getIdx('LEADS NOVOS DIA'), ...getIdx('LEADS')];
  const agdCartIdxs = [...getIdx('AGENDAMENTOS CARTEIRA ( HOJE )'), ...getIdx('Agendamentos Carteira (Hoje)'), ...getIdx('AGD_CART')];
  const agdNetIdxs = [...getIdx('AGENDAMENTOS INTERNET ( HOJE )'), ...getIdx('Agendamentos Internet (Hoje)'), ...getIdx('AGD_NET')];
  const vndPortaIdxs = [...getIdx('VENDAS PORTA ( ONTEM )'), ...getIdx('Vendas Porta (Ontem)'), ...getIdx('VND_PORTA')];
  const vndCartIdxs = [...getIdx('VENDAS CARTEIRA VENDEDOR ( ONTEM )'), ...getIdx('Vendas Carteira (Ontem)'), ...getIdx('VND_CART')];
  const vndNetIdxs = [...getIdx('VENDAS INTERNET ( ONTEM )'), ...getIdx('Vendas Internet (Ontem)'), ...getIdx('VND_NET')];
  const visitasIdxs = [...getIdx('COMPARECIMENTO DE VISITAS ( ONTEM )'), ...getIdx('VISITA')];

  const getValue = (row, idxs) => {
      for (const idx of idxs) {
          if (row[idx] && row[idx].trim()) return row[idx].trim();
      }
      return null;
  };

  const parsedData = [];
  const missingUsersMap = new Map(); // StoreName -> Set of UserNames

  for (const row of records) {
    const lojaName = getValue(row, storeIdxs);
    if (!lojaName) continue; 

    let userName = getValue(row, nameIdxs);
    if (!userName) userName = "DESCONHECIDO";

    const dateCsv = getValue(row, dateIdxs) || '';
    const refDateCsv = getValue(row, refDateIdxs) || '';
    const leads = parseInt(getValue(row, leadsIdxs) || '0') || 0;
    const agdCart = parseInt(getValue(row, agdCartIdxs) || '0') || 0;
    const agdNet = parseInt(getValue(row, agdNetIdxs) || '0') || 0;
    const vndPorta = parseInt(getValue(row, vndPortaIdxs) || '0') || 0;
    const vndCart = parseInt(getValue(row, vndCartIdxs) || '0') || 0;
    const vndNet = parseInt(getValue(row, vndNetIdxs) || '0') || 0;
    const visitas = parseInt(getValue(row, visitasIdxs) || '0') || 0;

    const dateStr = parseDate(dateCsv) || new Date().toISOString().split('T')[0];
    const refDateStr = parseDate(refDateCsv) || dateStr;

    const storeId = storeMap.get(lojaName.toLowerCase());
    const userId = userMap.get(userName.toLowerCase());

    if (!userId && userName !== "DESCONHECIDO") {
        if (!missingUsersMap.has(lojaName)) missingUsersMap.set(lojaName, new Set());
        missingUsersMap.get(lojaName).add(userName);
    }

    parsedData.push({
      store_id: storeId,
      user_id: userId,
      user_name_csv: userName, // Keep for later matching
      store_name_csv: lojaName,
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

  console.log(`Processados: ${parsedData.length} registros no CSV.`);
  console.log('--- Resumo de Usuários Ausentes ---');
  const missingUsersList = [];
  Array.from(missingUsersMap.entries()).forEach(([storeName, userNames]) => {
      const storeId = storeMap.get(storeName.toLowerCase());
      console.log(`${storeName}: ${userNames.size} usuários novos`);
      userNames.forEach(name => {
          missingUsersList.push({ name, storeName, storeId });
      });
  });

  if (missingUsersList.length > 0) {
      console.log(`\nCriando ${missingUsersList.length} usuários ausentes via Auth Admin...`);
      for (const u of missingUsersList) {
          const email = `${u.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '.')}@mxperformance.com`;
          
          // First check if auth user exists
          const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
          const existingAuth = listData?.users?.find(au => au.email === email);
          
          let userId;
          if (existingAuth) {
              userId = existingAuth.id;
              console.log(`Usuário ${u.name} já existe no Auth (ID: ${userId})`);
          } else {
              const { data: newUser, error } = await supabase.auth.admin.createUser({
                  email: email,
                  password: crypto.randomUUID(), // Random password
                  user_metadata: { name: u.name, role: 'vendedor' },
                  email_confirm: true
              });

              if (error) {
                  console.error(`Erro ao criar usuário Auth ${u.name}:`, error.message);
                  continue;
              }
              userId = newUser.user.id;
              console.log(`Usuário ${u.name} criado (ID: ${userId})`);
          }

          if (userId) {
              userMap.set(u.name.toLowerCase().trim(), userId);
          }
      }
      console.log('Criação de usuários concluída.');
  }

  // Update checkins with newly created user IDs
  const rawList = [];
  parsedData.forEach(d => {
      if (!d.user_id) {
          d.user_id = userMap.get(d.user_name_csv.toLowerCase().trim());
      }
      if (d.store_id && d.user_id) {
          // Remove helper fields before insertion
          const { user_name_csv, store_name_csv, ...cleanData } = d;
          rawList.push(cleanData);
      }
  });

  // Deduplicate records in the script to avoid "ON CONFLICT DO UPDATE command cannot affect row a second time"
  const deduplicatedMap = new Map();
  rawList.forEach(record => {
      const key = `${record.user_id}:${record.store_id}:${record.date}`;
      deduplicatedMap.set(key, record);
  });
  const finalUniqueRecords = Array.from(deduplicatedMap.values());

  console.log(`\nIniciando inserção de ${finalUniqueRecords.length} registros de check-in (usando UPSERT e deduplicação)...`);
  const CHUNK_SIZE = 500;
  let inserted = 0;
  
  for (let i = 0; i < finalUniqueRecords.length; i += CHUNK_SIZE) {
    const chunk = finalUniqueRecords.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('daily_checkins').upsert(chunk, { onConflict: 'user_id,store_id,date' });
    if (error) {
      console.error('Error upserting chunk:', error);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`Processado ${inserted}/${finalUniqueRecords.length} registros...`);
  }
  console.log('\nMigração Concluída com Sucesso!');
}

run().catch(console.error);


import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = "https://fbhcmzzgwjdgkctlfvbo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaGNtenpnd2pkZ2tjdGxmdmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk1NDI1MiwiZXhwIjoyMDg3NTMwMjUyfQ.XMgPD1xn75n4pDQJf6Q9e7bheFxi9_enelcKocWsfpQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrate() {
  console.log("🚀 Iniciando migração de dados legados...");

  const configData = JSON.parse(fs.readFileSync('/tmp/config_full.json', 'utf8'));
  const baseOficial = JSON.parse(fs.readFileSync('/tmp/base_oficial_full.json', 'utf8'));

  const storeMap = new Map();
  for (const row of configData) {
    const storeName = row["NOME DA LOJA"].trim();
    const managerEmail = row["EMAIL GERENTE"];
    const goal = parseInt(row["META"]) || 0;

    // Buscar loja existente
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .ilike('name', storeName)
      .maybeSingle();

    let storeId;
    if (existingStore) {
      storeId = existingStore.id;
      await supabase.from('stores').update({ manager_email: managerEmail, active: true }).eq('id', storeId);
    } else {
      const { data: newStore, error: insertError } = await supabase
        .from('stores')
        .insert({ name: storeName, manager_email: managerEmail, source_mode: 'hybrid' })
        .select()
        .single();
      
      if (insertError) {
        console.error(`❌ Erro ao inserir loja ${storeName}:`, insertError.message);
        continue;
      }
      storeId = newStore.id;
    }
    
    storeMap.set(storeName.toUpperCase(), storeId);
    console.log(`✅ Loja processada: ${storeName} (${storeId})`);

    // Gosto de Abril 2026
    await supabase.from('goals').upsert({
      store_id: storeId,
      month: 4,
      year: 2026,
      target: goal
    }, { onConflict: 'store_id,month,year' });
  }

  const sellerMap = new Map(); 
  const uniqueSellersMap = new Map(); // StoreName -> Set of SellerNames
  
  baseOficial.forEach(r => {
    const sName = r.LOJA.trim().toUpperCase();
    const vName = r.VENDEDOR.trim().toUpperCase();
    if (!uniqueSellersMap.has(sName)) uniqueSellersMap.set(sName, new Set());
    uniqueSellersMap.get(sName).add(vName);
  });

  console.log(`👤 Mapeando vendedores por loja...`);

  for (const [storeName, sellers] of uniqueSellersMap.entries()) {
    const storeId = storeMap.get(storeName);
    if (!storeId) continue;

    for (const sellerName of sellers) {
      const sellerKey = `${storeName}|${sellerName}`;
      
      // Buscar usuário
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .ilike('name', sellerName)
        .eq('role', 'vendedor')
        .maybeSingle();

      let userId;
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const email = `${sellerName.toLowerCase().replace(/\s+/g, '.')}.${storeName.toLowerCase().split(' ')[0]}@mxperformance.com`;
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: 'ChangeMe123!',
          email_confirm: true,
          user_metadata: { name: sellerName }
        });

        if (authError) {
          if (authError.message.includes("already exists")) {
            const { data: retryUser } = await supabase.from('users').select('id').eq('email', email).single();
            userId = retryUser?.id;
          } else {
            console.error(`❌ Erro auth ${sellerName}:`, authError.message);
            continue;
          }
        } else {
          userId = authUser.user.id;
          await supabase.from('users').upsert({ id: userId, name: sellerName, email, role: 'vendedor' });
        }
      }

      if (userId) {
        sellerMap.set(sellerKey, userId);
        await supabase.from('store_sellers').upsert({
          store_id: storeId,
          seller_user_id: userId,
          is_active: true
        }, { onConflict: 'store_id,seller_user_id' });
      }
    }
  }

  console.log("📅 Processando e deduplicando histórico...");
  
  const checkinsMap = new Map(); // Key: StoreID|UserID|Date -> Row

  for (const row of baseOficial) {
    const sName = row.LOJA.trim().toUpperCase();
    const vName = row.VENDEDOR.trim().toUpperCase();
    const storeId = storeMap.get(sName);
    const sellerId = sellerMap.get(`${sName}|${vName}`);
    
    if (!storeId || !sellerId) continue;

    let dateStr = row.DATA;
    if (typeof dateStr === 'string' && dateStr.includes("/0026")) {
      dateStr = dateStr.replace("/0026", "/2026");
    } else if (typeof dateStr === 'number') {
      const date = new Date(Date.UTC(1899, 11, 30 + dateStr));
      dateStr = date.toLocaleDateString('pt-BR');
    } else if (dateStr instanceof Date) {
      dateStr = dateStr.toLocaleDateString('pt-BR');
    } else {
      dateStr = String(dateStr);
    }

    const [d, m, y] = dateStr.split('/');
    if (!d || !m || !y) continue;
    const refDate = `${y.padStart(4, '20')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    
    const key = `${storeId}|${sellerId}|${refDate}`;

    // Sanitização: Garantir que não existam valores negativos ou NaN
    const sanitize = (val) => Math.max(0, parseInt(val) || 0);

    const checkin = {
      store_id: storeId,
      seller_user_id: sellerId,
      user_id: sellerId,
      reference_date: refDate,
      leads_prev_day: sanitize(row.LEADS),
      vnd_porta_prev_day: sanitize(row.VND_PORTA),
      agd_cart_today: sanitize(row.AGD_CART),
      vnd_cart_prev_day: sanitize(row.VND_CART),
      agd_net_today: sanitize(row.AGD_NET),
      vnd_net_prev_day: sanitize(row.VND_NET),
      visit_prev_day: sanitize(row.VISITA),
      metric_scope: 'historical',
      submission_status: 'on_time'
    };

    // No Excel, a última linha para o mesmo dia/vendedor costuma ser a correta/atualizada
    checkinsMap.set(key, checkin);
  }

  const checkinsToInsert = Array.from(checkinsMap.values());
  console.log(`📊 Total de registros deduplicados: ${checkinsToInsert.length}`);

  // Deletar para evitar duplicidade antes de inserir
  const storeIdsToClean = Array.from(storeMap.values());
  await supabase.from('daily_checkins')
    .delete()
    .in('store_id', storeIdsToClean)
    .gte('reference_date', '2026-01-01');

  const chunkSize = 50; // Batch menor para segurança
  for (let i = 0; i < checkinsToInsert.length; i += chunkSize) {
    const chunk = checkinsToInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('daily_checkins').insert(chunk);
    if (error) {
      console.error(`❌ Erro batch ${i}:`, error.message);
      // Opcional: tentar um por um se o batch falhar
      for (const item of chunk) {
        const { error: singleError } = await supabase.from('daily_checkins').upsert(item, { onConflict: 'user_id,store_id,reference_date' });
        if (singleError) console.error(`   ❌ Erro individual (${item.reference_date}):`, singleError.message);
      }
    } else {
      console.log(`✅ Progress: ${i + chunk.length}/${checkinsToInsert.length}`);
    }
  }

  console.log("✨ Migração concluída com sucesso!");
}
migrate();

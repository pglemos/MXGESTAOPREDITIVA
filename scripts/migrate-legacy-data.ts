
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
  const storeWeeklyGoals: { [key: string]: number } = {};
  const storeIdMap: { [key: string]: string } = {};

  for (const row of configData) {
    const storeName = row["NOME DA LOJA"].trim();
    const managerEmail = row["EMAIL GERENTE"];
    const goal = parseInt(row["META"]) || 0;
    storeWeeklyGoals[storeName] = goal;

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
    storeIdMap[storeName] = storeId;
    console.log(`✅ Loja processada: ${storeName} (${storeId})`);

    // Buscar goal existente para Abril 2026
    const { data: existingGoal } = await supabase
      .from('goals')
      .select('id')
      .eq('store_id', storeId)
      .is('user_id', null)
      .eq('month', 4)
      .eq('year', 2026)
      .maybeSingle();

    if (existingGoal) {
      await supabase.from('goals').update({ target: goal }).eq('id', existingGoal.id);
      console.log(`✅ Goal atualizado para ${storeName} (Abril): ${goal}`);
    } else {
      await supabase.from('goals').insert({
        store_id: storeId,
        month: 4,
        year: 2026,
        target: goal
      });
      console.log(`✅ Goal inserido para ${storeName} (Abril): ${goal}`);
    }

    // Setar retroativo para Março
    const { data: existingGoalMar } = await supabase
      .from('goals')
      .select('id')
      .eq('store_id', storeId)
      .is('user_id', null)
      .eq('month', 3)
      .eq('year', 2026)
      .maybeSingle();

    if (!existingGoalMar) {
      await supabase.from('goals').insert({
        store_id: storeId,
        month: 3,
        year: 2026,
        target: goal
      });
      console.log(`✅ Goal retroativo inserido para ${storeName} (Março): ${goal}`);
    }
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
  console.log(`📊 uniqueSellersMap keys: ${Array.from(uniqueSellersMap.keys()).join(', ')}`);

  for (const [storeName, sellers] of uniqueSellersMap.entries()) {
    const storeId = storeMap.get(storeName);
    if (!storeId) {
        console.warn(`⚠️ Loja não encontrada no storeMap: ${storeName}`);
        continue;
    }

    console.log(`📍 Processando ${sellers.size} vendedores para ${storeName}...`);

    for (const sellerName of sellers) {
      const sellerKey = `${storeName}|${sellerName}`;
      
      // Buscar usuário pelo nome
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .ilike('name', sellerName)
        .maybeSingle();

      let userId;
      if (existingUser) {
        userId = existingUser.id;
        console.log(`   🔗 Vendedor existente: ${sellerName} (${userId})`);
      } else {
        const email = `${sellerName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '.')}.${storeName.toLowerCase().split(' ')[0]}@mxperformance.com`;
        
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: 'ChangeMe123!',
          email_confirm: true,
          user_metadata: { name: sellerName }
        });

        if (authError) {
          if (authError.message.includes("already exists")) {
            const { data: retryUser } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
            userId = retryUser?.id;
            console.log(`   🔗 Vendedor reconnect: ${sellerName} (${userId})`);
          } else {
            console.error(`   ❌ Erro auth ${sellerName}:`, authError.message);
            continue;
          }
        } else {
          userId = authUser.user.id;
          console.log(`   ✨ Novo vendedor criado: ${sellerName} (${userId})`);
        }

        if (userId) {
          await supabase.from('users').upsert({ id: userId, name: sellerName, email, role: 'vendedor' });
        }
      }

      if (userId) {
        sellerMap.set(sellerKey, userId);
        
        const { data: linkExists } = await supabase
          .from('store_sellers')
          .select('id')
          .eq('store_id', storeId)
          .eq('seller_user_id', userId)
          .maybeSingle();

        if (!linkExists) {
          const { error: linkError } = await supabase.from('store_sellers').insert({
            store_id: storeId,
            seller_user_id: userId,
            is_active: true
          });
          if (linkError) console.error(`   ❌ Erro ao vincular ${sellerName} à ${storeName}:`, linkError.message);
          else console.log(`   🔗 Vendedor vinculado: ${sellerName} -> ${storeName}`);
        } else {
          console.log(`   🆗 Vínculo já existe: ${sellerName} -> ${storeName}`);
        }
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
      date: refDate,
      submitted_at: new Date().toISOString(),
      submitted_late: false,
      leads: sanitize(row.LEADS),
      agd_cart: sanitize(row.AGD_CART),
      agd_net: sanitize(row.AGD_NET),
      vnd_porta: sanitize(row.VND_PORTA),
      vnd_cart: sanitize(row.VND_CART),
      vnd_net: sanitize(row.VND_NET),
      visitas: sanitize(row.VISITA),
      leads_prev_day: sanitize(row.LEADS),
      vnd_porta_prev_day: sanitize(row.VND_PORTA),
      agd_cart_today: sanitize(row.AGD_CART),
      agd_cart_prev_day: sanitize(row.AGD_CART), // For historical funnel
      vnd_cart_prev_day: sanitize(row.VND_CART),
      agd_net_today: sanitize(row.AGD_NET),
      agd_net_prev_day: sanitize(row.AGD_NET), // For historical funnel
      vnd_net_prev_day: sanitize(row.VND_NET),
      visit_prev_day: sanitize(row.VISITA),
      metric_scope: 'historical',
      submission_status: 'on_time'
    };

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

  // Inserir checkins
  const chunkSize = 50; 
  for (let i = 0; i < checkinsToInsert.length; i += chunkSize) {
    const chunk = checkinsToInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('daily_checkins').insert(chunk);
    if (error) {
      console.error(`❌ Erro batch ${i}:`, error.message);
      // Tentativa de upsert individual em caso de conflito de chave
      for (const item of chunk) {
        await supabase.from('daily_checkins').upsert(item, { 
          onConflict: 'seller_user_id,store_id,reference_date,metric_scope' 
        });
      }
    } else {
      console.log(`✅ Progress: ${Math.min(i + chunkSize, checkinsToInsert.length)}/${checkinsToInsert.length}`);
    }
  }

  console.log('🎯 Inicializando metas de vendedores...');
  for (const [storeName, goal] of Object.entries(storeWeeklyGoals)) {
    const storeId = storeIdMap[storeName];
    if (!storeId) continue;

    const { data: sellers } = await supabase
      .from('store_sellers')
      .select('seller_user_id')
      .eq('store_id', storeId)
      .eq('is_active', true);

    if (sellers && sellers.length > 0) {
      const sellerGoal = Math.floor(goal / sellers.length);
      console.log(`   📊 Distribuindo meta de ${goal} para ${sellers.length} vendedores em ${storeName}...`);
      
      for (const seller of sellers) {
        // Check Abril
        const { data: goalExists } = await supabase.from('goals').select('id')
          .eq('store_id', storeId).eq('user_id', seller.seller_user_id).eq('month', 4).eq('year', 2026).maybeSingle();

        if (goalExists) {
          await supabase.from('goals').update({ target: sellerGoal }).eq('id', goalExists.id);
        } else {
          await supabase.from('goals').insert({ store_id: storeId, user_id: seller.seller_user_id, month: 4, year: 2026, target: sellerGoal });
        }

        // Check Março (retroativo)
        const { data: goalExistsMar } = await supabase.from('goals').select('id')
          .eq('store_id', storeId).eq('user_id', seller.seller_user_id).eq('month', 3).eq('year', 2026).maybeSingle();

        if (goalExistsMar) {
          await supabase.from('goals').update({ target: sellerGoal }).eq('id', goalExistsMar.id);
        } else {
          await supabase.from('goals').insert({ store_id: storeId, user_id: seller.seller_user_id, month: 3, year: 2026, target: sellerGoal });
        }
      }
      console.log(`   ✅ Metas distribuídas para ${sellers.length} vendedores em ${storeName}`);
    }
  }

  console.log("✨ Migração concluída com sucesso!");
}

migrate().catch(err => {
  console.error("💥 Erro fatal na migração:", err);
  process.exit(1);
});

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Corrigindo para usar os nomes de variáveis do projeto
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO: SUPABASE_URL ou SUPABASE_KEY não configurados no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
    console.log('--- 🕵️ AUDITORIA FORENSE DE DADOS: MX PERFORMANCE ---');
    console.log(`URL: ${supabaseUrl}`);
    
    // 1. Integridade de Unidades
    const { data: stores, error: sErr } = await supabase.from('stores').select('id, name, active');
    if (sErr) {
        console.error('❌ Erro ao buscar lojas:', sErr.message);
        return;
    }
    
    console.log(`✅ Unidades Totais: ${stores.length}`);
    console.log(`✅ Unidades Ativas: ${stores.filter(s => s.active).length}`);
    
    console.log('\n--- LISTAGEM DE UNIDADES (OFFICIAL CHECK) ---');
    stores.map(s => s.name).sort().forEach(n => console.log(`[ ] ${n}`));
    
    if (stores.length < 13) {
        console.warn(`⚠️ ALERTA: Esperado ao menos 13 unidades, encontrados ${stores.length}.`);
    }

    // 2. Integridade de Usuários
    const { data: users, error: uErr } = await supabase.from('users').select('id, name, role, active');
    if (uErr) console.error(uErr);
    console.log(`✅ Usuários Cadastrados: ${users?.length || 0}`);

    // 3. Integridade de Check-ins
    const { data: checkins, error: cErr } = await supabase
        .from('daily_checkins')
        .select('id, seller_user_id, store_id, reference_date, vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day');

    if (cErr) {
        console.error('❌ Erro ao buscar check-ins:', cErr.message);
    } else {
        console.log(`✅ Total de Check-ins: ${checkins.length}`);
        
        // 4. Detecção de Órfãos
        const orphans = checkins.filter(c => !c.seller_user_id || !c.store_id);
        if (orphans.length > 0) {
            console.error(`🔥 CRÍTICO: ${orphans.length} check-ins órfãos localizados!`);
        } else {
            console.log('✅ Integridade Referencial: 100% OK.');
        }

        // 5. Paridade de Vendas
        const totalVendas = checkins.reduce((sum, c) => 
            sum + (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0), 0
        );
        console.log(`✅ Volume Consolidado de Vendas: ${totalVendas}`);
    }

    // 6. Check de Terminolgia
    const forbiddenTerms = ['node', 'specialist', 'pacing'];
    const usersWithBadTerms = users?.filter(u => 
        forbiddenTerms.some(term => u.name?.toLowerCase().includes(term))
    ) || [];
    
    if (usersWithBadTerms.length > 0) {
        console.error(`🔥 DÍVIDA: ${usersWithBadTerms.length} usuários com termos proibidos localizados.`);
        usersWithBadTerms.forEach(u => console.log(`   - ${u.name}`));
    } else {
        console.log('✅ Purge de Terminologia: 100% CLEAN.');
    }

    console.log('\n--- FIM DA AUDITORIA ---');
}

runAudit();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ ERRO: SUPABASE_URL ou SERVICE_KEY ausentes.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const OFFICIAL_NETWORK = [
    'ACERTTCAR',
    'BROTHERS CAR',
    'CAIO',
    'DANIEL JS',
    'DAVID',
    'ESPINDOLA AUTOMOVEIS',
    'GANDINI AUTOMOVEIS',
    'JOSE ROBERTO',
    'LIAL VEICULOS',
    'PAAY MOTORS',
    'PISCAR VEICULOS',
    'RK2 Motors',
    'SEMINOVOS BHZ'
];

async function reconcile() {
    console.log('--- 🚀 RECONCILIAÇÃO DE REDE: MX PERFORMANCE (13 UNIDADES) ---');

    // 1. Buscar Lojas Atuais
    const { data: currentStores } = await supabase.from('stores').select('*');
    if (!currentStores) return;

    console.log(`Lojas atuais no banco: ${currentStores.length}`);

    // 2. Identificar Duplicados
    const seen = new Set();
    const duplicates = [];
    for (const s of currentStores) {
        if (seen.has(s.name)) {
            duplicates.push(s);
        } else {
            seen.add(s.name);
        }
    }

    if (duplicates.length > 0) {
        console.log(`🗑️ Removendo ${duplicates.length} duplicatas...`);
        for (const d of duplicates) {
            await supabase.from('stores').delete().eq('id', d.id);
            console.log(`   - Removido: ${d.name} (${d.id})`);
        }
    }

    // 3. Criar Lojas Faltantes
    const currentNames = new Set(currentStores.filter(s => !duplicates.find(d => d.id === s.id)).map(s => s.name));
    const missing = OFFICIAL_NETWORK.filter(n => !currentNames.has(n));

    if (missing.length > 0) {
        console.log(`✨ Criando ${missing.length} lojas faltantes...`);
        for (const name of missing) {
            const { data, error } = await supabase.from('stores').insert({ 
                name, 
                active: true,
                source_mode: 'native_app' 
            }).select().single();
            
            if (error) console.error(`   - Erro ao criar ${name}:`, error.message);
            else console.log(`   - Criada: ${name} (${data.id})`);
        }
    } else {
        console.log('✅ Todas as 13 unidades oficiais já existem.');
    }

    console.log('\n--- FIM DA RECONCILIAÇÃO ---');
}

reconcile();

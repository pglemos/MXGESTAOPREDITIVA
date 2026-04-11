import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function finalPolish() {
    console.log('--- 💎 POLIMENTO FINAL DE REDE: CASE NORMALIZATION ---');

    const { data: stores } = await supabase.from('stores').select('*');
    if (!stores) return;

    const seen = new Set();
    for (const s of stores) {
        const upperName = s.name.toUpperCase().trim();
        
        if (seen.has(upperName)) {
            console.log(`🗑️ Removendo duplicata de caixa: ${s.name}`);
            await supabase.from('stores').delete().eq('id', s.id);
        } else {
            if (s.name !== upperName) {
                console.log(`✨ Normalizando: ${s.name} -> ${upperName}`);
                await supabase.from('stores').update({ name: upperName }).eq('id', s.id);
            }
            seen.add(upperName);
        }
    }

    const { data: final } = await supabase.from('stores').select('name').order('name');
    console.log('\n--- REDE OFICIAL MX PERFORMANCE (CONSISTENTE) ---');
    final?.forEach(s => console.log(`[OK] ${s.name}`));
}

finalPolish();

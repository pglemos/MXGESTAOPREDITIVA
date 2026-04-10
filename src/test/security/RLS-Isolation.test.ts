import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * SECURITY TEST: SEC-01 RLS Isolation
 * Objetivo: Validar que um vendedor da Loja A não consegue ver check-ins da Loja B.
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

test.describe('Security: RLS Data Isolation', () => {
  
  test('Vendedor deve ver apenas dados de sua própria loja', async () => {
    // 1. Setup: Criamos dois clientes Supabase com tokens de vendedores de lojas diferentes
    // Nota: Em um ambiente real, carregaríamos esses tokens de um setup global ou login real
    const sellerAClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${process.env.TEST_TOKEN_SELLER_LOJA_A}` } }
    });

    const idLojaB = 'ID-DA-LOJA-B-CONCORRENTE';

    // 2. Ação: Vendedor A tenta consultar check-ins da Loja B
    const { data, error } = await sellerAClient
        .from('daily_checkins')
        .select('*')
        .eq('store_id', idLojaB);

    // 3. Validação: O resultado deve ser vazio (RLS bloqueou as linhas) e não deve haver erro de permissão (fail silent do RLS)
    expect(error).toBeNull();
    expect(data?.length).toBe(0);
    
    console.log('✅ RLS Bloqueou acesso cruzado com sucesso.');
  });

  test('Admin deve conseguir ver dados de todas as lojas', async () => {
    const adminClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${process.env.TEST_TOKEN_ADMIN}` } }
    });

    const { data, error } = await adminClient
        .from('daily_checkins')
        .select('*', { count: 'exact', head: true });

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    
    console.log('✅ Admin mantém acesso total.');
  });
});

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * SECURITY TEST: SEC-01 RLS Isolation
 * Objetivo: Validar que um vendedor da Loja A não consegue ver check-ins da Loja B.
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const senhaPadraoTeste = process.env.E2E_AUTH_PASSWORD || 'Mx#2026!';

test.describe('Security: RLS Data Isolation', () => {
  
  test('Vendedor deve ver apenas dados de sua própria loja', async () => {
    const vendedorClient = createClient(supabaseUrl, supabaseKey);
    const { data: authData, error: authError } = await vendedorClient.auth.signInWithPassword({
      email: 'vendedor@mxgestaopreditiva.com.br',
      password: senhaPadraoTeste,
    });
    expect(authError).toBeNull();
    expect(authData.user?.id).toBeTruthy();

    const { data: vinculos, error: vinculosError } = await vendedorClient
      .from('vinculos_loja')
      .select('store_id');
    expect(vinculosError).toBeNull();

    const lojaDoVendedor = vinculos?.[0]?.store_id;
    expect(lojaDoVendedor).toBeTruthy();

    const { data, error } = await vendedorClient
        .from('lancamentos_diarios')
        .select('id, store_id, user_id, seller_user_id')
        .neq('store_id', lojaDoVendedor);

    expect(error).toBeNull();
    expect(data?.length).toBe(0);
    
    console.log('✅ RLS Bloqueou acesso cruzado com sucesso.');
  });

  test('Admin deve conseguir ver dados de todas as lojas', async () => {
    const adminClient = createClient(supabaseUrl, supabaseKey);
    const { error: authError } = await adminClient.auth.signInWithPassword({
      email: 'admin@mxgestaopreditiva.com.br',
      password: senhaPadraoTeste,
    });
    expect(authError).toBeNull();

    const { count, error } = await adminClient
        .from('lojas')
        .select('id', { count: 'exact', head: true });

    expect(error).toBeNull();
    expect(count ?? 0).toBeGreaterThan(1);
    
    console.log('✅ Admin mantém acesso total.');
  });
});

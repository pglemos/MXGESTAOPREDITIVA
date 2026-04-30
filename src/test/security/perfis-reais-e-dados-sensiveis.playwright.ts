import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const senhaPadraoTeste = process.env.E2E_AUTH_PASSWORD || 'Mx#2026!';

const contasPorPerfil = [
  ['administrador_geral', 'administrador.geral@mxgestaopreditiva.com.br'],
  ['administrador_mx', 'admin@mxgestaopreditiva.com.br'],
  ['consultor_mx', 'consultor.mx@mxgestaopreditiva.com.br'],
  ['dono', 'dono@mxgestaopreditiva.com.br'],
  ['gerente', 'gerente@mxgestaopreditiva.com.br'],
  ['vendedor', 'vendedor@mxgestaopreditiva.com.br'],
] as const;

function novoClienteAnonimo() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function autenticar(email: string) {
  const client = novoClienteAnonimo();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: senhaPadraoTeste,
  });

  expect(error).toBeNull();
  expect(data.user?.id).toBeTruthy();
  return { client, userId: data.user!.id };
}

test.describe('Segurança: perfis reais e dados sensíveis', () => {
  for (const [perfil, email] of contasPorPerfil) {
    test(`perfil ${perfil} autentica com sessão live real`, async () => {
      const { client, userId } = await autenticar(email);

      const { data: usuario, error } = await client
        .from('usuarios')
        .select('email, role, active, must_change_password')
        .eq('id', userId)
        .single();

      expect(error).toBeNull();
      expect(usuario?.email).toBe(email);
      expect(usuario?.role).toBe(perfil);
      expect(usuario?.active).toBe(true);
      expect(usuario?.must_change_password).toBe(false);
    });
  }

  test('consultor MX não acessa financeiro sensível sem permissão administrativa', async () => {
    const { client } = await autenticar('consultor.mx@mxgestaopreditiva.com.br');

    const { count, error } = await client
      .from('financeiro_consultoria')
      .select('id', { count: 'exact', head: true });

    expect(error).toBeNull();
    expect(count).toBe(0);
  });

  test('consultor MX acessa benchmark anonimizado e gera log sensível', async () => {
    const admin = (await autenticar('admin@mxgestaopreditiva.com.br')).client;
    const { count: antes, error: erroAntes } = await admin
      .from('logs_acesso_sensivel')
      .select('id', { count: 'exact', head: true })
      .eq('modulo_codigo', 'comparativos')
      .eq('entidade', 'benchmark_lojas_anonimo');
    expect(erroAntes).toBeNull();

    const consultor = (await autenticar('consultor.mx@mxgestaopreditiva.com.br')).client;
    const { data: benchmark, error: erroBenchmark } = await consultor.rpc('listar_benchmark_anonimo_lojas');

    expect(erroBenchmark).toBeNull();
    expect((benchmark || []).length).toBeGreaterThan(0);
    expect(Object.keys(benchmark?.[0] || {})).toEqual([
      'loja_anonima',
      'total_lancamentos',
      'total_leads',
      'total_agendamentos',
      'total_visitas',
      'total_vendas',
      'disciplina_lancamento',
    ]);
    expect(String(benchmark?.[0]?.loja_anonima || '')).toMatch(/^loja_[a-f0-9]{8}$/);

    const { count: depois, error: erroDepois } = await admin
      .from('logs_acesso_sensivel')
      .select('id', { count: 'exact', head: true })
      .eq('modulo_codigo', 'comparativos')
      .eq('entidade', 'benchmark_lojas_anonimo');

    expect(erroDepois).toBeNull();
    expect(depois ?? 0).toBeGreaterThan(antes ?? 0);
  });
});

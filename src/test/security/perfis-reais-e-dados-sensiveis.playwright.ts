import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { getE2EInternalEmail, getE2EPassword, getE2ERolePassword } from '../e2e-helpers/auth';
import { createE2EAdminUser, deleteE2EUser, type E2EUser } from '../e2e-helpers/supabase-admin';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const senhaPerfilLoja = getE2ERolePassword();

const contasPorPerfil = [
  { perfil: 'administrador_geral', email: getE2EInternalEmail(), password: getE2EPassword() },
  { perfil: 'dono', email: 'dono@mxgestaopreditiva.com.br', password: senhaPerfilLoja },
  { perfil: 'gerente', email: 'gerente@mxgestaopreditiva.com.br', password: senhaPerfilLoja },
  { perfil: 'vendedor', email: 'vendedor@mxgestaopreditiva.com.br', password: senhaPerfilLoja },
  ...(process.env.E2E_ADMIN_MX_EMAIL ? [{ perfil: 'administrador_mx', email: process.env.E2E_ADMIN_MX_EMAIL, password: getE2EPassword() }] : []),
  ...(process.env.E2E_CONSULTOR_MX_EMAIL ? [{ perfil: 'consultor_mx', email: process.env.E2E_CONSULTOR_MX_EMAIL, password: senhaPerfilLoja }] : []),
] as const;

function novoClienteAnonimo() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function autenticar(email: string, password: string) {
  const client = novoClienteAnonimo();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  expect(error).toBeNull();
  expect(data.user?.id).toBeTruthy();
  return { client, userId: data.user!.id };
}

test.describe('Segurança: perfis reais e dados sensíveis', () => {
  let consultorTemporario: E2EUser | null = null;

  test.afterEach(async () => {
    if (!consultorTemporario) return;
    await deleteE2EUser(consultorTemporario.id);
    consultorTemporario = null;
  });

  for (const { perfil, email, password } of contasPorPerfil) {
    test(`perfil ${perfil} autentica com sessão live real`, async () => {
      const { client, userId } = await autenticar(email, password);

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
    consultorTemporario = await createE2EAdminUser({
      prefix: 'e2e-security-consultor',
      role: 'consultor_mx',
      name: 'E2E Consultor MX Segurança',
    });
    const { client } = await autenticar(consultorTemporario.email, consultorTemporario.password);

    const { count, error } = await client
      .from('financeiro_consultoria')
      .select('id', { count: 'exact', head: true });

    expect(error).toBeNull();
    expect(count).toBe(0);
  });

  test('consultor MX acessa benchmark anonimizado e gera log sensível', async () => {
    consultorTemporario = await createE2EAdminUser({
      prefix: 'e2e-security-benchmark',
      role: 'consultor_mx',
      name: 'E2E Consultor MX Benchmark',
    });
    const admin = (await autenticar(getE2EInternalEmail(), getE2EPassword())).client;
    const { count: antes, error: erroAntes } = await admin
      .from('logs_acesso_sensivel')
      .select('id', { count: 'exact', head: true })
      .eq('modulo_codigo', 'comparativos')
      .eq('entidade', 'benchmark_lojas_anonimo');
    expect(erroAntes).toBeNull();

    const consultor = (await autenticar(consultorTemporario.email, consultorTemporario.password)).client;
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

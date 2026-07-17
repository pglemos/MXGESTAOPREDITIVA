-- ============================================================================
-- RLS Regression Matrix — Setup / Fixtures
-- Story 0.5 — T-01
-- ----------------------------------------------------------------------------
-- Provê fixtures determinísticas para a suite pgTAP:
--   * 2 lojas tenant-isoladas (loja_a, loja_b)
--   * 5 usuários (1 por role canônico do users.role):
--       u_admin, u_dono, u_gerente, u_vendedor + role 'anon' (sem registro)
--   * Vínculos / memberships necessários
--   * 1 lançamento, 1 meta, 1 log de auditoria por loja
--
-- Convenções:
--   * UUIDs fixos para reprodutibilidade
--   * Todo bloco DEVE ser idempotente (re-rodável)
--   * Tabelas com triggers/checks são preenchidas via INSERT ... ON CONFLICT
--
-- Como simular um role autenticado dentro de um teste:
--   SET LOCAL ROLE authenticated;
--   SET LOCAL "request.jwt.claim.sub" = '<uuid-do-usuário>';
--
-- Para o role anônimo:
--   SET LOCAL ROLE anon;
-- ============================================================================

\set ON_ERROR_STOP on
SET search_path = public, pg_catalog;

-- pgTAP é requisito da suite (CI habilita via `CREATE EXTENSION IF NOT EXISTS pgtap`)
CREATE EXTENSION IF NOT EXISTS pgtap;

-- ----------------------------------------------------------------------------
-- UUIDs fixos para fixtures
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Idempotência: limpa fixtures anteriores (escopo restrito aos UUIDs conhecidos)
  PERFORM 1;
END$$;

-- Lojas
INSERT INTO public.lojas (id, nome, ativo)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Loja A (fixture)', true),
  ('22222222-2222-2222-2222-222222222222', 'Loja B (fixture)', true)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- Usuários (auth.users) — só inserimos se o ambiente local permite
-- Em testes locais com supabase, auth.users é gerenciado pelo GoTrue;
-- aqui assumimos uma seed simplificada via tabela public.users (espelho)
-- Caso o ambiente não tenha auth.users, o setup pula essa parte.
DO $do$
DECLARE
  v_has_auth boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) INTO v_has_auth;

  IF v_has_auth THEN
    INSERT INTO auth.users (id, email, instance_id, aud, role, email_confirmed_at)
    VALUES
      ('aaaaaaaa-0000-0000-0000-000000000001', 'admin@test.local',    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now()),
      ('aaaaaaaa-0000-0000-0000-000000000002', 'dono@test.local',     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now()),
      ('aaaaaaaa-0000-0000-0000-000000000003', 'gerente@test.local',  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now()),
      ('aaaaaaaa-0000-0000-0000-000000000004', 'vendedor@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now()),
      ('aaaaaaaa-0000-0000-0000-000000000005', 'outsider@test.local', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END$do$;

-- public.users (espelho de aplicação)
INSERT INTO public.users (id, role, name, email)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'admin',    'Admin Fixture',    'admin@test.local'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'dono',     'Dono Fixture',     'dono@test.local'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'gerente',  'Gerente Fixture',  'gerente@test.local'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'vendedor', 'Vendedor Fixture', 'vendedor@test.local'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'vendedor', 'Outsider Fixture', 'outsider@test.local')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- public.usuarios (alias PT-BR usado pelas policies)
INSERT INTO public.usuarios (id, role, nome)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'admin',    'Admin Fixture'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'dono',     'Dono Fixture'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'gerente',  'Gerente Fixture'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'vendedor', 'Vendedor Fixture'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'vendedor', 'Outsider Fixture')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- memberships: dono+gerente+vendedor em Loja A; outsider em Loja B e
-- também em Loja A para exercitar cliente compartilhado entre vendedores.
INSERT INTO public.memberships (user_id, store_id, role)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'dono'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'gerente'),
  ('aaaaaaaa-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'vendedor'),
  ('aaaaaaaa-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'vendedor'),
  ('aaaaaaaa-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'vendedor')
ON CONFLICT (user_id, store_id) DO NOTHING;

-- vinculos_loja: equivalente PT-BR usado por algumas policies
INSERT INTO public.vinculos_loja (usuario_id, loja_id, papel, ativo)
SELECT user_id, store_id, role, true
  FROM public.memberships
  WHERE user_id IN (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'aaaaaaaa-0000-0000-0000-000000000005'
  )
ON CONFLICT DO NOTHING;

-- vendedores_loja: vendedor "atado" na Loja A
INSERT INTO public.vendedores_loja (id, loja_id, nome, ativo)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Vendedor Fixture A', true),
  ('cccccccc-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Vendedor Fixture B', true)
ON CONFLICT (id) DO NOTHING;

-- clientes/oportunidades: fixtures para o contrato compartilhado da Carteira,
-- Central e Funil. O vendedor A só lê a ficha do vendedor B enquanto existe
-- oportunidade própria aberta; uma oportunidade terminal não prolonga acesso.
INSERT INTO public.clientes (id, loja_id, seller_user_id, nome, telefone)
VALUES
  ('12111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000004', 'Cliente Fixture Próprio', '5511999990001'),
  ('12111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000005', 'Cliente Fixture Compartilhado Aberto', '5511999990002'),
  ('12111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000005', 'Cliente Fixture Compartilhado Fechado', '5511999990003'),
  ('12111111-1111-1111-1111-111111111114', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000005', 'Cliente Fixture Outra Loja', '5511999990004')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.oportunidades (id, cliente_id, loja_id, seller_user_id, etapa, closed_at)
VALUES
  ('13111111-1111-1111-1111-111111111111', '12111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000004', 'prospeccao', NULL),
  ('13111111-1111-1111-1111-111111111112', '12111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000004', 'ganho', now())
ON CONFLICT (id) DO NOTHING;

-- lançamento canônico em Loja A
INSERT INTO public.lancamentos_diarios (id, loja_id, vendedor_id, valor, data)
VALUES
  ('dddddddd-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   'cccccccc-0000-0000-0000-000000000001',
   100.00,
   CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- meta canônica
INSERT INTO public.metas (id, loja_id, mes, ano, valor)
VALUES
  ('eeeeeeee-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   EXTRACT(MONTH FROM CURRENT_DATE)::int,
   EXTRACT(YEAR  FROM CURRENT_DATE)::int,
   10000.00)
ON CONFLICT (id) DO NOTHING;

-- log de auditoria canônico
INSERT INTO public.logs_auditoria (id, usuario_id, acao, detalhes)
VALUES
  ('ffffffff-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000001',
   'setup_fixture',
   '{"source":"rls-matrix"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- role_assignments_audit: opcional (criada em Story 1.8). Inserção condicional.
DO $do$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='role_assignments_audit'
  ) THEN
    EXECUTE $sql$
      INSERT INTO public.role_assignments_audit (id, target_user_id, old_role, new_role, changed_by)
      VALUES (
        'fafafafa-0000-0000-0000-000000000001'::uuid,
        'aaaaaaaa-0000-0000-0000-000000000004'::uuid,
        'vendedor',
        'gerente',
        'aaaaaaaa-0000-0000-0000-000000000001'::uuid
      )
      ON CONFLICT (id) DO NOTHING
    $sql$;
  END IF;
END$do$;

-- ----------------------------------------------------------------------------
-- Helper: rls_matrix.set_role(uuid)
--   Simula `auth.uid()` para policies que dependem dele.
--   Usa SET LOCAL para garantir isolamento por transação.
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS rls_matrix;

CREATE OR REPLACE FUNCTION rls_matrix.assume(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_user_id::text, true);
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', p_user_id, 'role', 'authenticated')::text,
                     true);
  EXECUTE 'SET LOCAL ROLE authenticated';
END;
$$;

CREATE OR REPLACE FUNCTION rls_matrix.assume_anon()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
  EXECUTE 'SET LOCAL ROLE anon';
END;
$$;

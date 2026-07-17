-- ============================================================================
-- Grants Guard — invariantes de privilégio (Fase 1.2 / 3.1)
-- Roda sobre o banco efêmero (supabase db reset aplica TODAS as migrations),
-- portanto também prova que a cadeia de migrations converge para o estado
-- de grants esperado (sem depender de produção).
--
-- Falha ANTES das migrations 20260717270000..273000; passa DEPOIS.
-- RLS não cobre TRUNCATE/TRIGGER/REFERENCES nem EXECUTE — este guard fecha
-- o que a matriz de RLS não consegue asseverar.
-- ============================================================================
BEGIN;
SELECT plan(6);

-- 1) anon: zero privilégio em QUALQUER tabela/view de public
SELECT is(
  (SELECT count(*)::int
     FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND grantee = 'anon'),
  0,
  'anon: zero privilégios em relações de public'
);

-- 2) authenticated: zero privilégios que burlam RLS (TRUNCATE/TRIGGER/REFERENCES)
SELECT is(
  (SELECT count(*)::int
     FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND grantee = 'authenticated'
      AND privilege_type IN ('TRUNCATE','TRIGGER','REFERENCES')),
  0,
  'authenticated: zero TRUNCATE/TRIGGER/REFERENCES em public'
);

-- 3) Tabelas canônicas: nenhuma linha de grant para anon
SELECT is(
  (SELECT count(*)::int
     FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND grantee = 'anon'
      AND table_name IN (
        'clientes','oportunidades','agendamentos','eventos_comerciais',
        'execution_actions','notificacoes','central_execucao_aberturas',
        'carteira_missoes','carteira_missao_itens','carteira_missao_mutations',
        'usuarios','vinculos_loja','lojas')),
  0,
  'anon: zero grant nas tabelas canônicas CRM/Central/Carteira'
);

-- 4) RPCs SECURITY DEFINER de escopo NÃO executáveis por anon
SELECT is(
  (SELECT count(*)::int
     FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
    WHERE p.prosecdef
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
      AND (p.proname LIKE 'central_%' OR p.proname LIKE 'carteira_%'
           OR p.proname LIKE 'vendedor_%' OR p.proname LIKE '%missao%'
           OR p.proname LIKE '%checkin%')),
  0,
  'anon: nenhuma RPC SECURITY DEFINER de escopo executável'
);

-- 5) authenticated PRESERVA DML nas canônicas (app não quebrou)
SELECT ok(
  has_table_privilege('authenticated', 'public.execution_actions', 'SELECT')
  AND has_table_privilege('authenticated', 'public.execution_actions', 'INSERT')
  AND has_table_privilege('authenticated', 'public.execution_actions', 'UPDATE')
  AND has_table_privilege('authenticated', 'public.clientes', 'SELECT'),
  'authenticated: DML preservado nas tabelas canônicas (RLS-governed)'
);

-- 6) Default privileges do owner postgres NÃO reconcedem a anon em tabelas futuras
SELECT is(
  (SELECT count(*)::int
     FROM pg_default_acl d
     CROSS JOIN LATERAL unnest(d.defaclacl) AS acl(item)
    WHERE d.defaclnamespace = 'public'::regnamespace
      AND pg_get_userbyid(d.defaclrole) = 'postgres'
      AND d.defaclobjtype = 'r'
      AND acl.item::text LIKE 'anon=%'),
  0,
  'default privileges (postgres): anon não reconcedido em tabelas futuras'
);

SELECT * FROM finish();
ROLLBACK;

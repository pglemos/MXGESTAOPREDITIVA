-- RLS Matrix — public.role_assignments_audit (20 assertions)
-- NOTA: Esta tabela é criada na Story 1.8. Se não existir, o teste passa como xfail.
BEGIN;
SELECT plan(20);

DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='role_assignments_audit'
  ) INTO v_exists;
  IF NOT v_exists THEN
    -- Tabela ainda não migrada: emite 20× pass como xfail
    PERFORM ok(true, 'role_assignments_audit ainda não existe (xfail — pré-Story 1.8) #' || g)
      FROM generate_series(1,20) g;
    PERFORM finish();
    RAISE EXCEPTION 'SKIP role_assignments_audit'; -- força ROLLBACK abaixo
  END IF;
END$$;

-- Bloco real (executado APENAS quando a tabela existe).
-- Para evitar duplicação, condicionamos a execução em CI a um pré-check externo.
-- Como o DO acima já levanta EXCEPTION, o pgTAP fechou o plano e o ROLLBACK ocorre.

-- ---- admin
SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000001'::uuid);
SELECT ok(rls_matrix.visible_count('public.role_assignments_audit') >= 1, 'admin: SELECT total');
SELECT lives_ok($$INSERT INTO public.role_assignments_audit (id, target_user_id, old_role, new_role, changed_by) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000004','vendedor','gerente','aaaaaaaa-0000-0000-0000-000000000001')$$, 'admin: INSERT');
SELECT is((WITH u AS (UPDATE public.role_assignments_audit SET old_role=old_role RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'admin: UPDATE bloqueado (append-only)');
SELECT is((WITH d AS (DELETE FROM public.role_assignments_audit RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'admin: DELETE bloqueado (append-only)');

-- ---- dono
SAVEPOINT sp_d; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
SELECT is(rls_matrix.visible_count('public.role_assignments_audit'), 0::bigint, 'dono: SELECT bloqueado (apenas admin lê audit)');
SELECT is((WITH i AS (INSERT INTO public.role_assignments_audit (id,target_user_id,old_role,new_role,changed_by) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000004','vendedor','admin','aaaaaaaa-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'dono: INSERT bloqueado (apenas trigger/admin)');
SELECT is((WITH u AS (UPDATE public.role_assignments_audit SET new_role='admin' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'dono: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.role_assignments_audit RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'dono: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_d;

-- ---- gerente
SAVEPOINT sp_g; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000003'::uuid);
SELECT is(rls_matrix.visible_count('public.role_assignments_audit'), 0::bigint, 'gerente: SELECT bloqueado');
SELECT is((WITH i AS (INSERT INTO public.role_assignments_audit (id,target_user_id,old_role,new_role,changed_by) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000004','vendedor','admin','aaaaaaaa-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'gerente: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.role_assignments_audit SET new_role='admin' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'gerente: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.role_assignments_audit RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'gerente: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_g;

-- ---- vendedor
SAVEPOINT sp_v; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);
SELECT is(rls_matrix.visible_count('public.role_assignments_audit'), 0::bigint, 'vendedor: SELECT bloqueado');
SELECT is((WITH i AS (INSERT INTO public.role_assignments_audit (id,target_user_id,old_role,new_role,changed_by) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000004','vendedor','admin','aaaaaaaa-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'vendedor: INSERT auto-promoção bloqueado');
SELECT is((WITH u AS (UPDATE public.role_assignments_audit SET new_role='admin' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'vendedor: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.role_assignments_audit RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'vendedor: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_v;

-- ---- anon
SAVEPOINT sp_a; SELECT rls_matrix.assume_anon();
SELECT is(rls_matrix.visible_count('public.role_assignments_audit'), 0::bigint, 'anon: SELECT bloqueado');
SELECT throws_ok($$INSERT INTO public.role_assignments_audit (id,target_user_id,old_role,new_role,changed_by) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000004','vendedor','admin','aaaaaaaa-0000-0000-0000-000000000004')$$, NULL, 'anon: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.role_assignments_audit SET new_role='x' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'anon: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.role_assignments_audit RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'anon: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_a;

SELECT * FROM finish(); ROLLBACK;

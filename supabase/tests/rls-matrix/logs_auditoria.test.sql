-- RLS Matrix — public.logs_auditoria (20 assertions)
BEGIN;
SELECT plan(20);

SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000001'::uuid);
SELECT ok(rls_matrix.visible_count('public.logs_auditoria') >= 1, 'admin: SELECT total');
SELECT lives_ok($$INSERT INTO public.logs_auditoria (id,user_id,action,entity,entity_id,details_json) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000001','test','rls_matrix','11111111-1111-1111-1111-111111111111','{}'::jsonb)$$, 'admin: INSERT');
SELECT is((WITH u AS (UPDATE public.logs_auditoria SET action='changed' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'admin: UPDATE bloqueado append-only');
SELECT is((WITH d AS (DELETE FROM public.logs_auditoria RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'admin: DELETE bloqueado append-only');

SAVEPOINT sp_d; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
SELECT is(rls_matrix.visible_count('public.logs_auditoria'), 0::bigint, 'dono: SELECT bloqueado');
SELECT lives_ok($$INSERT INTO public.logs_auditoria (id,user_id,action,entity,details_json) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000002','self','rls_matrix','{}'::jsonb)$$, 'dono: INSERT próprio');
SELECT is((WITH u AS (UPDATE public.logs_auditoria SET action='hack' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'dono: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.logs_auditoria RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'dono: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_d;

SAVEPOINT sp_g; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000003'::uuid);
SELECT is(rls_matrix.visible_count('public.logs_auditoria'), 0::bigint, 'gerente: SELECT bloqueado');
SELECT lives_ok($$INSERT INTO public.logs_auditoria (id,user_id,action,entity,details_json) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000003','self','rls_matrix','{}'::jsonb)$$, 'gerente: INSERT próprio');
SELECT is((WITH u AS (UPDATE public.logs_auditoria SET action='hack' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'gerente: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.logs_auditoria RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'gerente: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_g;

SAVEPOINT sp_v; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);
SELECT is(rls_matrix.visible_count('public.logs_auditoria'), 0::bigint, 'vendedor: SELECT bloqueado');
SELECT lives_ok($$INSERT INTO public.logs_auditoria (id,user_id,action,entity,details_json) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000004','self','rls_matrix','{}'::jsonb)$$, 'vendedor: INSERT próprio');
SELECT is((WITH u AS (UPDATE public.logs_auditoria SET action='hack' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'vendedor: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.logs_auditoria RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'vendedor: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_v;

SAVEPOINT sp_a; SELECT rls_matrix.assume_anon();
SELECT is(rls_matrix.visible_count('public.logs_auditoria'), 0::bigint, 'anon: SELECT bloqueado');
SELECT throws_ok($$INSERT INTO public.logs_auditoria (id,user_id,action,entity,details_json) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000001','hack','rls_matrix','{}'::jsonb)$$, NULL, 'anon: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.logs_auditoria SET action='x' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'anon: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.logs_auditoria RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'anon: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_a;

SELECT * FROM finish(); ROLLBACK;

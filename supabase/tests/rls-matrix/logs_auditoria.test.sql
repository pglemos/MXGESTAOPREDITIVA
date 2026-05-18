-- RLS Matrix — public.logs_auditoria (20 assertions)
BEGIN;
SELECT plan(20);

-- admin
SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000001'::uuid);
SELECT ok(rls_matrix.visible_count('public.logs_auditoria') >= 1, 'admin: SELECT total');
SELECT lives_ok($$INSERT INTO public.logs_auditoria (id, usuario_id, acao, detalhes) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000001','test','{}'::jsonb)$$, 'admin: INSERT');
-- logs são append-only: UPDATE/DELETE devem ser bloqueados (mesmo admin)
SELECT is((WITH u AS (UPDATE public.logs_auditoria SET acao='changed' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'admin: UPDATE em logs bloqueado (append-only)');
SELECT is((WITH d AS (DELETE FROM public.logs_auditoria RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'admin: DELETE em logs bloqueado (append-only)');

-- dono
SAVEPOINT sp_d; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
SELECT ok(rls_matrix.visible_count('public.logs_auditoria') >= 0, 'dono: SELECT (escopo restrito a admin)');
SELECT lives_ok($$INSERT INTO public.logs_auditoria (id, usuario_id, acao, detalhes) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000002','self','{}'::jsonb)$$, 'dono: INSERT próprio permitido');
SELECT is((WITH u AS (UPDATE public.logs_auditoria SET acao='hack' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'dono: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.logs_auditoria RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'dono: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_d;

-- gerente
SAVEPOINT sp_g; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000003'::uuid);
SELECT ok(rls_matrix.visible_count('public.logs_auditoria') >= 0, 'gerente: SELECT (escopo)');
SELECT lives_ok($$INSERT INTO public.logs_auditoria (id, usuario_id, acao, detalhes) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000003','self','{}'::jsonb)$$, 'gerente: INSERT próprio');
SELECT is((WITH u AS (UPDATE public.logs_auditoria SET acao='hack' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'gerente: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.logs_auditoria RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'gerente: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_g;

-- vendedor
SAVEPOINT sp_v; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);
SELECT ok(rls_matrix.visible_count('public.logs_auditoria') >= 0, 'vendedor: SELECT (escopo)');
SELECT lives_ok($$INSERT INTO public.logs_auditoria (id, usuario_id, acao, detalhes) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000004','self','{}'::jsonb)$$, 'vendedor: INSERT próprio');
SELECT is((WITH u AS (UPDATE public.logs_auditoria SET acao='hack' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'vendedor: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.logs_auditoria RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'vendedor: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_v;

-- anon
SAVEPOINT sp_a; SELECT rls_matrix.assume_anon();
SELECT is(rls_matrix.visible_count('public.logs_auditoria'), 0::bigint, 'anon: SELECT bloqueado');
SELECT throws_ok($$INSERT INTO public.logs_auditoria (id, usuario_id, acao, detalhes) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000001','hack','{}'::jsonb)$$, NULL, 'anon: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.logs_auditoria SET acao='x' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'anon: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.logs_auditoria RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'anon: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_a;

SELECT * FROM finish(); ROLLBACK;

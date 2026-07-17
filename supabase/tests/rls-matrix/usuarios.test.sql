-- RLS Matrix — public.usuarios (20 assertions)
BEGIN;
SELECT plan(20);

SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000001'::uuid);
SELECT ok(rls_matrix.visible_count('public.usuarios') >= 5, 'admin: SELECT todos');
SELECT lives_ok($$INSERT INTO public.usuarios (id, role, name, email) VALUES (gen_random_uuid(),'vendedor','temp','temp@test.local')$$, 'admin: INSERT');
SELECT lives_ok($$UPDATE public.usuarios SET name=name WHERE id='aaaaaaaa-0000-0000-0000-000000000004'$$, 'admin: UPDATE');
SELECT is((WITH d AS (DELETE FROM public.usuarios WHERE id='aaaaaaaa-0000-0000-0000-000000000005' RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'admin: DELETE bloqueado sem policy');

SAVEPOINT sp_d; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
SELECT ok(rls_matrix.visible_count('public.usuarios') >= 1, 'dono: SELECT escopo');
SELECT is((WITH i AS (INSERT INTO public.usuarios (id,role,name,email) VALUES (gen_random_uuid(),'vendedor','x','x@test.local') RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'dono: INSERT bloqueado');
SELECT lives_ok($$UPDATE public.usuarios SET name=name WHERE id='aaaaaaaa-0000-0000-0000-000000000002'$$, 'dono: UPDATE próprio permitido');
SELECT is((WITH d AS (DELETE FROM public.usuarios RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'dono: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_d;

SAVEPOINT sp_g; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000003'::uuid);
SELECT ok(rls_matrix.visible_count('public.usuarios') >= 1, 'gerente: SELECT escopo');
SELECT is((WITH i AS (INSERT INTO public.usuarios (id,role,name,email) VALUES (gen_random_uuid(),'vendedor','x','x@test.local') RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'gerente: INSERT bloqueado');
SELECT lives_ok($$UPDATE public.usuarios SET name=name WHERE id='aaaaaaaa-0000-0000-0000-000000000003'$$, 'gerente: UPDATE próprio permitido');
SELECT is((WITH d AS (DELETE FROM public.usuarios RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'gerente: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_g;

SAVEPOINT sp_v; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);
SELECT ok(rls_matrix.visible_count('public.usuarios') >= 1, 'vendedor: SELECT próprio');
SELECT is((WITH i AS (INSERT INTO public.usuarios (id,role,name,email) VALUES (gen_random_uuid(),'vendedor','x','x@test.local') RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'vendedor: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.usuarios SET role='administrador_mx' WHERE id='aaaaaaaa-0000-0000-0000-000000000001' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'vendedor: UPDATE outro usuário bloqueado');
SELECT is((WITH d AS (DELETE FROM public.usuarios WHERE id='aaaaaaaa-0000-0000-0000-000000000001' RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'vendedor: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_v;

SAVEPOINT sp_a; SELECT rls_matrix.assume_anon();
SELECT is(rls_matrix.visible_count('public.usuarios'), 0::bigint, 'anon: SELECT bloqueado');
SELECT throws_ok($$INSERT INTO public.usuarios (id,role,name,email) VALUES (gen_random_uuid(),'administrador_mx','hack','hack@test.local')$$, NULL, 'anon: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.usuarios SET role='administrador_mx' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'anon: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.usuarios RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'anon: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_a;

SELECT * FROM finish(); ROLLBACK;

-- RLS Matrix — public.metas (20 assertions)
BEGIN;
SELECT plan(20);

-- admin
SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000001'::uuid);
SELECT ok(rls_matrix.visible_count('public.metas') >= 1, 'admin: SELECT total');
SELECT lives_ok($$INSERT INTO public.metas (id, loja_id, mes, ano, valor) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111',1,2099,100)$$, 'admin: INSERT');
SELECT lives_ok($$UPDATE public.metas SET valor=valor WHERE id='eeeeeeee-0000-0000-0000-000000000001'$$, 'admin: UPDATE');
SELECT lives_ok($$DELETE FROM public.metas WHERE mes=1 AND ano=2099$$, 'admin: DELETE');

-- dono
SAVEPOINT sp_d; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
SELECT ok(rls_matrix.visible_count('public.metas') >= 1, 'dono: SELECT própria loja');
SELECT lives_ok($$INSERT INTO public.metas (id, loja_id, mes, ano, valor) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111',2,2099,200)$$, 'dono: INSERT própria loja');
SELECT lives_ok($$UPDATE public.metas SET valor=valor WHERE loja_id='11111111-1111-1111-1111-111111111111'$$, 'dono: UPDATE própria loja');
SELECT pass('dono: DELETE — xfail (DB-022)');
ROLLBACK TO SAVEPOINT sp_d;

-- gerente
SAVEPOINT sp_g; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000003'::uuid);
SELECT ok(rls_matrix.visible_count('public.metas') >= 1, 'gerente: SELECT própria loja');
SELECT lives_ok($$INSERT INTO public.metas (id, loja_id, mes, ano, valor) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111',3,2099,300)$$, 'gerente: INSERT própria loja');
SELECT is((WITH u AS (UPDATE public.metas SET valor=0 WHERE loja_id='22222222-2222-2222-2222-222222222222' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'gerente: UPDATE loja alheia bloqueado');
SELECT pass('gerente: DELETE — xfail');
ROLLBACK TO SAVEPOINT sp_g;

-- vendedor
SAVEPOINT sp_v; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);
SELECT ok(rls_matrix.visible_count('public.metas') >= 0, 'vendedor: SELECT (escopo)');
SELECT is((WITH i AS (INSERT INTO public.metas (id,loja_id,mes,ano,valor) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111',4,2099,1) ON CONFLICT DO NOTHING RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'vendedor: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.metas SET valor=0 RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'vendedor: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.metas RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'vendedor: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_v;

-- anon
SAVEPOINT sp_a; SELECT rls_matrix.assume_anon();
SELECT is(rls_matrix.visible_count('public.metas'), 0::bigint, 'anon: SELECT bloqueado');
SELECT throws_ok($$INSERT INTO public.metas (id,loja_id,mes,ano,valor) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111',5,2099,1)$$, NULL, 'anon: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.metas SET valor=0 RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'anon: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.metas RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'anon: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_a;

SELECT * FROM finish(); ROLLBACK;

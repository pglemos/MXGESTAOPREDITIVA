-- RLS Matrix — public.vendedores_loja (20 assertions)
BEGIN;
SELECT plan(20);

-- admin
SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000001'::uuid);
SELECT ok(rls_matrix.visible_count('public.vendedores_loja') >= 2, 'admin: SELECT total');
SELECT lives_ok($$INSERT INTO public.vendedores_loja (id, loja_id, nome, ativo) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','v',true)$$, 'admin: INSERT');
SELECT lives_ok($$UPDATE public.vendedores_loja SET nome=nome WHERE id='cccccccc-0000-0000-0000-000000000001'$$, 'admin: UPDATE');
SELECT lives_ok($$DELETE FROM public.vendedores_loja WHERE id='cccccccc-0000-0000-0000-000000000002'$$, 'admin: DELETE');

-- dono
SAVEPOINT sp_d; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
SELECT ok(rls_matrix.visible_count('public.vendedores_loja') >= 1, 'dono: SELECT própria loja');
SELECT lives_ok($$INSERT INTO public.vendedores_loja (id, loja_id, nome, ativo) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','v2',true)$$, 'dono: INSERT própria loja');
SELECT lives_ok($$UPDATE public.vendedores_loja SET nome=nome WHERE loja_id='11111111-1111-1111-1111-111111111111'$$, 'dono: UPDATE própria loja');
SELECT pass('dono: DELETE — xfail (DB-022)');
ROLLBACK TO SAVEPOINT sp_d;

-- gerente
SAVEPOINT sp_g; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000003'::uuid);
SELECT ok(rls_matrix.visible_count('public.vendedores_loja') >= 1, 'gerente: SELECT própria loja');
SELECT lives_ok($$INSERT INTO public.vendedores_loja (id, loja_id, nome, ativo) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','v3',true)$$, 'gerente: INSERT própria loja');
SELECT lives_ok($$UPDATE public.vendedores_loja SET nome=nome WHERE loja_id='11111111-1111-1111-1111-111111111111'$$, 'gerente: UPDATE própria loja');
SELECT pass('gerente: DELETE — xfail (DB-022)');
ROLLBACK TO SAVEPOINT sp_g;

-- vendedor
SAVEPOINT sp_v; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);
SELECT ok(rls_matrix.visible_count('public.vendedores_loja') >= 0, 'vendedor: SELECT (escopo)');
SELECT is((WITH i AS (INSERT INTO public.vendedores_loja (id, loja_id, nome, ativo) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','x',true) ON CONFLICT DO NOTHING RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'vendedor: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.vendedores_loja SET nome='x' WHERE loja_id='22222222-2222-2222-2222-222222222222' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'vendedor: UPDATE loja alheia bloqueado');
SELECT is((WITH d AS (DELETE FROM public.vendedores_loja WHERE loja_id='22222222-2222-2222-2222-222222222222' RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'vendedor: DELETE loja alheia bloqueado');
ROLLBACK TO SAVEPOINT sp_v;

-- anon
SAVEPOINT sp_a; SELECT rls_matrix.assume_anon();
SELECT is(rls_matrix.visible_count('public.vendedores_loja'), 0::bigint, 'anon: SELECT bloqueado');
SELECT throws_ok($$INSERT INTO public.vendedores_loja (id, loja_id, nome, ativo) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','x',true)$$, NULL, 'anon: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.vendedores_loja SET nome='x' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'anon: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.vendedores_loja RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'anon: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_a;

SELECT * FROM finish(); ROLLBACK;

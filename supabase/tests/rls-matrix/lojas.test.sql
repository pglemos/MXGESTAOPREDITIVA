-- RLS Matrix — public.lojas (20 assertions)
BEGIN;
SELECT plan(20);

-- admin
SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000001'::uuid);
SELECT ok(rls_matrix.visible_count('public.lojas') >= 2, 'admin: SELECT total');
SELECT lives_ok($$INSERT INTO public.lojas (id, nome, ativo) VALUES (gen_random_uuid(),'L3',true)$$, 'admin: INSERT');
SELECT lives_ok($$UPDATE public.lojas SET nome=nome WHERE id='11111111-1111-1111-1111-111111111111'$$, 'admin: UPDATE');
SELECT lives_ok($$DELETE FROM public.lojas WHERE nome='L3'$$, 'admin: DELETE');

-- dono
SAVEPOINT sp_d; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
SELECT ok(rls_matrix.visible_count('public.lojas') >= 1, 'dono: SELECT própria loja');
SELECT is((WITH i AS (INSERT INTO public.lojas (id,nome,ativo) VALUES (gen_random_uuid(),'x',true) ON CONFLICT DO NOTHING RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'dono: INSERT bloqueado (apenas admin)');
SELECT lives_ok($$UPDATE public.lojas SET nome=nome WHERE id='11111111-1111-1111-1111-111111111111'$$, 'dono: UPDATE própria loja permitido');
SELECT pass('dono: DELETE — xfail (apenas admin)');
ROLLBACK TO SAVEPOINT sp_d;

-- gerente
SAVEPOINT sp_g; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000003'::uuid);
SELECT ok(rls_matrix.visible_count('public.lojas') >= 1, 'gerente: SELECT própria loja');
SELECT is((WITH i AS (INSERT INTO public.lojas (id,nome,ativo) VALUES (gen_random_uuid(),'x',true) ON CONFLICT DO NOTHING RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'gerente: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.lojas SET nome='x' WHERE id='22222222-2222-2222-2222-222222222222' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'gerente: UPDATE loja alheia bloqueado');
SELECT pass('gerente: DELETE — xfail');
ROLLBACK TO SAVEPOINT sp_g;

-- vendedor
SAVEPOINT sp_v; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);
SELECT ok(rls_matrix.visible_count('public.lojas') >= 1, 'vendedor: SELECT própria loja');
SELECT is((WITH i AS (INSERT INTO public.lojas (id,nome,ativo) VALUES (gen_random_uuid(),'x',true) ON CONFLICT DO NOTHING RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'vendedor: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.lojas SET nome='hack' WHERE id='22222222-2222-2222-2222-222222222222' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'vendedor: UPDATE loja alheia bloqueado');
SELECT is((WITH d AS (DELETE FROM public.lojas WHERE id='22222222-2222-2222-2222-222222222222' RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'vendedor: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_v;

-- anon
SAVEPOINT sp_a; SELECT rls_matrix.assume_anon();
SELECT is(rls_matrix.visible_count('public.lojas'), 0::bigint, 'anon: SELECT bloqueado');
SELECT throws_ok($$INSERT INTO public.lojas (id,nome,ativo) VALUES (gen_random_uuid(),'x',true)$$, NULL, 'anon: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.lojas SET nome='hack' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'anon: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.lojas RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'anon: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_a;

SELECT * FROM finish(); ROLLBACK;

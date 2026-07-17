-- RLS Matrix — public.metas (20 assertions)
BEGIN;
SELECT plan(20);

SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000001'::uuid);
SELECT ok(rls_matrix.visible_count('public.metas') >= 1, 'admin: SELECT total');
SELECT lives_ok($$INSERT INTO public.metas (id,store_id,user_id,month,year,target) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000004',1,2099,100)$$, 'admin: INSERT');
SELECT lives_ok($$UPDATE public.metas SET target=target WHERE id='eeeeeeee-0000-0000-0000-000000000001'$$, 'admin: UPDATE');
SELECT is((WITH d AS (DELETE FROM public.metas WHERE id='eeeeeeee-0000-0000-0000-000000000001' RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'admin: DELETE bloqueado sem policy');

SAVEPOINT sp_d; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
SELECT ok(rls_matrix.visible_count('public.metas') >= 1, 'dono: SELECT própria loja');
SELECT is((WITH i AS (INSERT INTO public.metas (id,store_id,user_id,month,year,target) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000004',2,2099,200) RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'dono: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.metas SET target=target WHERE store_id='11111111-1111-1111-1111-111111111111' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'dono: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.metas RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'dono: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_d;

SAVEPOINT sp_g; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000003'::uuid);
SELECT ok(rls_matrix.visible_count('public.metas') >= 1, 'gerente: SELECT própria loja');
SELECT lives_ok($$INSERT INTO public.metas (id,store_id,user_id,month,year,target) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000004',3,2099,300)$$, 'gerente: INSERT própria loja');
SELECT lives_ok($$UPDATE public.metas SET target=target WHERE store_id='11111111-1111-1111-1111-111111111111'$$, 'gerente: UPDATE própria loja');
SELECT is((WITH u AS (UPDATE public.metas SET target=0 WHERE store_id='22222222-2222-2222-2222-222222222222' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'gerente: UPDATE loja alheia bloqueado');
ROLLBACK TO SAVEPOINT sp_g;

SAVEPOINT sp_v; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);
SELECT ok(rls_matrix.visible_count('public.metas') >= 1, 'vendedor: SELECT meta própria');
SELECT is((WITH i AS (INSERT INTO public.metas (id,store_id,user_id,month,year,target) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000004',4,2099,1) RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'vendedor: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.metas SET target=0 RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'vendedor: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.metas RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'vendedor: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_v;

SAVEPOINT sp_a; SELECT rls_matrix.assume_anon();
SELECT is(rls_matrix.visible_count('public.metas'), 0::bigint, 'anon: SELECT bloqueado');
SELECT throws_ok($$INSERT INTO public.metas (id,store_id,user_id,month,year,target) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000004',5,2099,1)$$, NULL, 'anon: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.metas SET target=0 RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'anon: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.metas RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'anon: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_a;

SELECT * FROM finish(); ROLLBACK;

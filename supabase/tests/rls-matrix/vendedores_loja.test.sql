-- RLS Matrix — public.vendedores_loja (20 assertions)
BEGIN;
SELECT plan(20);

SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000001'::uuid);
SELECT ok(rls_matrix.visible_count('public.vendedores_loja') >= 3, 'admin: SELECT total');
SELECT lives_ok($$INSERT INTO public.vendedores_loja (id,store_id,seller_user_id,started_at,is_active) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000004',CURRENT_DATE,true)$$, 'admin: INSERT');
SELECT lives_ok($$UPDATE public.vendedores_loja SET is_active=is_active WHERE id='cccccccc-0000-0000-0000-000000000001'$$, 'admin: UPDATE');
SELECT lives_ok($$DELETE FROM public.vendedores_loja WHERE id='cccccccc-0000-0000-0000-000000000003'$$, 'admin: DELETE');

SAVEPOINT sp_d; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
SELECT ok(rls_matrix.visible_count('public.vendedores_loja') >= 2, 'dono: SELECT vendedores da loja');
SELECT is(rls_matrix.dml_count($$INSERT INTO public.vendedores_loja (id,store_id,seller_user_id,started_at,is_active) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000004',CURRENT_DATE,true)$$), 0::bigint, 'dono: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.vendedores_loja SET is_active=is_active WHERE store_id='11111111-1111-1111-1111-111111111111'$$), 0::bigint, 'dono: UPDATE bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.vendedores_loja$$), 0::bigint, 'dono: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_d;

SAVEPOINT sp_g; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000003'::uuid);
SELECT ok(rls_matrix.visible_count('public.vendedores_loja') >= 2, 'gerente: SELECT vendedores da loja');
SELECT is(rls_matrix.dml_count($$INSERT INTO public.vendedores_loja (id,store_id,seller_user_id,started_at,is_active) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000004',CURRENT_DATE,true)$$), 0::bigint, 'gerente: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.vendedores_loja SET is_active=false WHERE store_id='22222222-2222-2222-2222-222222222222'$$), 0::bigint, 'gerente: UPDATE loja alheia bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.vendedores_loja$$), 0::bigint, 'gerente: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_g;

SAVEPOINT sp_v; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);
SELECT is(rls_matrix.visible_count('public.vendedores_loja'), 1::bigint, 'vendedor: SELECT próprio vínculo');
SELECT is(rls_matrix.dml_count($$INSERT INTO public.vendedores_loja (id,store_id,seller_user_id,started_at,is_active) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000004',CURRENT_DATE,true)$$), 0::bigint, 'vendedor: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.vendedores_loja SET is_active=false WHERE store_id='22222222-2222-2222-2222-222222222222'$$), 0::bigint, 'vendedor: UPDATE loja alheia bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.vendedores_loja$$), 0::bigint, 'vendedor: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_v;

SAVEPOINT sp_a; SELECT rls_matrix.assume_anon();
SELECT is(rls_matrix.visible_count('public.vendedores_loja'), 0::bigint, 'anon: SELECT bloqueado');
SELECT throws_ok($$INSERT INTO public.vendedores_loja (id,store_id,seller_user_id,started_at,is_active) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000004',CURRENT_DATE,true)$$, NULL, 'anon: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.vendedores_loja SET is_active=false$$), 0::bigint, 'anon: UPDATE bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.vendedores_loja$$), 0::bigint, 'anon: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_a;

SELECT * FROM finish(); ROLLBACK;

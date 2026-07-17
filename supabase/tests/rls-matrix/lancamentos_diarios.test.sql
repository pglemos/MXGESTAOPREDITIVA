-- RLS Matrix — public.lancamentos_diarios (20 assertions)
BEGIN;
SELECT plan(20);

SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000001'::uuid);
SELECT ok(rls_matrix.visible_count('public.lancamentos_diarios') >= 1, 'admin: SELECT total');
SELECT lives_ok($$INSERT INTO public.lancamentos_diarios (id,store_id,seller_user_id,reference_date,metric_scope) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000004',CURRENT_DATE + 1,'daily')$$, 'admin: INSERT');
SELECT lives_ok($$UPDATE public.lancamentos_diarios SET leads_prev_day=leads_prev_day+1 WHERE id='dddddddd-0000-0000-0000-000000000001'$$, 'admin: UPDATE');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.lancamentos_diarios WHERE id='dddddddd-0000-0000-0000-000000000001'$$), 0::bigint, 'admin: DELETE bloqueado sem policy');

SAVEPOINT sp_d; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
SELECT ok(rls_matrix.visible_count('public.lancamentos_diarios') >= 1, 'dono: SELECT própria loja');
SELECT is(rls_matrix.dml_count($$INSERT INTO public.lancamentos_diarios (id,store_id,seller_user_id,reference_date,metric_scope) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000004',CURRENT_DATE,'daily')$$), 0::bigint, 'dono: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.lancamentos_diarios SET leads_prev_day=leads_prev_day+1 WHERE store_id='11111111-1111-1111-1111-111111111111'$$), 0::bigint, 'dono: UPDATE bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.lancamentos_diarios$$), 0::bigint, 'dono: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_d;

SAVEPOINT sp_g; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000003'::uuid);
SELECT ok(rls_matrix.visible_count('public.lancamentos_diarios') >= 1, 'gerente: SELECT própria loja');
SELECT is(rls_matrix.dml_count($$INSERT INTO public.lancamentos_diarios (id,store_id,seller_user_id,reference_date,metric_scope) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000004',CURRENT_DATE,'daily')$$), 0::bigint, 'gerente: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.lancamentos_diarios SET leads_prev_day=leads_prev_day+1 WHERE store_id='11111111-1111-1111-1111-111111111111'$$), 0::bigint, 'gerente: UPDATE bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.lancamentos_diarios$$), 0::bigint, 'gerente: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_g;

SAVEPOINT sp_v; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);
SELECT ok(rls_matrix.visible_count('public.lancamentos_diarios') >= 1, 'vendedor: SELECT próprio');
SELECT lives_ok($$INSERT INTO public.lancamentos_diarios (id,store_id,seller_user_id,reference_date,metric_scope) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000004',CURRENT_DATE + 2,'daily')$$, 'vendedor: INSERT próprio');
SELECT lives_ok($$UPDATE public.lancamentos_diarios SET leads_prev_day=leads_prev_day+1 WHERE id='dddddddd-0000-0000-0000-000000000001'$$, 'vendedor: UPDATE próprio');
SELECT is(rls_matrix.dml_count($$UPDATE public.lancamentos_diarios SET leads_prev_day=0 WHERE store_id='22222222-2222-2222-2222-222222222222'$$), 0::bigint, 'vendedor: UPDATE loja alheia bloqueado');
ROLLBACK TO SAVEPOINT sp_v;

SAVEPOINT sp_a; SELECT rls_matrix.assume_anon();
SELECT is(rls_matrix.visible_count('public.lancamentos_diarios'), 0::bigint, 'anon: SELECT bloqueado');
SELECT throws_ok($$INSERT INTO public.lancamentos_diarios (id,store_id,seller_user_id,reference_date,metric_scope) VALUES (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000004',CURRENT_DATE,'daily')$$, NULL, 'anon: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.lancamentos_diarios SET leads_prev_day=0$$), 0::bigint, 'anon: UPDATE bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.lancamentos_diarios$$), 0::bigint, 'anon: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_a;

SELECT * FROM finish(); ROLLBACK;

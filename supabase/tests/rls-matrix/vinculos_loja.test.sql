-- RLS Matrix — public.vinculos_loja (20 assertions)
BEGIN;
SELECT plan(20);

SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000001'::uuid);
SELECT ok(rls_matrix.visible_count('public.vinculos_loja') >= 5, 'admin: SELECT total');
SELECT lives_ok($$INSERT INTO public.vinculos_loja (user_id,store_id,role,is_active) VALUES ('aaaaaaaa-0000-0000-0000-000000000005','22222222-2222-2222-2222-222222222222','vendedor',true)$$, 'admin: INSERT');
SELECT lives_ok($$UPDATE public.vinculos_loja SET is_active=is_active WHERE user_id='aaaaaaaa-0000-0000-0000-000000000004'$$, 'admin: UPDATE');
SELECT lives_ok($$DELETE FROM public.vinculos_loja WHERE user_id='aaaaaaaa-0000-0000-0000-000000000005' AND store_id='22222222-2222-2222-2222-222222222222'$$, 'admin: DELETE');

SAVEPOINT sp_d; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
SELECT ok(rls_matrix.visible_count('public.vinculos_loja') >= 3, 'dono: SELECT vínculos da loja');
SELECT is(rls_matrix.dml_count($$INSERT INTO public.vinculos_loja (user_id,store_id,role,is_active) VALUES ('aaaaaaaa-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','vendedor',true)$$), 0::bigint, 'dono: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.vinculos_loja SET is_active=is_active WHERE store_id='11111111-1111-1111-1111-111111111111'$$), 0::bigint, 'dono: UPDATE bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.vinculos_loja$$), 0::bigint, 'dono: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_d;

SAVEPOINT sp_g; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000003'::uuid);
SELECT ok(rls_matrix.visible_count('public.vinculos_loja') >= 3, 'gerente: SELECT vínculos da loja');
SELECT is(rls_matrix.dml_count($$INSERT INTO public.vinculos_loja (user_id,store_id,role,is_active) VALUES ('aaaaaaaa-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','vendedor',true)$$), 0::bigint, 'gerente: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.vinculos_loja SET role='gerente' WHERE store_id='22222222-2222-2222-2222-222222222222'$$), 0::bigint, 'gerente: UPDATE loja alheia bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.vinculos_loja$$), 0::bigint, 'gerente: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_g;

SAVEPOINT sp_v; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);
SELECT is(rls_matrix.visible_count('public.vinculos_loja'), 1::bigint, 'vendedor: SELECT próprio vínculo');
SELECT is(rls_matrix.dml_count($$INSERT INTO public.vinculos_loja (user_id,store_id,role,is_active) VALUES ('aaaaaaaa-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222','gerente',true)$$), 0::bigint, 'vendedor: INSERT auto-promoção bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.vinculos_loja SET role='administrador_mx' WHERE user_id='aaaaaaaa-0000-0000-0000-000000000004'$$), 0::bigint, 'vendedor: UPDATE auto-escalada bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.vinculos_loja WHERE user_id='aaaaaaaa-0000-0000-0000-000000000004'$$), 0::bigint, 'vendedor: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_v;

SAVEPOINT sp_a; SELECT rls_matrix.assume_anon();
SELECT is(rls_matrix.visible_count('public.vinculos_loja'), 0::bigint, 'anon: SELECT bloqueado');
SELECT throws_ok($$INSERT INTO public.vinculos_loja (user_id,store_id,role,is_active) VALUES ('aaaaaaaa-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','administrador_mx',true)$$, NULL, 'anon: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.vinculos_loja SET role='administrador_mx'$$), 0::bigint, 'anon: UPDATE bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.vinculos_loja$$), 0::bigint, 'anon: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_a;

SELECT * FROM finish(); ROLLBACK;

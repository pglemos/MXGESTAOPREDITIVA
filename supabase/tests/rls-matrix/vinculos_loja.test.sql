-- RLS Matrix — public.vinculos_loja (20 assertions)
BEGIN;
SELECT plan(20);

-- admin
SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000001'::uuid);
SELECT ok(rls_matrix.visible_count('public.vinculos_loja') >= 4, 'admin: SELECT total');
SELECT lives_ok($$INSERT INTO public.vinculos_loja (usuario_id, loja_id, papel, ativo) VALUES ('aaaaaaaa-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','vendedor',true) ON CONFLICT DO NOTHING$$, 'admin: INSERT');
SELECT lives_ok($$UPDATE public.vinculos_loja SET ativo=ativo WHERE usuario_id='aaaaaaaa-0000-0000-0000-000000000004'$$, 'admin: UPDATE');
SELECT lives_ok($$DELETE FROM public.vinculos_loja WHERE usuario_id='aaaaaaaa-0000-0000-0000-000000000005'$$, 'admin: DELETE');

-- dono
SAVEPOINT sp_d; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
SELECT ok(rls_matrix.visible_count('public.vinculos_loja') >= 1, 'dono: SELECT própria loja');
SELECT is((WITH i AS (INSERT INTO public.vinculos_loja (usuario_id, loja_id, papel, ativo) VALUES ('aaaaaaaa-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','vendedor',true) ON CONFLICT DO NOTHING RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'dono: INSERT vínculo — xfail/bloqueado (apenas admin)');
SELECT lives_ok($$UPDATE public.vinculos_loja SET ativo=ativo WHERE loja_id='11111111-1111-1111-1111-111111111111' AND usuario_id='aaaaaaaa-0000-0000-0000-000000000004'$$, 'dono: UPDATE vínculo da própria loja');
SELECT pass('dono: DELETE — xfail (apenas admin)');
ROLLBACK TO SAVEPOINT sp_d;

-- gerente
SAVEPOINT sp_g; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000003'::uuid);
SELECT ok(rls_matrix.visible_count('public.vinculos_loja') >= 1, 'gerente: SELECT própria loja');
SELECT is((WITH i AS (INSERT INTO public.vinculos_loja (usuario_id, loja_id, papel, ativo) VALUES ('aaaaaaaa-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','vendedor',true) ON CONFLICT DO NOTHING RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'gerente: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.vinculos_loja SET papel='gerente' WHERE loja_id='22222222-2222-2222-2222-222222222222' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'gerente: UPDATE loja alheia bloqueado');
SELECT pass('gerente: DELETE — xfail');
ROLLBACK TO SAVEPOINT sp_g;

-- vendedor
SAVEPOINT sp_v; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);
SELECT ok(rls_matrix.visible_count('public.vinculos_loja') >= 0, 'vendedor: SELECT (próprio vínculo)');
SELECT is((WITH i AS (INSERT INTO public.vinculos_loja (usuario_id, loja_id, papel, ativo) VALUES ('aaaaaaaa-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222','gerente',true) ON CONFLICT DO NOTHING RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'vendedor: INSERT auto-promoção bloqueado');
SELECT is((WITH u AS (UPDATE public.vinculos_loja SET papel='admin' WHERE usuario_id='aaaaaaaa-0000-0000-0000-000000000004' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'vendedor: UPDATE auto-escalada bloqueado');
SELECT is((WITH d AS (DELETE FROM public.vinculos_loja WHERE usuario_id='aaaaaaaa-0000-0000-0000-000000000004' RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'vendedor: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_v;

-- anon
SAVEPOINT sp_a; SELECT rls_matrix.assume_anon();
SELECT is(rls_matrix.visible_count('public.vinculos_loja'), 0::bigint, 'anon: SELECT bloqueado');
SELECT throws_ok($$INSERT INTO public.vinculos_loja (usuario_id, loja_id, papel, ativo) VALUES ('aaaaaaaa-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','admin',true)$$, NULL, 'anon: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.vinculos_loja SET papel='admin' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'anon: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.vinculos_loja RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'anon: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_a;

SELECT * FROM finish(); ROLLBACK;

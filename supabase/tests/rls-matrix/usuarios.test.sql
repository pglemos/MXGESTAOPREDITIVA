-- RLS Matrix — public.usuarios (5 roles × 4 ops = 20 assertions)
BEGIN;
SELECT plan(20);

-- admin
SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000001'::uuid);
SELECT ok(rls_matrix.visible_count('public.usuarios') >= 5, 'admin: SELECT enxerga todos os usuários');
SELECT lives_ok($$INSERT INTO public.usuarios (id, role, nome) VALUES (gen_random_uuid(), 'vendedor', 'temp')$$, 'admin: INSERT permitido');
SELECT lives_ok($$UPDATE public.usuarios SET nome = nome WHERE id = 'aaaaaaaa-0000-0000-0000-000000000004'$$, 'admin: UPDATE permitido');
SELECT lives_ok($$DELETE FROM public.usuarios WHERE id = 'aaaaaaaa-0000-0000-0000-000000000005'$$, 'admin: DELETE permitido');

-- dono
SAVEPOINT sp_dono;
SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
SELECT ok(rls_matrix.visible_count('public.usuarios') >= 1, 'dono: SELECT enxerga ao menos a si próprio');
SELECT is((WITH i AS (INSERT INTO public.usuarios (id, role, nome) VALUES (gen_random_uuid(),'vendedor','x') ON CONFLICT DO NOTHING RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'dono: INSERT em usuarios bloqueado (apenas admin)');
SELECT lives_ok($$UPDATE public.usuarios SET nome = nome WHERE id = 'aaaaaaaa-0000-0000-0000-000000000002'$$, 'dono: UPDATE próprio permitido');
SELECT pass('dono: DELETE — xfail (apenas admin pode deletar usuários)');
ROLLBACK TO SAVEPOINT sp_dono;

-- gerente
SAVEPOINT sp_ger;
SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000003'::uuid);
SELECT ok(rls_matrix.visible_count('public.usuarios') >= 1, 'gerente: SELECT escopo restrito');
SELECT is((WITH i AS (INSERT INTO public.usuarios (id, role, nome) VALUES (gen_random_uuid(),'vendedor','x') ON CONFLICT DO NOTHING RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'gerente: INSERT bloqueado');
SELECT lives_ok($$UPDATE public.usuarios SET nome = nome WHERE id = 'aaaaaaaa-0000-0000-0000-000000000003'$$, 'gerente: UPDATE próprio permitido');
SELECT pass('gerente: DELETE — xfail (apenas admin)');
ROLLBACK TO SAVEPOINT sp_ger;

-- vendedor
SAVEPOINT sp_vend;
SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);
SELECT ok(rls_matrix.visible_count('public.usuarios') >= 1, 'vendedor: SELECT enxerga ao menos a si próprio');
SELECT is((WITH i AS (INSERT INTO public.usuarios (id, role, nome) VALUES (gen_random_uuid(),'vendedor','x') ON CONFLICT DO NOTHING RETURNING 1) SELECT count(*) FROM i), 0::bigint, 'vendedor: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.usuarios SET role = 'admin' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'vendedor: UPDATE em outro usuário bloqueado (escalada de privilégio)');
SELECT is((WITH d AS (DELETE FROM public.usuarios WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001' RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'vendedor: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_vend;

-- anon
SAVEPOINT sp_anon;
SELECT rls_matrix.assume_anon();
SELECT is(rls_matrix.visible_count('public.usuarios'), 0::bigint, 'anon: SELECT bloqueado');
SELECT throws_ok($$INSERT INTO public.usuarios (id, role, nome) VALUES (gen_random_uuid(),'admin','hack')$$, NULL, 'anon: INSERT bloqueado');
SELECT is((WITH u AS (UPDATE public.usuarios SET role='admin' RETURNING 1) SELECT count(*) FROM u), 0::bigint, 'anon: UPDATE bloqueado');
SELECT is((WITH d AS (DELETE FROM public.usuarios RETURNING 1) SELECT count(*) FROM d), 0::bigint, 'anon: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_anon;

SELECT * FROM finish();
ROLLBACK;

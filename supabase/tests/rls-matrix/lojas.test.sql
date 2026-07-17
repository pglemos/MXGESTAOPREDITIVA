-- RLS Matrix — public.lojas (20 assertions)
BEGIN;
SELECT plan(20);

SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000001'::uuid);
SELECT ok(rls_matrix.visible_count('public.lojas') >= 2, 'admin: SELECT total');
SELECT lives_ok($$INSERT INTO public.lojas (id, name, active) VALUES (gen_random_uuid(),'L3',true)$$, 'admin: INSERT');
SELECT lives_ok($$UPDATE public.lojas SET name=name WHERE id='11111111-1111-1111-1111-111111111111'$$, 'admin: UPDATE');
SELECT lives_ok($$DELETE FROM public.lojas WHERE name='L3'$$, 'admin: DELETE');

SAVEPOINT sp_d; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
SELECT ok(rls_matrix.visible_count('public.lojas') >= 1, 'dono: SELECT própria loja');
SELECT is(rls_matrix.dml_count($$INSERT INTO public.lojas (id,name,active) VALUES (gen_random_uuid(),'x',true)$$), 0::bigint, 'dono: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.lojas SET name=name$$), 0::bigint, 'dono: UPDATE bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.lojas$$), 0::bigint, 'dono: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_d;

SAVEPOINT sp_g; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000003'::uuid);
SELECT ok(rls_matrix.visible_count('public.lojas') >= 1, 'gerente: SELECT própria loja');
SELECT is(rls_matrix.dml_count($$INSERT INTO public.lojas (id,name,active) VALUES (gen_random_uuid(),'x',true)$$), 0::bigint, 'gerente: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.lojas SET name='x' WHERE id='11111111-1111-1111-1111-111111111111'$$), 0::bigint, 'gerente: UPDATE bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.lojas$$), 0::bigint, 'gerente: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_g;

SAVEPOINT sp_v; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);
SELECT ok(rls_matrix.visible_count('public.lojas') >= 1, 'vendedor: SELECT própria loja');
SELECT is(rls_matrix.dml_count($$INSERT INTO public.lojas (id,name,active) VALUES (gen_random_uuid(),'x',true)$$), 0::bigint, 'vendedor: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.lojas SET name='hack'$$), 0::bigint, 'vendedor: UPDATE bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.lojas$$), 0::bigint, 'vendedor: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_v;

SAVEPOINT sp_a; SELECT rls_matrix.assume_anon();
SELECT is(rls_matrix.visible_count('public.lojas'), 0::bigint, 'anon: SELECT bloqueado');
SELECT throws_ok($$INSERT INTO public.lojas (id,name,active) VALUES (gen_random_uuid(),'x',true)$$, NULL, 'anon: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.lojas SET name='hack'$$), 0::bigint, 'anon: UPDATE bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.lojas$$), 0::bigint, 'anon: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_a;

SELECT * FROM finish(); ROLLBACK;

-- RLS Matrix — public.role_assignments_audit (20 assertions)
BEGIN;
SELECT plan(20);

SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000001'::uuid);
SELECT ok(rls_matrix.visible_count('public.role_assignments_audit') >= 1, 'admin: SELECT total');
SELECT is(rls_matrix.dml_count($$INSERT INTO public.role_assignments_audit (id,user_id,role_name,assigned_by,action) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000004','gerente','aaaaaaaa-0000-0000-0000-000000000001','test')$$), 0::bigint, 'admin: INSERT bloqueado append-only');
SELECT is(rls_matrix.dml_count($$UPDATE public.role_assignments_audit SET action='changed'$$), 0::bigint, 'admin: UPDATE bloqueado append-only');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.role_assignments_audit$$), 0::bigint, 'admin: DELETE bloqueado append-only');

SAVEPOINT sp_d; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
SELECT is(rls_matrix.visible_count('public.role_assignments_audit'), 0::bigint, 'dono: SELECT bloqueado');
SELECT is(rls_matrix.dml_count($$INSERT INTO public.role_assignments_audit (id,user_id,role_name,assigned_by,action) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000004','gerente','aaaaaaaa-0000-0000-0000-000000000002','test')$$), 0::bigint, 'dono: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.role_assignments_audit SET action='hack'$$), 0::bigint, 'dono: UPDATE bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.role_assignments_audit$$), 0::bigint, 'dono: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_d;

SAVEPOINT sp_g; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000003'::uuid);
SELECT is(rls_matrix.visible_count('public.role_assignments_audit'), 0::bigint, 'gerente: SELECT bloqueado');
SELECT is(rls_matrix.dml_count($$INSERT INTO public.role_assignments_audit (id,user_id,role_name,assigned_by,action) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000004','gerente','aaaaaaaa-0000-0000-0000-000000000003','test')$$), 0::bigint, 'gerente: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.role_assignments_audit SET action='hack'$$), 0::bigint, 'gerente: UPDATE bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.role_assignments_audit$$), 0::bigint, 'gerente: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_g;

SAVEPOINT sp_v; SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);
SELECT is(rls_matrix.visible_count('public.role_assignments_audit'), 0::bigint, 'vendedor: SELECT bloqueado');
SELECT is(rls_matrix.dml_count($$INSERT INTO public.role_assignments_audit (id,user_id,role_name,assigned_by,action) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000004','administrador_mx','aaaaaaaa-0000-0000-0000-000000000004','self')$$), 0::bigint, 'vendedor: INSERT auto-promoção bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.role_assignments_audit SET action='hack'$$), 0::bigint, 'vendedor: UPDATE bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.role_assignments_audit$$), 0::bigint, 'vendedor: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_v;

SAVEPOINT sp_a; SELECT rls_matrix.assume_anon();
SELECT is(rls_matrix.visible_count('public.role_assignments_audit'), 0::bigint, 'anon: SELECT bloqueado');
SELECT throws_ok($$INSERT INTO public.role_assignments_audit (id,user_id,role_name,assigned_by,action) VALUES (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000004','administrador_mx','aaaaaaaa-0000-0000-0000-000000000004','self')$$, NULL, 'anon: INSERT bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.role_assignments_audit SET action='x'$$), 0::bigint, 'anon: UPDATE bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.role_assignments_audit$$), 0::bigint, 'anon: DELETE bloqueado');
ROLLBACK TO SAVEPOINT sp_a;

SELECT * FROM finish(); ROLLBACK;

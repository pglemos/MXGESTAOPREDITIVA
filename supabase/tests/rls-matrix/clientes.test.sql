-- ============================================================================
-- RLS Matrix — public.clientes / shared opportunity read
-- Cobertura: ownership, shared open opportunity, terminal opportunity,
--            cross-store isolation and anon denial.
-- ============================================================================
BEGIN;
SELECT plan(12);

SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);
SELECT is((SELECT count(*) FROM public.clientes WHERE id = '12111111-1111-1111-1111-111111111111'), 1::bigint,
          'vendedor: SELECT cliente próprio');
SELECT is((SELECT count(*) FROM public.clientes WHERE id = '12111111-1111-1111-1111-111111111112'), 1::bigint,
          'vendedor: SELECT cliente compartilhado enquanto oportunidade está aberta');
SELECT is((SELECT count(*) FROM public.clientes WHERE id = '12111111-1111-1111-1111-111111111113'), 0::bigint,
          'vendedor: SELECT cliente compartilhado bloqueado após oportunidade terminal');
SELECT is((SELECT count(*) FROM public.clientes WHERE id = '12111111-1111-1111-1111-111111111114'), 0::bigint,
          'vendedor: SELECT cliente de outra loja bloqueado');
SELECT is(rls_matrix.dml_count($$
            UPDATE public.clientes SET observacoes = 'nao deve alterar'
             WHERE id = '12111111-1111-1111-1111-111111111112'$$), 0::bigint,
          'vendedor: UPDATE ficha compartilhada bloqueado');
SELECT is(rls_matrix.dml_count($$
            DELETE FROM public.clientes
             WHERE id = '12111111-1111-1111-1111-111111111112'$$), 0::bigint,
          'vendedor: DELETE ficha compartilhada bloqueado');
SELECT is((SELECT count(*) FROM public.clientes), 2::bigint,
          'vendedor: conjunto visível limitado ao próprio e ao compartilhado aberto');

SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000001'::uuid);
SELECT ok((SELECT count(*) FROM public.clientes) >= 4,
          'admin: SELECT clientes das duas lojas');

SELECT rls_matrix.assume_anon();
SELECT is((SELECT count(*) FROM public.clientes), 0::bigint,
          'anon: SELECT clientes bloqueado');
SELECT throws_ok($$
  INSERT INTO public.clientes (id, loja_id, seller_user_id, nome)
  VALUES ('12111111-1111-1111-1111-111111111199',
          '11111111-1111-1111-1111-111111111111',
          'aaaaaaaa-0000-0000-0000-000000000004', 'anon')
$$, NULL, 'anon: INSERT clientes bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.clientes SET nome = 'anon'$$), 0::bigint, 'anon: UPDATE clientes bloqueado');
SELECT is(rls_matrix.dml_count($$DELETE FROM public.clientes$$), 0::bigint, 'anon: DELETE clientes bloqueado');

SELECT * FROM finish();
ROLLBACK;

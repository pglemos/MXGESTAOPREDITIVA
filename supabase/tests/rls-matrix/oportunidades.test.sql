-- ============================================================================
-- RLS Matrix — public.oportunidades
-- P0-04: cross-store escalation via cliente_id/loja_id, reuso legítimo de
-- cliente por outro vendedor DENTRO da mesma loja continua permitido.
-- ============================================================================
BEGIN;
SELECT plan(7);

SELECT rls_matrix.assume('aaaaaaaa-0000-0000-0000-000000000004'::uuid);

-- Reuso legítimo: vendedor 004 cria oportunidade pro cliente compartilhado
-- 111112, que pertence a 005 mas está na MESMA loja (111...1). Deve passar
-- (feature documentada em 20260710140000 / 20260716240000).
SELECT is(rls_matrix.dml_count($$
            INSERT INTO public.oportunidades
              (id, cliente_id, loja_id, seller_user_id, etapa)
            VALUES
              ('13111111-1111-1111-1111-111111111199',
               '12111111-1111-1111-1111-111111111112',
               '11111111-1111-1111-1111-111111111111',
               'aaaaaaaa-0000-0000-0000-000000000004',
               'prospeccao')
          $$), 1::bigint,
          'vendedor: INSERT oportunidade p/ cliente compartilhado MESMA loja permitido');

-- P0-04 (cross-store): cliente 111114 pertence a 005 E está em OUTRA loja
-- (222...2). Vendedor 004 não tem vínculo ativo com loja 2. Deve bloquear.
SELECT is(rls_matrix.dml_count($$
            INSERT INTO public.oportunidades
              (id, cliente_id, loja_id, seller_user_id, etapa)
            VALUES
              ('13111111-1111-1111-1111-111111111198',
               '12111111-1111-1111-1111-111111111114',
               '22222222-2222-2222-2222-222222222222',
               'aaaaaaaa-0000-0000-0000-000000000004',
               'prospeccao')
          $$), 0::bigint,
          'vendedor: INSERT oportunidade cross-store (cliente e loja de outra loja) bloqueado');

-- P0-04 variante: loja_id da oportunidade = loja própria (111...1), mas
-- cliente_id aponta pra cliente cadastrado em OUTRA loja (111114, loja 2).
-- Inconsistência cliente x loja deve bloquear mesmo se o vendedor pertence
-- à loja informada.
SELECT is(rls_matrix.dml_count($$
            INSERT INTO public.oportunidades
              (id, cliente_id, loja_id, seller_user_id, etapa)
            VALUES
              ('13111111-1111-1111-1111-111111111197',
               '12111111-1111-1111-1111-111111111114',
               '11111111-1111-1111-1111-111111111111',
               'aaaaaaaa-0000-0000-0000-000000000004',
               'prospeccao')
          $$), 0::bigint,
          'vendedor: INSERT com cliente de outra loja mas loja_id própria bloqueado');

-- Falsificação de seller_user_id: vendedor 004 tenta criar linha em nome de 005.
SELECT is(rls_matrix.dml_count($$
            INSERT INTO public.oportunidades
              (id, cliente_id, loja_id, seller_user_id, etapa)
            VALUES
              ('13111111-1111-1111-1111-111111111196',
               '12111111-1111-1111-1111-111111111111',
               '11111111-1111-1111-1111-111111111111',
               'aaaaaaaa-0000-0000-0000-000000000005',
               'prospeccao')
          $$), 0::bigint,
          'vendedor: INSERT com seller_user_id falsificado bloqueado');

-- UPDATE de oportunidade própria continua funcionando normalmente.
SELECT is(rls_matrix.dml_count($$
            UPDATE public.oportunidades SET etapa = 'negociacao'
             WHERE id = '13111111-1111-1111-1111-111111111111'
          $$), 1::bigint,
          'vendedor: UPDATE oportunidade própria (cliente/loja consistentes) permitido');

SELECT rls_matrix.assume_anon();
SELECT throws_ok($$
  INSERT INTO public.oportunidades (id, cliente_id, loja_id, seller_user_id, etapa)
  VALUES ('13111111-1111-1111-1111-111111111195',
          '12111111-1111-1111-1111-111111111111',
          '11111111-1111-1111-1111-111111111111',
          'aaaaaaaa-0000-0000-0000-000000000004', 'prospeccao')
$$, NULL, 'anon: INSERT oportunidades bloqueado');
SELECT is(rls_matrix.dml_count($$UPDATE public.oportunidades SET etapa = 'perdido'$$), 0::bigint,
          'anon: UPDATE oportunidades bloqueado');

SELECT * FROM finish();
ROLLBACK;

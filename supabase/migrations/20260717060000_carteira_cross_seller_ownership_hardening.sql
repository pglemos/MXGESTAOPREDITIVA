-- P0-04: oportunidades/agendamentos/atendimentos permitiam INSERT/UPDATE
-- apontando cliente_id de QUALQUER loja. A policy `*_seller_rw` só validava
-- `seller_user_id = auth.uid()` na própria linha, sem checar que o cliente_id
-- referenciado pertence à mesma loja nem que o vendedor está de fato staffed
-- nessa loja. Isso permitia escalada cross-store: um vendedor podia criar
-- oportunidade/agendamento/atendimento apontando pra um cliente de OUTRA loja
-- (bastando adivinhar/enumerar o UUID), o que é vazamento de dado.
--
-- IMPORTANTE: reuso de cliente por OUTRO vendedor da MESMA loja é feature
-- legítima e documentada (ver 20260710140000 e 20260716240000 —
-- pode_ler_cliente_por_oportunidade / clientes_shared_read). Este fix NÃO
-- exige clientes.seller_user_id = auth.uid(); exige apenas:
--   1. o cliente referenciado pertence à mesma loja da linha (loja_id);
--   2. o vendedor está ativamente vinculado a essa loja (vendedores_loja).
-- Isso bloqueia o cross-store leak sem quebrar o fluxo de cliente
-- compartilhado dentro da mesma loja.

BEGIN;

-- oportunidades: cliente_id é NOT NULL, sempre validar.
DROP POLICY IF EXISTS oportunidades_seller_rw ON public.oportunidades;
CREATE POLICY oportunidades_seller_rw ON public.oportunidades FOR ALL TO authenticated
  USING (
    seller_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = oportunidades.cliente_id
        AND c.loja_id = oportunidades.loja_id
    )
    AND EXISTS (
      SELECT 1 FROM public.vendedores_loja vl
      WHERE vl.seller_user_id = auth.uid()
        AND vl.store_id = oportunidades.loja_id
        AND vl.is_active
    )
  )
  WITH CHECK (
    seller_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = oportunidades.cliente_id
        AND c.loja_id = oportunidades.loja_id
    )
    AND EXISTS (
      SELECT 1 FROM public.vendedores_loja vl
      WHERE vl.seller_user_id = auth.uid()
        AND vl.store_id = oportunidades.loja_id
        AND vl.is_active
    )
  );

-- agendamentos: cliente_id é nullable (P1-01) — só valida posse de loja quando presente.
DROP POLICY IF EXISTS agendamentos_seller_rw ON public.agendamentos;
CREATE POLICY agendamentos_seller_rw ON public.agendamentos FOR ALL TO authenticated
  USING (
    seller_user_id = auth.uid()
    AND (
      agendamentos.cliente_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.clientes c
        WHERE c.id = agendamentos.cliente_id
          AND c.loja_id = agendamentos.loja_id
      )
    )
    AND EXISTS (
      SELECT 1 FROM public.vendedores_loja vl
      WHERE vl.seller_user_id = auth.uid()
        AND vl.store_id = agendamentos.loja_id
        AND vl.is_active
    )
  )
  WITH CHECK (
    seller_user_id = auth.uid()
    AND (
      agendamentos.cliente_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.clientes c
        WHERE c.id = agendamentos.cliente_id
          AND c.loja_id = agendamentos.loja_id
      )
    )
    AND EXISTS (
      SELECT 1 FROM public.vendedores_loja vl
      WHERE vl.seller_user_id = auth.uid()
        AND vl.store_id = agendamentos.loja_id
        AND vl.is_active
    )
  );

-- atendimentos: cliente_id é nullable — mesma regra.
DROP POLICY IF EXISTS atendimentos_seller_rw ON public.atendimentos;
CREATE POLICY atendimentos_seller_rw ON public.atendimentos FOR ALL TO authenticated
  USING (
    seller_user_id = auth.uid()
    AND (
      atendimentos.cliente_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.clientes c
        WHERE c.id = atendimentos.cliente_id
          AND c.loja_id = atendimentos.loja_id
      )
    )
    AND EXISTS (
      SELECT 1 FROM public.vendedores_loja vl
      WHERE vl.seller_user_id = auth.uid()
        AND vl.store_id = atendimentos.loja_id
        AND vl.is_active
    )
  )
  WITH CHECK (
    seller_user_id = auth.uid()
    AND (
      atendimentos.cliente_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.clientes c
        WHERE c.id = atendimentos.cliente_id
          AND c.loja_id = atendimentos.loja_id
      )
    )
    AND EXISTS (
      SELECT 1 FROM public.vendedores_loja vl
      WHERE vl.seller_user_id = auth.uid()
        AND vl.store_id = atendimentos.loja_id
        AND vl.is_active
    )
  );

COMMIT;

-- ============================================================================
-- DOWN (reversão manual)
-- ============================================================================
-- BEGIN;
-- DROP POLICY IF EXISTS oportunidades_seller_rw ON public.oportunidades;
-- CREATE POLICY oportunidades_seller_rw ON public.oportunidades FOR ALL TO authenticated
--   USING (seller_user_id = auth.uid()) WITH CHECK (seller_user_id = auth.uid());
-- DROP POLICY IF EXISTS agendamentos_seller_rw ON public.agendamentos;
-- CREATE POLICY agendamentos_seller_rw ON public.agendamentos FOR ALL TO authenticated
--   USING (seller_user_id = auth.uid()) WITH CHECK (seller_user_id = auth.uid());
-- DROP POLICY IF EXISTS atendimentos_seller_rw ON public.atendimentos;
-- CREATE POLICY atendimentos_seller_rw ON public.atendimentos FOR ALL TO authenticated
--   USING (seller_user_id = auth.uid()) WITH CHECK (seller_user_id = auth.uid());
-- COMMIT;

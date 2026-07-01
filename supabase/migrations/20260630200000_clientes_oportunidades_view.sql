-- ============================================================================
-- Migration: 20260630200000_clientes_oportunidades_view.sql
-- Epic:      EPIC-MX-CRM-VENDEDOR — Base Única (porte Base44, fase 3)
--
-- ACHADO: src/pages/FunilVendedor.tsx (tela real "Funil de Vendas") já lê
--   diretamente das tabelas `eventos_comerciais` e `clientes_oportunidades`
--   (nomenclatura do spec Base44) via `readRows()`. `eventos_comerciais` só
--   passou a existir na migration 20260630180000; `clientes_oportunidades`
--   nunca existiu — o schema real divide em `clientes` + `oportunidades`.
--   Resultado: a tela ficava sem base de "customers" (fallback de vendas
--   sem evento correspondente) e potencialmente em erro silencioso.
--
-- ESCOPO: view de compatibilidade (não tabela nova, não migra dado) que
--   expõe `oportunidades` no formato que `funil-vendas-diagnostico.ts`
--   já sabe consumir (campos duck-typed: vendido, status_oportunidade,
--   canal, seller_user_id, loja_id, data_venda). `security_invoker=true`
--   garante que a RLS de `oportunidades` seja respeitada pelo papel que
--   consulta a view (sem isso, a view rodaria com o dono do objeto e
--   vazaria dados entre vendedores).
-- ============================================================================

BEGIN;

CREATE OR REPLACE VIEW public.clientes_oportunidades
WITH (security_invoker = true) AS
SELECT
  o.id,
  o.cliente_id,
  o.seller_user_id,
  o.loja_id,
  o.canal,
  o.etapa,
  (o.etapa = 'ganho') AS vendido,
  CASE
    WHEN o.etapa = 'ganho' THEN 'vendido'
    WHEN o.etapa = 'perdido' THEN 'perdido'
    ELSE 'ativa'
  END AS status_oportunidade,
  o.closed_at AS data_venda,
  o.valor_negociado,
  o.created_at,
  o.updated_at
FROM public.oportunidades o;

COMMENT ON VIEW public.clientes_oportunidades IS
  'Compatibilidade com src/pages/FunilVendedor.tsx (nomenclatura Base44). security_invoker=true: RLS de oportunidades aplicada ao papel que consulta, não ao dono da view.';

GRANT SELECT ON public.clientes_oportunidades TO authenticated;

COMMIT;

-- ============================================================================
-- DOWN (reversão manual)
-- ============================================================================
-- BEGIN;
--   DROP VIEW IF EXISTS public.clientes_oportunidades;
-- COMMIT;

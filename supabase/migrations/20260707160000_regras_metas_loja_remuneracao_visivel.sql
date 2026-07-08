-- ============================================================================
-- Migration: 20260707160000_regras_metas_loja_remuneracao_visivel.sql
-- Scope: flag por loja para divulgar (ou nao) o detalhamento da logica de
--        comissionamento ao vendedor. Quando false, o vendedor ve o valor
--        total de comissao mas o drawer de detalhamento (regras/bonus/formula)
--        fica oculto. Padrao true (divulgar) — lojas existentes mantem o
--        comportamento atual. Aditivo, sem impacto em outras lojas.
-- ============================================================================

ALTER TABLE public.regras_metas_loja
  ADD COLUMN IF NOT EXISTS remuneracao_detalhes_visivel boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.regras_metas_loja.remuneracao_detalhes_visivel IS
  'Quando false, o vendedor ve o valor total de comissao mas o drawer de detalhamento (regras/bonus/formula) fica oculto. Padrao true (divulgar).';

NOTIFY pgrst, 'reload schema';

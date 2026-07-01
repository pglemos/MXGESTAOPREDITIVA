-- ============================================================================
-- Migration: 20260701130000_veiculos_estoque.sql
-- Epic:      EPIC-MX-CRM-VENDEDOR — Plano de Ataque / Veiculos Chegaram
--
-- ESCOPO: tabela de veiculos recem-chegados no estoque da loja, usada pela
--   aba "Plano de Ataque" da Carteira de Clientes (Base44
--   carteira/VeiculosChegaram.jsx) para cruzar com veiculo_interesse dos
--   clientes da carteira e sugerir abordagem. Escopo por LOJA (nao por
--   vendedor) - qualquer vendedor da loja registra e ve o estoque comum.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.veiculos_estoque (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id         uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  created_by      uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  marca           text NOT NULL,
  modelo          text NOT NULL,
  versao          text,
  ano             text,
  preco           numeric(12,2),
  data_entrada    date NOT NULL DEFAULT CURRENT_DATE,
  observacao      text,
  status          text NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'reservado', 'vendido')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.veiculos_estoque IS
  'Veiculos recem-chegados na loja, usados pela aba Plano de Ataque da Carteira para cruzar com veiculo_interesse dos clientes.';

CREATE INDEX IF NOT EXISTS idx_veiculos_estoque_loja_data
  ON public.veiculos_estoque(loja_id, data_entrada DESC);

DROP TRIGGER IF EXISTS trg_veiculos_estoque_updated_at ON public.veiculos_estoque;
CREATE TRIGGER trg_veiculos_estoque_updated_at BEFORE UPDATE ON public.veiculos_estoque
  FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

ALTER TABLE public.veiculos_estoque ENABLE ROW LEVEL SECURITY;

-- Qualquer vendedor/gerente/dono vinculado a loja le o estoque comum.
DROP POLICY IF EXISTS veiculos_estoque_loja_read ON public.veiculos_estoque;
CREATE POLICY veiculos_estoque_loja_read ON public.veiculos_estoque FOR SELECT TO authenticated
  USING (public.tem_papel_loja(loja_id, ARRAY['vendedor', 'gerente', 'dono']) OR public.eh_area_interna_mx());

-- Qualquer vendedor da loja pode registrar veiculo (mesma logica do Base44:
-- "Registrar veiculo" e uma acao operacional de qualquer vendedor).
DROP POLICY IF EXISTS veiculos_estoque_loja_insert ON public.veiculos_estoque;
CREATE POLICY veiculos_estoque_loja_insert ON public.veiculos_estoque FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.tem_papel_loja(loja_id, ARRAY['vendedor', 'gerente', 'dono']));

-- Update/delete restrito a quem criou ou gerencia a loja.
DROP POLICY IF EXISTS veiculos_estoque_loja_update ON public.veiculos_estoque;
CREATE POLICY veiculos_estoque_loja_update ON public.veiculos_estoque FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.tem_papel_loja(loja_id, ARRAY['gerente', 'dono']))
  WITH CHECK (created_by = auth.uid() OR public.tem_papel_loja(loja_id, ARRAY['gerente', 'dono']));

DROP POLICY IF EXISTS veiculos_estoque_loja_delete ON public.veiculos_estoque;
CREATE POLICY veiculos_estoque_loja_delete ON public.veiculos_estoque FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.tem_papel_loja(loja_id, ARRAY['gerente', 'dono']));

COMMIT;

-- ============================================================================
-- DOWN (reversao manual)
-- ============================================================================
-- BEGIN;
--   DROP TABLE IF EXISTS public.veiculos_estoque;
-- COMMIT;

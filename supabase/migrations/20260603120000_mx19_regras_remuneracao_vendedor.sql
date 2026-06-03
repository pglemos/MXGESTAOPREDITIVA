-- ============================================================================
-- Migration: 20260603120000_mx19_regras_remuneracao_vendedor.sql
-- Story:     MX-19.2 — Cadastro do Plano de Remuneração Atual
-- Scope:     Regras reais de comissão/bônus para alimentar salário estimado
--             na Home Vendedor sem valores hardcoded.
-- ============================================================================

BEGIN;

DO $$ BEGIN
  CREATE TYPE public.remuneracao_regra_tipo AS ENUM ('comissao_por_venda', 'bonus_meta');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.remuneracao_regras (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id             uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  cargo               text NOT NULL,
  tipo                public.remuneracao_regra_tipo NOT NULL,
  valor               numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  percentual_meta_min numeric(6,2) CHECK (percentual_meta_min IS NULL OR percentual_meta_min >= 0),
  ativo               boolean NOT NULL DEFAULT true,
  vigencia_inicio     date NOT NULL DEFAULT CURRENT_DATE,
  observacoes         text,
  created_by          uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.remuneracao_regras IS
  'MX-19.2: regras de comissão e bônus por cargo/loja para cálculo de remuneração estimada.';
COMMENT ON COLUMN public.remuneracao_regras.tipo IS
  'comissao_por_venda: valor multiplicado por vendas consideradas; bonus_meta: valor pago ao atingir percentual_meta_min.';
COMMENT ON COLUMN public.remuneracao_regras.percentual_meta_min IS
  'Percentual mínimo de atingimento para bonus_meta. Nulo para comissão por venda.';

CREATE INDEX IF NOT EXISTS idx_remuneracao_regras_loja_cargo
  ON public.remuneracao_regras (loja_id, cargo, ativo);

CREATE UNIQUE INDEX IF NOT EXISTS ux_remuneracao_regras_unique
  ON public.remuneracao_regras (
    loja_id,
    lower(cargo),
    tipo,
    vigencia_inicio,
    COALESCE(percentual_meta_min, -1)
  );

DROP TRIGGER IF EXISTS trg_remuneracao_regras_updated ON public.remuneracao_regras;
CREATE TRIGGER trg_remuneracao_regras_updated
  BEFORE UPDATE ON public.remuneracao_regras
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.remuneracao_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracao_regras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS remuneracao_planos_rw ON public.remuneracao_planos;
DROP POLICY IF EXISTS remuneracao_planos_select ON public.remuneracao_planos;
CREATE POLICY remuneracao_planos_select
  ON public.remuneracao_planos
  FOR SELECT
  TO authenticated
  USING (
    public.user_has_role(ARRAY['master','director','hr','admin_mx'])
    OR public.user_is_master_loja(loja_id)
    OR public.tem_papel_loja(loja_id, ARRAY['dono','gerente'], auth.uid())
    OR (lower(cargo) = 'vendedor' AND public.tem_papel_loja(loja_id, ARRAY['vendedor'], auth.uid()))
  );

DROP POLICY IF EXISTS remuneracao_planos_write ON public.remuneracao_planos;
CREATE POLICY remuneracao_planos_write
  ON public.remuneracao_planos
  FOR ALL
  TO authenticated
  USING (
    public.user_has_role(ARRAY['master','director','hr','admin_mx'])
    OR public.user_is_master_loja(loja_id)
    OR public.tem_papel_loja(loja_id, ARRAY['dono','gerente'], auth.uid())
  )
  WITH CHECK (
    public.user_has_role(ARRAY['master','director','hr','admin_mx'])
    OR public.user_is_master_loja(loja_id)
    OR public.tem_papel_loja(loja_id, ARRAY['dono','gerente'], auth.uid())
  );

DROP POLICY IF EXISTS remuneracao_regras_select ON public.remuneracao_regras;
CREATE POLICY remuneracao_regras_select
  ON public.remuneracao_regras
  FOR SELECT
  TO authenticated
  USING (
    public.user_has_role(ARRAY['master','director','hr','admin_mx'])
    OR public.user_is_master_loja(loja_id)
    OR public.tem_papel_loja(loja_id, ARRAY['dono','gerente'], auth.uid())
    OR (lower(cargo) = 'vendedor' AND public.tem_papel_loja(loja_id, ARRAY['vendedor'], auth.uid()))
  );

DROP POLICY IF EXISTS remuneracao_regras_write ON public.remuneracao_regras;
CREATE POLICY remuneracao_regras_write
  ON public.remuneracao_regras
  FOR ALL
  TO authenticated
  USING (
    public.user_has_role(ARRAY['master','director','hr','admin_mx'])
    OR public.user_is_master_loja(loja_id)
    OR public.tem_papel_loja(loja_id, ARRAY['dono','gerente'], auth.uid())
  )
  WITH CHECK (
    public.user_has_role(ARRAY['master','director','hr','admin_mx'])
    OR public.user_is_master_loja(loja_id)
    OR public.tem_papel_loja(loja_id, ARRAY['dono','gerente'], auth.uid())
  );

COMMIT;

-- ============================================================================
-- DOWN (rollback manual):
--   BEGIN;
--   DROP POLICY IF EXISTS remuneracao_regras_write ON public.remuneracao_regras;
--   DROP POLICY IF EXISTS remuneracao_regras_select ON public.remuneracao_regras;
--   DROP POLICY IF EXISTS remuneracao_planos_write ON public.remuneracao_planos;
--   DROP POLICY IF EXISTS remuneracao_planos_select ON public.remuneracao_planos;
--   DROP TRIGGER IF EXISTS trg_remuneracao_regras_updated ON public.remuneracao_regras;
--   DROP TABLE IF EXISTS public.remuneracao_regras;
--   DROP TYPE IF EXISTS public.remuneracao_regra_tipo;
--   COMMIT;
-- ============================================================================

-- ============================================================================
-- Migration: 20260707141000_vendedor_nivel_carreira.sql
-- Scope: nivel de carreira (junior/pleno/lider) por vendedor, atribuido
--        manualmente por dono/gerente (bonus de merito, plano Brothers Car).
--        Tabela dedicada porque vendedor_perfil tem RLS de escrita exclusiva
--        do proprio vendedor — nao da pra restringir por coluna dentro dela.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.vendedor_nivel_carreira (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_user_id  uuid NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
  loja_id         uuid REFERENCES public.lojas(id) ON DELETE SET NULL,
  nivel_carreira  text NOT NULL DEFAULT 'junior' CHECK (nivel_carreira IN ('junior', 'pleno', 'lider')),
  updated_by      uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.vendedor_nivel_carreira IS
  'Nivel de carreira do vendedor (merito), atribuido por dono/gerente. Consumido pelo motor de remuneracao (regra tipo=bonus_carreira).';

CREATE INDEX IF NOT EXISTS idx_vendedor_nivel_carreira_loja ON public.vendedor_nivel_carreira(loja_id);

DROP TRIGGER IF EXISTS trg_vendedor_nivel_carreira_updated_at ON public.vendedor_nivel_carreira;
CREATE TRIGGER trg_vendedor_nivel_carreira_updated_at BEFORE UPDATE ON public.vendedor_nivel_carreira
  FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

ALTER TABLE public.vendedor_nivel_carreira ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vendedor_nivel_carreira_seller_read ON public.vendedor_nivel_carreira;
CREATE POLICY vendedor_nivel_carreira_seller_read ON public.vendedor_nivel_carreira FOR SELECT TO authenticated
  USING (seller_user_id = auth.uid());

DROP POLICY IF EXISTS vendedor_nivel_carreira_manager_rw ON public.vendedor_nivel_carreira;
CREATE POLICY vendedor_nivel_carreira_manager_rw ON public.vendedor_nivel_carreira FOR ALL TO authenticated
  USING (
    public.user_has_role(ARRAY['master','director','hr','admin_mx'])
    OR (loja_id IS NOT NULL AND public.tem_papel_loja(loja_id, ARRAY['dono','gerente'], auth.uid()))
  )
  WITH CHECK (
    public.user_has_role(ARRAY['master','director','hr','admin_mx'])
    OR (loja_id IS NOT NULL AND public.tem_papel_loja(loja_id, ARRAY['dono','gerente'], auth.uid()))
  );

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- DOWN
-- ============================================================================
-- BEGIN;
--   DROP TABLE IF EXISTS public.vendedor_nivel_carreira;
-- COMMIT;

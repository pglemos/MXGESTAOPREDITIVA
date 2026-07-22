BEGIN;

-- Consultores MX podem abrir a visão operacional de gerente em modo de
-- simulação, mas permanecem somente leitura: a consolidação segue restrita a
-- administradores e perfis vinculados à loja. Libera apenas o read model já
-- consolidado para a área interna MX.
DROP POLICY IF EXISTS store_target_plans_select ON public.store_target_plans;
CREATE POLICY store_target_plans_select ON public.store_target_plans
FOR SELECT TO authenticated USING (
  public.eh_area_interna_mx((SELECT auth.uid()))
  OR public.is_manager_of(store_id)
  OR public.is_owner_of(store_id)
  OR EXISTS (
    SELECT 1 FROM public.vendedores_loja vl
    WHERE vl.store_id = store_target_plans.store_id
      AND vl.seller_user_id = (SELECT auth.uid())
      AND vl.is_active = true
      AND vl.started_at <= CURRENT_DATE
      AND (vl.ended_at IS NULL OR vl.ended_at >= CURRENT_DATE)
  )
);

COMMENT ON POLICY store_target_plans_select ON public.store_target_plans IS
  'Read-only target plans for internal MX and active store-scoped operational roles.';

COMMIT;

-- DOWN
-- BEGIN;
-- DROP POLICY IF EXISTS store_target_plans_select ON public.store_target_plans;
-- CREATE POLICY store_target_plans_select ON public.store_target_plans
-- FOR SELECT TO authenticated USING (
--   public.eh_administrador_mx((SELECT auth.uid()))
--   OR public.is_manager_of(store_id)
--   OR public.is_owner_of(store_id)
--   OR EXISTS (
--     SELECT 1 FROM public.vendedores_loja vl
--     WHERE vl.store_id = store_target_plans.store_id
--       AND vl.seller_user_id = (SELECT auth.uid())
--       AND vl.is_active = true
--       AND vl.started_at <= CURRENT_DATE
--       AND (vl.ended_at IS NULL OR vl.ended_at >= CURRENT_DATE)
--   )
-- );
-- COMMIT;

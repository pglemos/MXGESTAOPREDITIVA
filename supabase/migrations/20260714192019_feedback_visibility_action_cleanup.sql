-- Remove seller-facing actions when leadership keeps a feedback private.
-- This follows 20260714193000, which is already applied in linked projects.

BEGIN;

DROP POLICY IF EXISTS devolutiva_acoes_delete_manager ON public.devolutiva_acoes;
CREATE POLICY devolutiva_acoes_delete_manager
  ON public.devolutiva_acoes
  FOR DELETE TO authenticated
  USING (manager_id = auth.uid());

COMMIT;

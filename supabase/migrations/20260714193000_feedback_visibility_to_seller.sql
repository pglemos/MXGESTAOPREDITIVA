-- MX Feedback - visibility controlled by the manager
-- The manager may keep leadership-only observations without exposing them to
-- the seller, including through direct Supabase API access.

BEGIN;

ALTER TABLE public.devolutivas
  ADD COLUMN IF NOT EXISTS visible_to_seller boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.devolutivas.visible_to_seller IS
  'Whether the feedback and its seller-facing action are visible to the seller recipient.';

-- The legacy table was renamed from feedbacks to devolutivas, but PostgreSQL
-- preserves the original policy names. Recreate the seller branches so the
-- flag is enforced by RLS, not only by the frontend query.
DROP POLICY IF EXISTS role_matrix_feedbacks_select ON public.devolutivas;
CREATE POLICY role_matrix_feedbacks_select
  ON public.devolutivas AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    (SELECT is_admin())
    OR (SELECT is_owner_of(devolutivas.store_id))
    OR (SELECT is_manager_of(devolutivas.store_id))
    OR (devolutivas.seller_id = auth.uid() AND devolutivas.visible_to_seller)
  );

DROP POLICY IF EXISTS role_matrix_feedbacks_update ON public.devolutivas;
CREATE POLICY role_matrix_feedbacks_update
  ON public.devolutivas AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    (SELECT is_admin())
    OR (SELECT is_manager_of(devolutivas.store_id))
    OR (devolutivas.seller_id = auth.uid() AND devolutivas.visible_to_seller)
  )
  WITH CHECK (
    (SELECT is_admin())
    OR (SELECT is_manager_of(devolutivas.store_id))
    OR (devolutivas.seller_id = auth.uid() AND devolutivas.visible_to_seller)
  );

-- Do not expose or allow seller-side completion of actions attached to a
-- leadership-only feedback. Managers keep access to their own actions.
DROP POLICY IF EXISTS devolutiva_acoes_select_own ON public.devolutiva_acoes;
CREATE POLICY devolutiva_acoes_select_own
  ON public.devolutiva_acoes
  FOR SELECT TO authenticated
  USING (
    manager_id = auth.uid()
    OR (
      seller_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.devolutivas
        WHERE devolutivas.id = devolutiva_acoes.devolutiva_id
          AND devolutivas.visible_to_seller
      )
    )
  );

DROP POLICY IF EXISTS devolutiva_acoes_update_own_pending ON public.devolutiva_acoes;
CREATE POLICY devolutiva_acoes_update_own_pending
  ON public.devolutiva_acoes
  FOR UPDATE TO authenticated
  USING (
    seller_id = auth.uid()
    AND status = 'pendente'
    AND EXISTS (
      SELECT 1
      FROM public.devolutivas
      WHERE devolutivas.id = devolutiva_acoes.devolutiva_id
        AND devolutivas.visible_to_seller
    )
  )
  WITH CHECK (seller_id = auth.uid());

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================
-- DOWN
-- ============================================================

BEGIN;

DROP INDEX IF EXISTS public.idx_solicitacoes_consultoria_client_id;
DROP INDEX IF EXISTS public.idx_solicitacoes_consultoria_consultant_user_id;

DROP POLICY IF EXISTS solicitacoes_consultoria_select ON public.solicitacoes_consultoria;
CREATE POLICY solicitacoes_consultoria_select
  ON public.solicitacoes_consultoria
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR consultant_user_id = auth.uid()
    OR public.eh_area_interna_mx(auth.uid())
    OR public.user_is_master_loja(store_id, auth.uid())
    OR public.tem_papel_loja(store_id, ARRAY['dono'], auth.uid())
    OR public.is_owner_of(store_id)
  );

DROP POLICY IF EXISTS solicitacoes_consultoria_insert ON public.solicitacoes_consultoria;
CREATE POLICY solicitacoes_consultoria_insert
  ON public.solicitacoes_consultoria
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      public.eh_area_interna_mx(auth.uid())
      OR public.user_is_master_loja(store_id, auth.uid())
      OR public.tem_papel_loja(store_id, ARRAY['dono'], auth.uid())
      OR public.is_owner_of(store_id)
      OR (
        consultant_user_id = auth.uid()
        AND client_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.atribuicoes_consultoria assignment
          WHERE assignment.client_id = solicitacoes_consultoria.client_id
            AND assignment.user_id = auth.uid()
            AND assignment.active = true
        )
      )
    )
  );

DROP POLICY IF EXISTS solicitacoes_consultoria_update ON public.solicitacoes_consultoria;
CREATE POLICY solicitacoes_consultoria_update
  ON public.solicitacoes_consultoria
  FOR UPDATE
  TO authenticated
  USING (
    consultant_user_id = auth.uid()
    OR public.eh_area_interna_mx(auth.uid())
  )
  WITH CHECK (
    consultant_user_id = auth.uid()
    OR public.eh_area_interna_mx(auth.uid())
  );

CREATE POLICY solicitacoes_consultoria_cancel_own
  ON public.solicitacoes_consultoria
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() AND status = 'aberta')
  WITH CHECK (created_by = auth.uid() AND status IN ('aberta', 'cancelada'));

DROP POLICY IF EXISTS solicitacoes_consultoria_delete_internal ON public.solicitacoes_consultoria;
CREATE POLICY solicitacoes_consultoria_delete_internal
  ON public.solicitacoes_consultoria
  FOR DELETE
  TO authenticated
  USING (public.eh_area_interna_mx(auth.uid()));

COMMIT;

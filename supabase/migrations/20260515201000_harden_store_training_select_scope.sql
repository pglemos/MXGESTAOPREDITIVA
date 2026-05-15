-- Replace legacy broad training policies with store-scoped development content access.

DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'treinamentos'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.treinamentos', policy_row.policyname);
  END LOOP;
END $$;

CREATE POLICY treinamentos_select_scoped ON public.treinamentos
FOR SELECT TO authenticated
USING (
  public.eh_area_interna_mx(auth.uid())
  OR (
    active = true
    AND COALESCE(editorial_status, 'active') = 'active'
    AND (
      store_id IS NULL
      OR public.tem_papel_loja(store_id, ARRAY['dono','gerente','vendedor'], auth.uid())
    )
  )
);

CREATE POLICY treinamentos_insert_internal ON public.treinamentos
FOR INSERT TO authenticated
WITH CHECK (public.eh_area_interna_mx(auth.uid()));

CREATE POLICY treinamentos_update_internal ON public.treinamentos
FOR UPDATE TO authenticated
USING (public.eh_area_interna_mx(auth.uid()))
WITH CHECK (public.eh_area_interna_mx(auth.uid()));

CREATE POLICY treinamentos_delete_internal ON public.treinamentos
FOR DELETE TO authenticated
USING (public.eh_area_interna_mx(auth.uid()));

CREATE POLICY treinamentos_store_institutional_insert ON public.treinamentos
FOR INSERT TO authenticated
WITH CHECK (
  store_id IS NOT NULL
  AND source_kind = 'loja_institucional'
  AND (
    public.is_owner_of(store_id)
    OR public.is_manager_of(store_id)
  )
);

CREATE POLICY treinamentos_store_institutional_update ON public.treinamentos
FOR UPDATE TO authenticated
USING (
  store_id IS NOT NULL
  AND source_kind = 'loja_institucional'
  AND (
    public.is_owner_of(store_id)
    OR public.is_manager_of(store_id)
  )
)
WITH CHECK (
  store_id IS NOT NULL
  AND source_kind = 'loja_institucional'
  AND (
    public.is_owner_of(store_id)
    OR public.is_manager_of(store_id)
  )
);

CREATE POLICY treinamentos_store_institutional_delete ON public.treinamentos
FOR DELETE TO authenticated
USING (
  store_id IS NOT NULL
  AND source_kind = 'loja_institucional'
  AND (
    public.is_owner_of(store_id)
    OR public.is_manager_of(store_id)
  )
);

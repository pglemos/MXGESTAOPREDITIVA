-- Allow store leaders to manage their own institutional development content.

DROP POLICY IF EXISTS treinamentos_store_institutional_insert ON public.treinamentos;
CREATE POLICY treinamentos_store_institutional_insert ON public.treinamentos
FOR INSERT TO authenticated
WITH CHECK (
  store_id IS NOT NULL
  AND source_kind = 'loja_institucional'
  AND (
    public.eh_area_interna_mx(auth.uid())
    OR public.is_owner_of(store_id)
    OR public.is_manager_of(store_id)
  )
);

DROP POLICY IF EXISTS treinamentos_store_institutional_update ON public.treinamentos;
CREATE POLICY treinamentos_store_institutional_update ON public.treinamentos
FOR UPDATE TO authenticated
USING (
  store_id IS NOT NULL
  AND source_kind = 'loja_institucional'
  AND (
    public.eh_area_interna_mx(auth.uid())
    OR public.is_owner_of(store_id)
    OR public.is_manager_of(store_id)
  )
)
WITH CHECK (
  store_id IS NOT NULL
  AND source_kind = 'loja_institucional'
  AND (
    public.eh_area_interna_mx(auth.uid())
    OR public.is_owner_of(store_id)
    OR public.is_manager_of(store_id)
  )
);

DROP POLICY IF EXISTS treinamentos_store_institutional_delete ON public.treinamentos;
CREATE POLICY treinamentos_store_institutional_delete ON public.treinamentos
FOR DELETE TO authenticated
USING (
  store_id IS NOT NULL
  AND source_kind = 'loja_institucional'
  AND (
    public.eh_area_interna_mx(auth.uid())
    OR public.is_owner_of(store_id)
    OR public.is_manager_of(store_id)
  )
);

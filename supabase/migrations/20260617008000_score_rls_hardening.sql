-- Auditoria vendedor 2026-06-17 - hardening Score RLS
-- Substitui policies temporarias permissivas do motor score por leitura escopada
-- e escrita restrita. Service role/RPC SECURITY DEFINER continuam responsaveis
-- por calculos automaticos.

BEGIN;

CREATE OR REPLACE FUNCTION public.mx_can_read_score_scope(
  p_scope_type public.score_scope_type,
  p_scope_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_scope_id IS NOT NULL
    AND (
      public.user_has_role(ARRAY['admin_mx', 'master', 'consultant'])
      OR (
        p_scope_type = 'individual'::public.score_scope_type
        AND p_scope_id = auth.uid()
      )
      OR (
        p_scope_type = 'individual'::public.score_scope_type
        AND EXISTS (
          SELECT 1
          FROM public.vinculos_loja seller_link
          JOIN public.vinculos_loja leader_link
            ON leader_link.store_id = seller_link.store_id
          WHERE seller_link.user_id = p_scope_id
            AND seller_link.is_active = true
            AND leader_link.user_id = auth.uid()
            AND leader_link.is_active = true
            AND lower(leader_link.role) IN ('gerente', 'manager', 'dono', 'owner', 'master')
        )
      )
      OR (
        p_scope_type = 'store'::public.score_scope_type
        AND (
          public.is_manager_of(p_scope_id)
          OR public.is_owner_of(p_scope_id)
        )
      )
    );
$$;

COMMENT ON FUNCTION public.mx_can_read_score_scope(public.score_scope_type, uuid) IS
  'RLS helper para leitura de score por escopo: usuario proprio, lideranca da loja ou perfis internos MX.';

CREATE OR REPLACE FUNCTION public.mx_can_read_score_calculation(p_calculation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.score_calculations sc
    WHERE sc.id = p_calculation_id
      AND public.mx_can_read_score_scope(sc.scope_type, sc.scope_id)
  );
$$;

COMMENT ON FUNCTION public.mx_can_read_score_calculation(uuid) IS
  'RLS helper para tabelas dependentes de score_calculations, como history e observations.';

ALTER TABLE public.score_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS score_inputs_read ON public.score_inputs;
DROP POLICY IF EXISTS score_inputs_write ON public.score_inputs;
DROP POLICY IF EXISTS score_inputs_select_scoped ON public.score_inputs;
DROP POLICY IF EXISTS score_inputs_insert_internal ON public.score_inputs;

CREATE POLICY score_inputs_select_scoped
ON public.score_inputs
FOR SELECT
TO authenticated
USING (public.mx_can_read_score_scope(scope_type, scope_id));

CREATE POLICY score_inputs_insert_internal
ON public.score_inputs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND public.user_has_role(ARRAY['admin_mx', 'master'])
  AND public.mx_can_read_score_scope(scope_type, scope_id)
);

DROP POLICY IF EXISTS score_calc_read ON public.score_calculations;
DROP POLICY IF EXISTS score_calc_insert_service ON public.score_calculations;
DROP POLICY IF EXISTS score_calculations_select_scoped ON public.score_calculations;
DROP POLICY IF EXISTS score_calculations_insert_block_authenticated ON public.score_calculations;

CREATE POLICY score_calculations_select_scoped
ON public.score_calculations
FOR SELECT
TO authenticated
USING (public.mx_can_read_score_scope(scope_type, scope_id));

CREATE POLICY score_calculations_insert_block_authenticated
ON public.score_calculations
FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS score_history_read ON public.score_history;
DROP POLICY IF EXISTS score_history_select_scoped ON public.score_history;

CREATE POLICY score_history_select_scoped
ON public.score_history
FOR SELECT
TO authenticated
USING (public.mx_can_read_score_calculation(calculation_id));

DROP POLICY IF EXISTS score_obs_read ON public.score_observations;
DROP POLICY IF EXISTS score_obs_write ON public.score_observations;
DROP POLICY IF EXISTS score_observations_select_scoped ON public.score_observations;
DROP POLICY IF EXISTS score_observations_insert_consultive ON public.score_observations;

CREATE POLICY score_observations_select_scoped
ON public.score_observations
FOR SELECT
TO authenticated
USING (public.mx_can_read_score_calculation(calculation_id));

CREATE POLICY score_observations_insert_consultive
ON public.score_observations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND public.user_has_role(ARRAY['consultant', 'master', 'admin_mx'])
  AND public.mx_can_read_score_calculation(calculation_id)
);

COMMIT;

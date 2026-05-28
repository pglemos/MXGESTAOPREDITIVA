-- ============================================================================
-- Migration: 20260527170000_executive_schema_rls_hardening.sql
-- Stories:   MX-08, MX-09, MX-10
-- Scope:     Harden RLS for alerts, action plans and benchmark snapshots.
--
-- Rationale:
--   Earlier MX executive-schema migrations intentionally created the data
--   foundation first. This migration replaces broad read policies with
--   scope-aware access and adds audit history for action-plan changes.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Shared scope helper
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_access_mx_scope(
  p_scope_type public.score_scope_type,
  p_scope_id uuid,
  uid uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF uid IS NULL OR p_scope_id IS NULL THEN
    RETURN false;
  END IF;

  IF public.user_has_role(ARRAY['admin_mx', 'consultant'], uid)
     OR public.eh_area_interna_mx(uid) THEN
    RETURN true;
  END IF;

  IF p_scope_type = 'store'::public.score_scope_type THEN
    RETURN public.user_is_master_loja(p_scope_id, uid)
      OR public.tem_papel_loja(p_scope_id, ARRAY['dono', 'gerente'], uid)
      OR public.is_owner_of(p_scope_id)
      OR public.is_manager_of(p_scope_id);
  END IF;

  IF p_scope_type = 'individual'::public.score_scope_type THEN
    RETURN p_scope_id = uid
      OR EXISTS (
        SELECT 1
        FROM public.vinculos_loja meu
        JOIN public.vinculos_loja alvo ON alvo.store_id = meu.store_id
        WHERE meu.user_id = uid
          AND alvo.user_id = p_scope_id
          AND meu.role IN ('dono', 'gerente')
      );
  END IF;

  -- Department/process scopes need a persistent department/process -> store map.
  -- Until MX-15 lands that table, only internal MX roles can read those scopes.
  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.can_access_mx_scope(public.score_scope_type, uuid, uuid) IS
  'Escopo compartilhado para RLS de alertas, planos e benchmark. Store usa vinculos_loja; individual permite próprio usuário ou gestor da mesma loja; department/process ficam restritos até MX-15 mapear store.';

-- ----------------------------------------------------------------------------
-- 2. Action-plan audit history
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.historico_planos_acao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id uuid NOT NULL REFERENCES public.planos_acao(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  old_values jsonb NOT NULL,
  new_values jsonb NOT NULL,
  changed_fields text[] NOT NULL DEFAULT '{}'::text[]
);

CREATE INDEX IF NOT EXISTS idx_historico_planos_acao_plano
  ON public.historico_planos_acao(plano_id, changed_at DESC);

COMMENT ON TABLE public.historico_planos_acao IS
  'Histórico de mudanças críticas do Plano de Ação MX: status, prioridade, prazo, responsável e eficácia.';

CREATE OR REPLACE FUNCTION public.log_planos_acao_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fields text[] := ARRAY[]::text[];
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    v_fields := array_append(v_fields, 'status');
  END IF;
  IF NEW.prioridade IS DISTINCT FROM OLD.prioridade THEN
    v_fields := array_append(v_fields, 'prioridade');
  END IF;
  IF NEW.prazo IS DISTINCT FROM OLD.prazo THEN
    v_fields := array_append(v_fields, 'prazo');
  END IF;
  IF NEW.responsavel_id IS DISTINCT FROM OLD.responsavel_id THEN
    v_fields := array_append(v_fields, 'responsavel_id');
  END IF;
  IF NEW.eficacia_score IS DISTINCT FROM OLD.eficacia_score
     OR NEW.eficacia_nota IS DISTINCT FROM OLD.eficacia_nota THEN
    v_fields := array_append(v_fields, 'eficacia');
  END IF;

  IF array_length(v_fields, 1) IS NOT NULL THEN
    INSERT INTO public.historico_planos_acao (
      plano_id,
      changed_by,
      old_values,
      new_values,
      changed_fields
    )
    VALUES (
      NEW.id,
      auth.uid(),
      to_jsonb(OLD),
      to_jsonb(NEW),
      v_fields
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_planos_acao_changes ON public.planos_acao;
CREATE TRIGGER trg_log_planos_acao_changes
  AFTER UPDATE OF status, prioridade, prazo, responsavel_id, eficacia_score, eficacia_nota
  ON public.planos_acao
  FOR EACH ROW
  EXECUTE FUNCTION public.log_planos_acao_changes();

ALTER TABLE public.historico_planos_acao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS historico_planos_read ON public.historico_planos_acao;
CREATE POLICY historico_planos_read
  ON public.historico_planos_acao
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.planos_acao p
      WHERE p.id = historico_planos_acao.plano_id
        AND (
          public.can_access_mx_scope(p.scope_type, p.scope_id)
          OR p.responsavel_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS historico_planos_write_service ON public.historico_planos_acao;
CREATE POLICY historico_planos_write_service
  ON public.historico_planos_acao
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- ----------------------------------------------------------------------------
-- 3. Alerts RLS
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS alerts_read ON public.alerts;
CREATE POLICY alerts_read
  ON public.alerts
  FOR SELECT
  TO authenticated
  USING (public.can_access_mx_scope(scope_type, scope_id));

DROP POLICY IF EXISTS alerts_update_status ON public.alerts;
CREATE POLICY alerts_update_status
  ON public.alerts
  FOR UPDATE
  TO authenticated
  USING (
    public.can_access_mx_scope(scope_type, scope_id)
    AND public.user_has_role(ARRAY['master', 'director', 'sales_manager', 'consultant', 'admin_mx'])
  )
  WITH CHECK (
    public.can_access_mx_scope(scope_type, scope_id)
    AND public.user_has_role(ARRAY['master', 'director', 'sales_manager', 'consultant', 'admin_mx'])
  );

DROP POLICY IF EXISTS alert_channels_read ON public.alert_channels;
CREATE POLICY alert_channels_read
  ON public.alert_channels
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.alerts a
      WHERE a.id = alert_channels.alert_id
        AND public.can_access_mx_scope(a.scope_type, a.scope_id)
    )
  );

-- ----------------------------------------------------------------------------
-- 4. Action-plan RLS
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS planos_read ON public.planos_acao;
CREATE POLICY planos_read
  ON public.planos_acao
  FOR SELECT
  TO authenticated
  USING (
    public.can_access_mx_scope(scope_type, scope_id)
    OR responsavel_id = auth.uid()
  );

DROP POLICY IF EXISTS planos_write ON public.planos_acao;
CREATE POLICY planos_write
  ON public.planos_acao
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_access_mx_scope(scope_type, scope_id)
    AND public.user_has_role(ARRAY['master', 'director', 'sales_manager', 'consultant', 'admin_mx'])
  );

DROP POLICY IF EXISTS planos_update ON public.planos_acao;
CREATE POLICY planos_update
  ON public.planos_acao
  FOR UPDATE
  TO authenticated
  USING (
    (
      public.can_access_mx_scope(scope_type, scope_id)
      AND public.user_has_role(ARRAY['master', 'director', 'sales_manager', 'consultant', 'admin_mx'])
    )
    OR responsavel_id = auth.uid()
  )
  WITH CHECK (
    (
      public.can_access_mx_scope(scope_type, scope_id)
      AND public.user_has_role(ARRAY['master', 'director', 'sales_manager', 'consultant', 'admin_mx'])
    )
    OR responsavel_id = auth.uid()
  );

DROP POLICY IF EXISTS planos_delete ON public.planos_acao;
CREATE POLICY planos_delete
  ON public.planos_acao
  FOR DELETE
  TO authenticated
  USING (
    public.can_access_mx_scope(scope_type, scope_id)
    AND public.user_has_role(ARRAY['master', 'admin_mx'])
  );

-- ----------------------------------------------------------------------------
-- 5. Benchmark RLS
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS bench_read ON public.benchmark_snapshots;
CREATE POLICY bench_read
  ON public.benchmark_snapshots
  FOR SELECT
  TO authenticated
  USING (
    public.eh_area_interna_mx(auth.uid())
    OR public.user_is_master_loja(loja_id)
    OR public.tem_papel_loja(loja_id, ARRAY['dono', 'gerente'], auth.uid())
    OR public.is_owner_of(loja_id)
    OR public.is_manager_of(loja_id)
  );

-- Writes remain blocked for authenticated users; service_role bypasses RLS.

COMMIT;

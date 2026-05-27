-- ============================================================================
-- Migration: 20260527140000_alerts_engine_schema.sql
-- Story:     EPIC-MX-08 (Sistema de Alertas — FR-ALERT-1 a FR-ALERT-4)
-- PRD:       docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md §4.6
-- Fonte:     .docx §223–§240
--
-- ESCOPO: schema da engine de alertas rule-based (2026 — sem LLM, NFR-IA1).
--   - 4 tipos: critical | warning | positive | consultive
--   - Estrutura obrigatória: problema, impacto, recomendação, ação rápida (FR-ALERT-2)
--   - Canais: sistema, push, WhatsApp (FR-ALERT-3) — schema preparado, integrações futuras
--   - Status de ciclo de vida: open | acknowledged | resolved | dismissed
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. ENUMs
-- ----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.alert_type AS ENUM ('critical', 'warning', 'positive', 'consultive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_status AS ENUM ('open', 'acknowledged', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_channel AS ENUM ('system', 'push', 'whatsapp');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 1. alerts — registro principal
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.alerts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type          public.score_scope_type NOT NULL,  -- reusa enum de score
  scope_id            uuid NOT NULL,
  type                public.alert_type NOT NULL,

  -- Estrutura obrigatória (FR-ALERT-2)
  problem             text NOT NULL CHECK (length(trim(problem)) > 0),
  impact              text NOT NULL CHECK (length(trim(impact)) > 0),
  recommendation      text NOT NULL CHECK (length(trim(recommendation)) > 0),
  quick_action_label  text,

  -- Ciclo de vida
  status              public.alert_status NOT NULL DEFAULT 'open',
  acknowledged_at     timestamptz,
  acknowledged_by     uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  resolved_at         timestamptz,
  resolved_by         uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  dismissed_at        timestamptz,
  dismissed_by        uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,

  -- Auditoria/origem
  rule_version        text NOT NULL,  -- identifica qual regra gerou
  metadata            jsonb DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),

  -- Consistência
  CHECK (
    (status = 'open' AND acknowledged_at IS NULL AND resolved_at IS NULL AND dismissed_at IS NULL) OR
    (status = 'acknowledged' AND acknowledged_at IS NOT NULL AND resolved_at IS NULL AND dismissed_at IS NULL) OR
    (status = 'resolved' AND resolved_at IS NOT NULL) OR
    (status = 'dismissed' AND dismissed_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_alerts_scope_status
  ON public.alerts(scope_type, scope_id, status);

CREATE INDEX IF NOT EXISTS idx_alerts_open_type
  ON public.alerts(type, created_at DESC) WHERE status = 'open';

COMMENT ON TABLE public.alerts IS
  'Alertas consultivos gerados pela engine rule-based MX (FR-ALERT, .docx §223–§240).';
COMMENT ON COLUMN public.alerts.rule_version IS
  'Identifica regra/versão que gerou o alerta — permite auditoria e migração de regras.';

-- ----------------------------------------------------------------------------
-- 2. alert_channels — registro de envios por canal (FR-ALERT-3)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.alert_channels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id    uuid NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  channel     public.alert_channel NOT NULL,
  sent_at     timestamptz,
  delivered_at timestamptz,
  error       text,
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (alert_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_alert_channels_alert
  ON public.alert_channels(alert_id);

COMMENT ON TABLE public.alert_channels IS
  'Tracking de envio por canal (system/push/WhatsApp) — preparado para integrações futuras.';

-- ----------------------------------------------------------------------------
-- 3. RLS — usando helpers MX-2.2
-- ----------------------------------------------------------------------------

ALTER TABLE public.alerts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_channels  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alerts_read ON public.alerts;
CREATE POLICY alerts_read
  ON public.alerts
  FOR SELECT
  TO authenticated
  USING (true);  -- permissivo: UI consume amplo

-- INSERT: apenas service_role (engine determinística)
DROP POLICY IF EXISTS alerts_insert_service ON public.alerts;
CREATE POLICY alerts_insert_service
  ON public.alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- UPDATE de status (acknowledge/resolve/dismiss): roles operacionais
DROP POLICY IF EXISTS alerts_update_status ON public.alerts;
CREATE POLICY alerts_update_status
  ON public.alerts
  FOR UPDATE
  TO authenticated
  USING (
    public.user_has_role(ARRAY['master','director','sales_manager','consultant','admin_mx'])
  )
  WITH CHECK (
    public.user_has_role(ARRAY['master','director','sales_manager','consultant','admin_mx'])
  );

DROP POLICY IF EXISTS alert_channels_read ON public.alert_channels;
CREATE POLICY alert_channels_read
  ON public.alert_channels
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS alert_channels_write_service ON public.alert_channels;
CREATE POLICY alert_channels_write_service
  ON public.alert_channels
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- ----------------------------------------------------------------------------
-- 4. RPC: ack_alert + resolve_alert + dismiss_alert (idempotentes)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.ack_alert(p_alert_id uuid)
RETURNS public.alerts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert public.alerts;
BEGIN
  IF NOT public.user_has_role(ARRAY['master','director','sales_manager','consultant','admin_mx']) THEN
    RAISE EXCEPTION 'insuficiente: requer role operacional' USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.alerts
  SET status = 'acknowledged',
      acknowledged_at = COALESCE(acknowledged_at, now()),
      acknowledged_by = COALESCE(acknowledged_by, auth.uid())
  WHERE id = p_alert_id AND status = 'open'
  RETURNING * INTO v_alert;
  RETURN v_alert;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_alert(p_alert_id uuid)
RETURNS public.alerts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert public.alerts;
BEGIN
  IF NOT public.user_has_role(ARRAY['master','director','sales_manager','consultant','admin_mx']) THEN
    RAISE EXCEPTION 'insuficiente: requer role operacional' USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.alerts
  SET status = 'resolved',
      resolved_at = COALESCE(resolved_at, now()),
      resolved_by = COALESCE(resolved_by, auth.uid())
  WHERE id = p_alert_id AND status IN ('open', 'acknowledged')
  RETURNING * INTO v_alert;
  RETURN v_alert;
END;
$$;

CREATE OR REPLACE FUNCTION public.dismiss_alert(p_alert_id uuid, p_reason text DEFAULT NULL)
RETURNS public.alerts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert public.alerts;
BEGIN
  IF NOT public.user_has_role(ARRAY['master','director','sales_manager','consultant','admin_mx']) THEN
    RAISE EXCEPTION 'insuficiente: requer role operacional' USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.alerts
  SET status = 'dismissed',
      dismissed_at = COALESCE(dismissed_at, now()),
      dismissed_by = COALESCE(dismissed_by, auth.uid()),
      metadata = metadata || jsonb_build_object('dismiss_reason', p_reason)
  WHERE id = p_alert_id AND status NOT IN ('resolved', 'dismissed')
  RETURNING * INTO v_alert;
  RETURN v_alert;
END;
$$;

COMMIT;

-- ============================================================================
-- Migration: 20260527190000_executive_agenda_schema.sql
-- Story:     MX-11 (Agenda Executiva)
-- Scope:     Product-level executive agenda model with manual, Google Calendar
--            and Outlook source contracts.
-- ============================================================================

BEGIN;

DO $$ BEGIN
  CREATE TYPE public.executive_agenda_kind AS ENUM (
    'compromisso',
    'reuniao',
    'lembrete',
    'acompanhamento'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.executive_agenda_source AS ENUM (
    'manual',
    'google_calendar',
    'outlook'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.executive_agenda_integration_status AS ENUM (
    'conectado',
    'pendente',
    'erro',
    'desconectado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.touch_mx_executive_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.eventos_agenda_executiva (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  kind public.executive_agenda_kind NOT NULL,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  public_summary text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  all_day boolean NOT NULL DEFAULT false,

  source public.executive_agenda_source NOT NULL DEFAULT 'manual',
  integration_status public.executive_agenda_integration_status NOT NULL DEFAULT 'desconectado',
  integration_error text,
  google_event_id text,
  outlook_event_id text,

  responsavel_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  plano_acao_id uuid REFERENCES public.planos_acao(id) ON DELETE SET NULL,
  visita_id uuid REFERENCES public.visitas_consultoria(id) ON DELETE SET NULL,
  alert_id uuid REFERENCES public.alerts(id) ON DELETE SET NULL,

  source_ref jsonb NOT NULL DEFAULT '{}'::jsonb,
  private_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CHECK (ends_at IS NULL OR ends_at >= starts_at),
  CHECK (
    source <> 'google_calendar'
    OR google_event_id IS NOT NULL
    OR integration_status IN ('pendente', 'erro', 'desconectado')
  ),
  CHECK (
    source <> 'outlook'
    OR outlook_event_id IS NOT NULL
    OR integration_status IN ('pendente', 'erro', 'desconectado')
  )
);

CREATE INDEX IF NOT EXISTS idx_eventos_agenda_executiva_loja_periodo
  ON public.eventos_agenda_executiva(loja_id, starts_at DESC);

CREATE INDEX IF NOT EXISTS idx_eventos_agenda_executiva_responsavel
  ON public.eventos_agenda_executiva(responsavel_id, starts_at DESC)
  WHERE responsavel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_eventos_agenda_executiva_plano
  ON public.eventos_agenda_executiva(plano_acao_id)
  WHERE plano_acao_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_eventos_agenda_executiva_alerta
  ON public.eventos_agenda_executiva(alert_id)
  WHERE alert_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_eventos_agenda_executiva_visita
  ON public.eventos_agenda_executiva(visita_id)
  WHERE visita_id IS NOT NULL;

COMMENT ON TABLE public.eventos_agenda_executiva IS
  'Agenda executiva produto MX: compromissos, reunioes, lembretes e acompanhamentos vinculados a loja, plano de acao, visita, alerta e responsavel.';

COMMENT ON COLUMN public.eventos_agenda_executiva.private_payload IS
  'Dados sensiveis importados de calendarios externos. Consumidores devem preferir title/public_summary e aplicar verificacao de permissao antes de exibir detalhes.';

DROP TRIGGER IF EXISTS trg_eventos_agenda_executiva_touch ON public.eventos_agenda_executiva;
CREATE TRIGGER trg_eventos_agenda_executiva_touch
  BEFORE UPDATE ON public.eventos_agenda_executiva
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_mx_executive_updated_at();

ALTER TABLE public.eventos_agenda_executiva ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS eventos_agenda_executiva_read ON public.eventos_agenda_executiva;
CREATE POLICY eventos_agenda_executiva_read
  ON public.eventos_agenda_executiva
  FOR SELECT
  TO authenticated
  USING (
    public.can_access_mx_scope('store'::public.score_scope_type, loja_id)
    OR responsavel_id = auth.uid()
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS eventos_agenda_executiva_insert ON public.eventos_agenda_executiva;
CREATE POLICY eventos_agenda_executiva_insert
  ON public.eventos_agenda_executiva
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_access_mx_scope('store'::public.score_scope_type, loja_id)
    AND public.user_has_role(ARRAY['master', 'director', 'sales_manager', 'consultant', 'admin_mx'])
  );

DROP POLICY IF EXISTS eventos_agenda_executiva_update ON public.eventos_agenda_executiva;
CREATE POLICY eventos_agenda_executiva_update
  ON public.eventos_agenda_executiva
  FOR UPDATE
  TO authenticated
  USING (
    (
      public.can_access_mx_scope('store'::public.score_scope_type, loja_id)
      AND public.user_has_role(ARRAY['master', 'director', 'sales_manager', 'consultant', 'admin_mx'])
    )
    OR responsavel_id = auth.uid()
  )
  WITH CHECK (
    (
      public.can_access_mx_scope('store'::public.score_scope_type, loja_id)
      AND public.user_has_role(ARRAY['master', 'director', 'sales_manager', 'consultant', 'admin_mx'])
    )
    OR responsavel_id = auth.uid()
  );

DROP POLICY IF EXISTS eventos_agenda_executiva_delete ON public.eventos_agenda_executiva;
CREATE POLICY eventos_agenda_executiva_delete
  ON public.eventos_agenda_executiva
  FOR DELETE
  TO authenticated
  USING (
    public.can_access_mx_scope('store'::public.score_scope_type, loja_id)
    AND public.user_has_role(ARRAY['master', 'admin_mx'])
  );

COMMIT;

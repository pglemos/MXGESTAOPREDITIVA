-- ============================================================
-- CONS-12: Cronograma 2026 MX - staging, eventos/aulas e chaves de importacao
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.consulting_clients
  ADD COLUMN IF NOT EXISTS source_import_key text,
  ADD COLUMN IF NOT EXISTS source_payload jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS consulting_clients_source_import_key_uidx
  ON public.consulting_clients (source_import_key)
  WHERE source_import_key IS NOT NULL;

ALTER TABLE public.consulting_visits
  ADD COLUMN IF NOT EXISTS source_import_key text,
  ADD COLUMN IF NOT EXISTS source_visit_code text,
  ADD COLUMN IF NOT EXISTS source_payload jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS consulting_visits_source_import_key_uidx
  ON public.consulting_visits (source_import_key)
  WHERE source_import_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS consulting_visits_google_event_id_uidx
  ON public.consulting_visits (google_event_id)
  WHERE google_event_id IS NOT NULL AND google_event_id <> '';

CREATE TABLE IF NOT EXISTS public.consulting_schedule_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  title text NOT NULL,
  topic text,
  starts_at timestamptz NOT NULL,
  duration_hours numeric DEFAULT 1 NOT NULL,
  modality text NOT NULL DEFAULT 'Online',
  location text,
  target_audience text,
  audience_goal numeric,
  responsible_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  responsible_name text,
  ticket_price_text text,
  google_event_id text,
  status text NOT NULL DEFAULT 'agendado',
  source_sheet text,
  source_import_key text,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consulting_schedule_events_type_check CHECK (event_type = ANY (ARRAY['aula', 'evento_online', 'evento_presencial', 'bloqueio'])),
  CONSTRAINT consulting_schedule_events_status_check CHECK (status = ANY (ARRAY['agendado', 'cancelado', 'concluido']))
);

CREATE UNIQUE INDEX IF NOT EXISTS consulting_schedule_events_source_import_key_uidx
  ON public.consulting_schedule_events (source_import_key)
  WHERE source_import_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS consulting_schedule_events_google_event_id_uidx
  ON public.consulting_schedule_events (google_event_id)
  WHERE google_event_id IS NOT NULL AND google_event_id <> '';

CREATE INDEX IF NOT EXISTS consulting_schedule_events_starts_at_idx
  ON public.consulting_schedule_events (starts_at);

CREATE INDEX IF NOT EXISTS consulting_schedule_events_responsible_idx
  ON public.consulting_schedule_events (responsible_user_id);

DROP TRIGGER IF EXISTS update_consulting_schedule_events_updated_at ON public.consulting_schedule_events;
CREATE TRIGGER update_consulting_schedule_events_updated_at
BEFORE UPDATE ON public.consulting_schedule_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

CREATE TABLE IF NOT EXISTS public.consulting_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL,
  source_path text,
  status text NOT NULL DEFAULT 'running',
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consulting_import_batches_status_check CHECK (status = ANY (ARRAY['running', 'completed', 'failed']))
);

CREATE TABLE IF NOT EXISTS public.consulting_import_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.consulting_import_batches(id) ON DELETE CASCADE,
  source_sheet text NOT NULL,
  row_number integer NOT NULL,
  entity_type text NOT NULL,
  source_import_key text,
  status text NOT NULL DEFAULT 'staged',
  message text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consulting_import_rows_status_check CHECK (status = ANY (ARRAY['staged', 'imported', 'skipped', 'error']))
);

CREATE INDEX IF NOT EXISTS consulting_import_rows_batch_idx
  ON public.consulting_import_rows (batch_id, source_sheet, status);

ALTER TABLE public.consulting_schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_import_rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consulting_schedule_events_select ON public.consulting_schedule_events;
CREATE POLICY consulting_schedule_events_select ON public.consulting_schedule_events
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS consulting_schedule_events_write ON public.consulting_schedule_events;
CREATE POLICY consulting_schedule_events_write ON public.consulting_schedule_events
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS consulting_import_batches_select ON public.consulting_import_batches;
CREATE POLICY consulting_import_batches_select ON public.consulting_import_batches
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS consulting_import_batches_write ON public.consulting_import_batches;
CREATE POLICY consulting_import_batches_write ON public.consulting_import_batches
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS consulting_import_rows_select ON public.consulting_import_rows;
CREATE POLICY consulting_import_rows_select ON public.consulting_import_rows
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS consulting_import_rows_write ON public.consulting_import_rows;
CREATE POLICY consulting_import_rows_write ON public.consulting_import_rows
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

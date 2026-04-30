-- Adds central-calendar mirror for visits + sync timestamp
ALTER TABLE public.consulting_visits
  ADD COLUMN IF NOT EXISTS google_event_id_central text,
  ADD COLUMN IF NOT EXISTS google_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS consulting_visits_google_event_central_idx
  ON public.consulting_visits (google_event_id_central);

COMMENT ON COLUMN public.consulting_visits.google_event_id_central
  IS 'Event ID na agenda central MX (gestao@mxconsultoria.com.br) — mirror da agenda pessoal do consultor.';

COMMENT ON COLUMN public.consulting_visits.google_synced_at
  IS 'Timestamp da última sincronização bem-sucedida com Google Calendar.';

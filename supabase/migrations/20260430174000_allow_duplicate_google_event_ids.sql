-- ============================================================
-- CONS-12: ID Google pode repetir na fonte; unicidade deve ser da linha importada
-- ============================================================

DROP INDEX IF EXISTS public.consulting_visits_google_event_id_uidx;
DROP INDEX IF EXISTS public.consulting_schedule_events_google_event_id_uidx;

CREATE INDEX IF NOT EXISTS consulting_visits_google_event_id_idx
  ON public.consulting_visits (google_event_id)
  WHERE google_event_id IS NOT NULL AND google_event_id <> '';

CREATE INDEX IF NOT EXISTS consulting_schedule_events_google_event_id_idx
  ON public.consulting_schedule_events (google_event_id)
  WHERE google_event_id IS NOT NULL AND google_event_id <> '';

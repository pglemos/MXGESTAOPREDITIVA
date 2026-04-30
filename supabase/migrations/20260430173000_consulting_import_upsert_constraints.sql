-- ============================================================
-- CONS-12: Constraints para upsert idempotente via PostgREST
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'consulting_clients_source_import_key_key'
  ) THEN
    ALTER TABLE public.consulting_clients
      ADD CONSTRAINT consulting_clients_source_import_key_key UNIQUE (source_import_key);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'consulting_visits_source_import_key_key'
  ) THEN
    ALTER TABLE public.consulting_visits
      ADD CONSTRAINT consulting_visits_source_import_key_key UNIQUE (source_import_key);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'consulting_schedule_events_source_import_key_key'
  ) THEN
    ALTER TABLE public.consulting_schedule_events
      ADD CONSTRAINT consulting_schedule_events_source_import_key_key UNIQUE (source_import_key);
  END IF;
END $$;
